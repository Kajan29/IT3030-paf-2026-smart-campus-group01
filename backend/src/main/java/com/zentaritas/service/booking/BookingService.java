package com.zentaritas.service.booking;

import com.zentaritas.dto.booking.BookingRequestDTO;
import com.zentaritas.dto.booking.BookingResultDTO;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.*;
import com.zentaritas.repository.booking.*;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.management.RoomRepository;
import com.zentaritas.service.auth.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * Service for managing room bookings
 * Handles creation, approval, cancellation, OTP verification, and business logic validation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final RoomBookingRepository roomBookingRepository;
    private final AvailabilityEngineService availabilityEngineService;
    private final BookingValidationRulesService rulesService;
    private final BookingNotificationRepository notificationRepository;
    private final RoomRepository roomRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final String OTP_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0,O,1,I to avoid confusion
    private static final int OTP_LENGTH = 4;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ============= BOOKING CREATION =============

    /**
     * Create a new room booking with automatic conflict detection
     */
    @Transactional
    public BookingResultDTO createBooking(BookingRequestDTO request, User booker) {
        log.info("Creating booking for user {} in room {}", booker.getId(), request.getRoomId());

        // 0. Check if user is restricted from booking
        if (Boolean.TRUE.equals(booker.getBookingRestricted())) {
            String reason = booker.getBookingRestrictionReason() != null
                    ? booker.getBookingRestrictionReason()
                    : "No-show violation";
            return new BookingResultDTO(false, null, List.of(
                    "Your booking access has been restricted by administration (" + reason + "). " +
                    "Please visit the Contact Us page to resolve this issue."));
        }

        // 1. Validate input
        List<String> validationErrors = rulesService.validateBookingRequest(request, booker);
        if (!validationErrors.isEmpty()) {
            return new BookingResultDTO(false, null, validationErrors);
        }

        // 2. Parse startTime and endTime from LocalDateTime
        LocalDateTime startDateTime = request.getStartTime();
        LocalDateTime endDateTime = request.getEndTime();

        if (startDateTime == null || endDateTime == null) {
            return new BookingResultDTO(false, null, List.of("Start and end times are required"));
        }

        // 3. Check for user-level time conflict (same user booking at overlapping time)
        List<RoomBooking> userOverlaps = roomBookingRepository.findUserOverlappingBookings(
                booker.getId(), startDateTime, endDateTime);
        if (!userOverlaps.isEmpty()) {
            RoomBooking existing = userOverlaps.get(0);
            String timeStr = existing.getStartTime().toLocalTime() + " - " + existing.getEndTime().toLocalTime();
            return new BookingResultDTO(false, null, List.of(
                    "You already have a booking at this time (" + timeStr + "). Please choose a different time slot."));
        }

        // 4. Get room and check if booking is available
        var room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (!room.getBookingAvailable()) {
            return new BookingResultDTO(false, null, List.of("Room booking is not available"));
        }

        // 4b. Room must have an assigned staff member for student bookings
        if (request.getBookingType() == RoomBooking.BookingType.STUDENT && room.getAssignedStaff() == null) {
            return new BookingResultDTO(false, null, List.of("This room does not have assigned staff for check-in verification. Please choose a different room."));
        }

        // 5. Check seat capacity - how many seats are already booked for this time
        int seatsAlreadyBooked = roomBookingRepository.countBookedSeatsForRoomInTimeRange(
                request.getRoomId(), startDateTime, endDateTime);
        int seatsRequested = request.getSeatsBooked() != null ? request.getSeatsBooked() : 1;
        int totalCapacity = room.getSeatingCapacity() != null ? room.getSeatingCapacity() : 0;

        if (totalCapacity > 0 && (seatsAlreadyBooked + seatsRequested) > totalCapacity) {
            int remainingSeats = Math.max(0, totalCapacity - seatsAlreadyBooked);
            return new BookingResultDTO(false, null, List.of(
                    "This room is fully booked for this time slot. Only " + remainingSeats + " seat(s) remaining out of " + totalCapacity + "."));
        }

        // 6. Check availability (timetable/blackout conflicts)
        AvailabilityEngineService.RoomAvailabilityStatus availabilityStatus = availabilityEngineService.checkRoomAvailability(
                request.getRoomId(), startDateTime, endDateTime
        );

        RoomBooking.BookingStatus initialStatus;
        if (request.getBookingType() == RoomBooking.BookingType.STUDENT) {
            // Student bookings always require admin approval.
            initialStatus = RoomBooking.BookingStatus.PENDING;
        } else {
            initialStatus = availabilityStatus.status == AvailabilityEngineService.AvailabilityStatus.AVAILABLE
                    ? RoomBooking.BookingStatus.APPROVED
                    : RoomBooking.BookingStatus.PENDING;
        }

        // 7. Create booking with status based on role and availability
        RoomBooking booking = RoomBooking.builder()
                .room(room)
                .booker(booker)
                .bookingType(request.getBookingType())
                .startTime(startDateTime)
                .endTime(endDateTime)
                .purpose(request.getPurpose())
                .participantsCount(request.getParticipantsCount())
                .seatsBooked(seatsRequested)
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .recurringPattern(request.getRecurringPattern())
                .recurringEndDate(request.getRecurringEndDate())
                .requiresOverride(availabilityStatus.status == AvailabilityEngineService.AvailabilityStatus.RESERVED)
                .createdById(booker.getId())
                .status(initialStatus)
                .build();

        RoomBooking savedBooking = roomBookingRepository.save(booking);
        log.info("Booking created with ID {} and status {}", savedBooking.getId(), savedBooking.getStatus());

        // 8. Send notifications
        if (booking.getStatus() == RoomBooking.BookingStatus.APPROVED) {
            createNotification(savedBooking, BookingNotification.NotificationType.BOOKING_CONFIRMED, booker);
        } else if (booking.getStatus() == RoomBooking.BookingStatus.PENDING) {
            createNotification(savedBooking, BookingNotification.NotificationType.BOOKING_PENDING, booker);
            notificationService.notifyAdmins(
                    BookingNotification.NotificationType.BOOKING_PENDING,
                    "Booking Approval Required",
                    "A new booking request from " + booker.getEmail() + " is waiting for admin approval.",
                    savedBooking.getId(),
                    null,
                    "/admin?view=bookings"
            );
        }

        return new BookingResultDTO(true, savedBooking, null);
    }

    /**
     * Approve a pending booking (admin action) — generates OTP and sends to user via email
     */
    @Transactional
    public BookingResult approveBooking(Long bookingId, User approver, String notes) {
        log.info("Approving booking {} by user {}", bookingId, approver.getId());

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() != RoomBooking.BookingStatus.PENDING) {
            return new BookingResult(false, null, List.of("Only pending bookings can be approved"));
        }

        // Generate 4-char alphanumeric OTP
        String otp = generateOtp();

        booking.setStatus(RoomBooking.BookingStatus.APPROVED);
        booking.setApprovedById(approver.getId());
        booking.setApprovalNotes(notes);
        booking.setCheckInOtp(otp);
        booking.setOtpSentAt(LocalDateTime.now());

        // Auto-assign the room's permanently assigned staff (if any)
        if (booking.getAssignedStaff() == null && booking.getRoom().getAssignedStaff() != null) {
            booking.setAssignedStaff(booking.getRoom().getAssignedStaff());
            log.info("Auto-assigned room staff {} to booking {}", booking.getRoom().getAssignedStaff().getId(), bookingId);
        }

        RoomBooking updatedBooking = roomBookingRepository.save(booking);
        log.info("Booking {} approved with OTP", bookingId);

        // Send OTP email to the booker
        try {
            emailService.sendBookingOtpEmail(
                    booking.getBooker().getEmail(),
                    booking.getBooker().getFirstName(),
                    otp,
                    booking.getRoom().getName(),
                    booking.getStartTime().toString(),
                    booking.getEndTime().toString()
            );
        } catch (Exception e) {
            log.error("Failed to send OTP email for booking {}", bookingId, e);
            // Don't fail the approval if email fails
        }

        createNotification(updatedBooking, BookingNotification.NotificationType.BOOKING_CONFIRMED, booking.getBooker());

        return new BookingResult(true, updatedBooking, null);
    }

    /**
     * Assign non-academic staff to manage bookings
     */
    @Transactional
    public BookingResult assignStaffToBooking(Long bookingId, Long staffId) {
        log.info("Assigning staff {} to booking {}", staffId, bookingId);

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found"));

        booking.setAssignedStaff(staff);
        RoomBooking updatedBooking = roomBookingRepository.save(booking);

        return new BookingResult(true, updatedBooking, null);
    }

    /**
     * Verify OTP and mark attendance (staff action)
     */
    @Transactional
    public BookingResult verifyOtpAndMarkAttendance(Long bookingId, String otp, Long staffId) {
        log.info("Verifying OTP for booking {} by staff {}", bookingId, staffId);

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getCheckInOtp() == null) {
            return new BookingResult(false, null, List.of("No OTP has been generated for this booking"));
        }

        if (!booking.getCheckInOtp().equalsIgnoreCase(otp)) {
            return new BookingResult(false, null, List.of("Invalid OTP. Please try again."));
        }

        // OTP is valid — return booking details (don't mark attended yet, staff reviews first)
        return new BookingResult(true, booking, null);
    }

    /**
     * Mark booking as attended after staff review
     */
    @Transactional
    public BookingResult markAttended(Long bookingId, Long staffId) {
        log.info("Marking booking {} as attended by staff {}", bookingId, staffId);

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        booking.setAttended(true);
        booking.setAttendedAt(LocalDateTime.now());
        booking.setVerifiedByStaffId(staffId);
        booking.setStatus(RoomBooking.BookingStatus.ATTENDED);

        RoomBooking updatedBooking = roomBookingRepository.save(booking);
        log.info("Booking {} marked as attended", bookingId);

        return new BookingResult(true, updatedBooking, null);
    }

    /**
     * Mark booking as no-show (staff action when user doesn't attend)
     * Notifies all admins about the no-show
     */
    @Transactional
    public BookingResult markNoShow(Long bookingId, Long staffId) {
        log.info("Marking booking {} as no-show by staff {}", bookingId, staffId);

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() != RoomBooking.BookingStatus.APPROVED &&
            booking.getStatus() != RoomBooking.BookingStatus.CONFIRMED) {
            return new BookingResult(false, null, List.of("Only approved or confirmed bookings can be marked as no-show"));
        }

        booking.setAttended(false);
        booking.setVerifiedByStaffId(staffId);
        booking.setStatus(RoomBooking.BookingStatus.NO_SHOW);

        RoomBooking updatedBooking = roomBookingRepository.save(booking);
        log.info("Booking {} marked as no-show", bookingId);

        // Notify the user about no-show
        createNotification(updatedBooking, BookingNotification.NotificationType.BOOKING_NO_SHOW, booking.getBooker());

        // Notify all admins about the no-show
        String bookerName = booking.getBooker().getFirstName() + " " + booking.getBooker().getLastName();
        String roomName = booking.getRoom().getName();
        notificationService.notifyAdmins(
                BookingNotification.NotificationType.BOOKING_NO_SHOW,
                "Booking No-Show Alert",
                bookerName + " did not attend their booking for " + roomName +
                        " (" + booking.getStartTime() + " - " + booking.getEndTime() + "). " +
                        "Consider restricting this user's booking access.",
                updatedBooking.getId(),
                null,
                "/admin?view=users"
        );

        return new BookingResult(true, updatedBooking, null);
    }

    /**
     * Get bookings assigned to a staff member for today
     */
    public List<RoomBooking> getTodayBookingsForStaff(Long staffId) {
        LocalDateTime dayStart = LocalDate.now().atStartOfDay();
        LocalDateTime dayEnd = LocalDate.now().atTime(LocalTime.MAX);
        return roomBookingRepository.findTodayBookingsForStaff(staffId, dayStart, dayEnd);
    }

    /**
     * Get all bookings assigned to a staff member
     */
    public List<RoomBooking> getBookingsForStaff(Long staffId) {
        return roomBookingRepository.findBookingsForStaff(staffId);
    }

    /**
     * Get available seats for a room at a given time
     */
    public Map<String, Integer> getRoomSeatAvailability(Long roomId, LocalDateTime startTime, LocalDateTime endTime) {
        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        int totalCapacity = room.getSeatingCapacity() != null ? room.getSeatingCapacity() : 0;
        int seatsBooked = roomBookingRepository.countBookedSeatsForRoomInTimeRange(roomId, startTime, endTime);
        int available = Math.max(0, totalCapacity - seatsBooked);

        Map<String, Integer> result = new LinkedHashMap<>();
        result.put("totalCapacity", totalCapacity);
        result.put("seatsBooked", seatsBooked);
        result.put("seatsAvailable", available);
        return result;
    }

    /**
     * Reject a pending booking (admin action)
     */
    @Transactional
    public BookingResult rejectBooking(Long bookingId, User approver, String reason) {
        log.info("Rejecting booking {} by user {}", bookingId, approver.getId());

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() != RoomBooking.BookingStatus.PENDING) {
            return new BookingResult(false, null, List.of("Only pending bookings can be rejected"));
        }

        booking.setStatus(RoomBooking.BookingStatus.REJECTED);
        booking.setApprovedById(approver.getId());
        booking.setCancelledReason(reason);

        RoomBooking updatedBooking = roomBookingRepository.save(booking);
        log.info("Booking {} rejected", bookingId);

        createNotification(updatedBooking, BookingNotification.NotificationType.BOOKING_REJECTED, booking.getBooker());

        return new BookingResult(true, updatedBooking, null);
    }

    /**
     * Cancel a booking
     */
    @Transactional
    public BookingResult cancelBooking(Long bookingId, String reason) {
        log.info("Cancelling booking {}", bookingId);

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() == RoomBooking.BookingStatus.CANCELLED) {
            return new BookingResult(false, null, List.of("Booking is already cancelled"));
        }

        booking.setStatus(RoomBooking.BookingStatus.CANCELLED);
        booking.setCancelledReason(reason);

        RoomBooking updatedBooking = roomBookingRepository.save(booking);
        log.info("Booking {} cancelled", bookingId);

        createNotification(updatedBooking, BookingNotification.NotificationType.BOOKING_CANCELLED, booking.getBooker());

        return new BookingResult(true, updatedBooking, null);
    }

    // ============= BOOKING RETRIEVAL =============

    public List<RoomBooking> getPendingBookings() {
        return roomBookingRepository.findPendingBookings();
    }

    public List<RoomBooking> getPendingBookingsForRoom(Long roomId) {
        return roomBookingRepository.findPendingBookingsForRoom(roomId);
    }

    public List<RoomBooking> getBookingsForUser(Long userId) {
        return roomBookingRepository.findStudentBookingsByUser(userId);
    }

    public List<RoomBooking> getAllBookings(RoomBooking.BookingStatus status) {
        if (status == null) {
            return roomBookingRepository.findAllByOrderByCreatedAtDesc();
        }
        return roomBookingRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public List<RoomBooking> getBookingsInDateRange(Long roomId, LocalDateTime startDate, LocalDateTime endDate) {
        return roomBookingRepository.findBookingsInDateRange(roomId, startDate, endDate);
    }

    // ============= HELPER METHODS =============

    /**
     * Generate a 4-character alphanumeric OTP (letters + numbers)
     */
    private String generateOtp() {
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(OTP_CHARS.charAt(SECURE_RANDOM.nextInt(OTP_CHARS.length())));
        }
        return sb.toString();
    }

    private void createNotification(RoomBooking booking, BookingNotification.NotificationType type, User recipient) {
        BookingNotification notification = BookingNotification.builder()
                .user(recipient)
                .type(type)
                .relatedBookingId(booking.getId())
                .title(getNotificationTitle(type))
                .message(getNotificationMessage(booking, type))
                .eventDate(booking.getStartTime())
                .status(BookingNotification.NotificationStatus.PENDING)
                .build();

        notificationRepository.save(notification);
        log.debug("Notification created for booking {}: {}", booking.getId(), type);
    }

    private String getNotificationTitle(BookingNotification.NotificationType type) {
        return switch (type) {
            case BOOKING_CONFIRMED -> "Booking Confirmed!";
            case BOOKING_PENDING -> "Booking Pending Approval";
            case BOOKING_REJECTED -> "Booking Rejected";
            case BOOKING_CANCELLED -> "Booking Cancelled";
            case BOOKING_NO_SHOW -> "Booking No-Show";
            case BOOKING_RESTRICTED -> "Booking Access Restricted";
            case BOOKING_UNRESTRICTED -> "Booking Access Restored";
            default -> "Booking Notification";
        };
    }

    private String getNotificationMessage(RoomBooking booking, BookingNotification.NotificationType type) {
        String roomName = booking.getRoom().getName();
        String timeSlot = booking.getStartTime() + " to " + booking.getEndTime();

        return switch (type) {
            case BOOKING_CONFIRMED -> "Your booking for " + roomName + " on " + timeSlot + " has been confirmed!";
            case BOOKING_PENDING -> "Your booking for " + roomName + " is awaiting admin approval.";
            case BOOKING_REJECTED -> "Your booking for " + roomName + " has been rejected.";
            case BOOKING_CANCELLED -> "Your booking for " + roomName + " has been cancelled.";
            case BOOKING_NO_SHOW -> "You were marked as no-show for your booking at " + roomName + " on " + timeSlot + ". Please contact administration if this was an error.";
            case BOOKING_RESTRICTED -> "Your booking access has been restricted due to a no-show. Please visit the Contact Us page to resolve this.";
            case BOOKING_UNRESTRICTED -> "Your booking access has been restored. You can now make room bookings again.";
            default -> "Booking notification for " + roomName;
        };
    }

    // ============= DTOs =============

    public static class BookingRequest {
        public Long roomId;
        public LocalDateTime startTime;
        public LocalDateTime endTime;
        public RoomBooking.BookingType bookingType;
        public String purpose;
        public Integer participantsCount;
        public Integer seatsBooked; // For student bookings
        public Boolean isRecurring = false;
        public String recurringPattern;
        public LocalDateTime recurringEndDate;
    }

    public static class BookingResult {
        public final boolean success;
        public final RoomBooking booking;
        public final List<String> errors;

        public BookingResult(boolean success, RoomBooking booking, List<String> errors) {
            this.success = success;
            this.booking = booking;
            this.errors = errors != null ? errors : Collections.emptyList();
        }
    }
}
