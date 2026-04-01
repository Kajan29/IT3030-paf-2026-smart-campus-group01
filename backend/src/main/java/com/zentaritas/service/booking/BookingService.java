package com.zentaritas.service.booking;

import com.zentaritas.controller.booking.dto.BookingRequestDTO;
import com.zentaritas.controller.booking.dto.BookingResultDTO;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.*;
import com.zentaritas.repository.booking.*;
import com.zentaritas.repository.management.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for managing room bookings
 * Handles creation, approval, cancellation, and business logic validation
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

    // ============= BOOKING CREATION =============

    /**
     * Create a new room booking with automatic conflict detection
     */
    @Transactional
    public BookingResultDTO createBooking(BookingRequestDTO request, User booker) {
        log.info("Creating booking for user {} in room {}", booker.getId(), request.getRoomId());

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

        // 3. Get room and check if booking is available
        var room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (!room.getBookingAvailable()) {
            return new BookingResultDTO(false, null, List.of("Room booking is not available"));
        }

        // 4. Check availability
        AvailabilityEngineService.RoomAvailabilityStatus availabilityStatus = availabilityEngineService.checkRoomAvailability(
                request.getRoomId(), startDateTime, endDateTime
        );

        // 5. Create booking with status based on availability
        RoomBooking booking = RoomBooking.builder()
                .room(room)
                .booker(booker)
                .bookingType(request.getBookingType())
                .startTime(startDateTime)
                .endTime(endDateTime)
                .purpose(request.getPurpose())
                .participantsCount(request.getParticipantsCount())
                .seatsBooked(request.getSeatsBooked())
                .isRecurring(request.getIsRecurring())
                .recurringPattern(request.getRecurringPattern())
                .recurringEndDate(request.getRecurringEndDate())
                .requiresOverride(availabilityStatus.status == AvailabilityEngineService.AvailabilityStatus.RESERVED)
                .createdById(booker.getId())
                // If available, approve directly; else set to pending
                .status(availabilityStatus.status == AvailabilityEngineService.AvailabilityStatus.AVAILABLE ?
                        RoomBooking.BookingStatus.APPROVED : RoomBooking.BookingStatus.PENDING)
                .build();

        RoomBooking savedBooking = roomBookingRepository.save(booking);
        log.info("Booking created with ID {} and status {}", savedBooking.getId(), savedBooking.getStatus());

        // 6. Send notifications
        if (booking.getStatus() == RoomBooking.BookingStatus.APPROVED) {
            createNotification(savedBooking, BookingNotification.NotificationType.BOOKING_CONFIRMED, booker);
        } else if (booking.getRequiresOverride()) {
            createNotification(savedBooking, BookingNotification.NotificationType.BOOKING_PENDING, booker);
        }

        return new BookingResultDTO(true, savedBooking, null);
    }

    /**
     * Approve a pending booking (admin action)
     */
    @Transactional
    public BookingResult approveBooking(Long bookingId, User approver, String notes) {
        log.info("Approving booking {} by user {}", bookingId, approver.getId());

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() != RoomBooking.BookingStatus.PENDING) {
            return new BookingResult(false, null, List.of("Only pending bookings can be approved"));
        }

        booking.setStatus(RoomBooking.BookingStatus.CONFIRMED);
        booking.setApprovedById(approver.getId());
        booking.setApprovalNotes(notes);

        RoomBooking updatedBooking = roomBookingRepository.save(booking);
        log.info("Booking {} approved", bookingId);

        createNotification(updatedBooking, BookingNotification.NotificationType.BOOKING_CONFIRMED, booking.getBooker());

        return new BookingResult(true, updatedBooking, null);
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

    public List<RoomBooking> getBookingsInDateRange(Long roomId, LocalDateTime startDate, LocalDateTime endDate) {
        return roomBookingRepository.findBookingsInDateRange(roomId, startDate, endDate);
    }

    // ============= HELPER METHODS =============

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
