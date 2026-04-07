package com.zentaritas.service.booking;

import com.zentaritas.controller.booking.dto.BookingRequestDTO;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.RoomBooking;
import com.zentaritas.model.booking.TimeslotBlackout;
import com.zentaritas.model.management.Room;
import com.zentaritas.repository.booking.RoomBookingRepository;
import com.zentaritas.repository.booking.RoomTimetableRepository;
import com.zentaritas.repository.booking.TimeslotBlackoutRepository;
import com.zentaritas.repository.management.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Smart Rules Engine for booking validation
 * Enforces business rules like:
 * - Students can only book 1 seat
 * - Staff can book whole rooms
 * - Prevents double bookings
 * - Validates capacity
 * - Time duration limits
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingValidationRulesService {

    private final RoomRepository roomRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final TimeslotBlackoutRepository timeslotBlackoutRepository;
    private final RoomTimetableRepository roomTimetableRepository;

    // Business rule constants
    private static final int MAX_STUDENT_BOOKING_DURATION_HOURS = 2;
    private static final int MAX_STAFF_BOOKING_DURATION_HOURS = 8;
    private static final int MIN_BOOKING_DURATION_MINUTES = 30;
    private static final int DAYS_IN_ADVANCE_STUDENT_CAN_BOOK = 30;
    private static final int DAYS_IN_ADVANCE_STAFF_CAN_BOOK = 90;
    private static final int NEXT_AVAILABLE_SLOT_MINUTES = 30;
    private static final int NEXT_AVAILABLE_LOOKAHEAD_DAYS = 30;
    private static final int MAX_DAILY_STUDENT_BOOKINGS = 2;
    private static final int MAX_WEEKLY_STUDENT_BOOKINGS = 8;
    private static final int MAX_MONTHLY_STUDENT_BOOKINGS = 24;
    private static final int MAX_DAILY_STAFF_BOOKINGS = 4;
    private static final int MAX_WEEKLY_STAFF_BOOKINGS = 20;
    private static final int MAX_MONTHLY_STAFF_BOOKINGS = 60;
    private static final EnumSet<RoomBooking.BookingStatus> ACTIVE_BOOKING_STATUSES = EnumSet.of(
            RoomBooking.BookingStatus.PENDING,
            RoomBooking.BookingStatus.APPROVED,
            RoomBooking.BookingStatus.CONFIRMED
    );

    /**
     * Main validation method
     * Returns list of validation errors (empty = valid)
     */
    public List<String> validateBookingRequest(BookingRequestDTO request, User booker) {
        List<String> errors = new ArrayList<>();

        log.debug("Validating booking request for user {} (role: {})", booker.getId(), booker.getRole());

        // Basic validations
        errors.addAll(validateBasicFields(request));

        // Role-specific validations
        if (booker.getRole() == Role.STUDENT) {
            errors.addAll(validateStudentBooking(request));
        } else if (booker.getRole() == Role.ACADEMIC_STAFF || booker.getRole() == Role.NON_ACADEMIC_STAFF) {
            errors.addAll(validateStaffBooking(request));
        }

        // Room-specific validations
        Room room = roomRepository.findById(request.getRoomId()).orElse(null);
        if (room != null) {
            errors.addAll(validateRoomSuitability(request, room, booker));
            errors.addAll(validateRoomOperatingHours(request, room));
        }

        return errors;
    }

    // ============= VALIDATION RULE GROUPS =============

    private List<String> validateBasicFields(BookingRequestDTO request) {
        List<String> errors = new ArrayList<>();

        if (request.getRoomId() == null) {
            errors.add("Room ID is required");
        }

        if (request.getStartTime() == null || request.getEndTime() == null) {
            errors.add("Start time and end time are required");
        } else {
            // Check start before end
            if (!request.getStartTime().isBefore(request.getEndTime())) {
                errors.add("Start time must be before end time");
            }

            // Check minimum duration
            Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
            if (duration.toMinutes() < MIN_BOOKING_DURATION_MINUTES) {
                errors.add("Booking duration must be at least " + MIN_BOOKING_DURATION_MINUTES + " minutes");
            }

            // Check not in past
            if (request.getStartTime().isBefore(LocalDateTime.now())) {
                errors.add("Cannot book times in the past");
            }
        }

        if (request.getPurpose() == null || request.getPurpose().trim().isEmpty()) {
            errors.add("Booking purpose is required");
        }

        if (request.getBookingType() == null) {
            errors.add("Booking type is required");
        }

        return errors;
    }

    private List<String> validateStudentBooking(BookingRequestDTO request) {
        List<String> errors = new ArrayList<>();

        // Rule: Only 1 seat per student per booking
        if (request.getSeatsBooked() == null || request.getSeatsBooked() != 1) {
            errors.add("Students can only book 1 seat per booking");
        }

        // Rule: Max duration 2 hours
        if (request.getStartTime() != null && request.getEndTime() != null) {
            Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
            if (duration.toHours() > MAX_STUDENT_BOOKING_DURATION_HOURS) {
                errors.add("Student bookings cannot exceed " + MAX_STUDENT_BOOKING_DURATION_HOURS + " hours");
            }
        }

        // Rule: Can only book max 30 days in advance
        if (request.getStartTime() != null) {
            long daysFromNow = Duration.between(LocalDateTime.now(), request.getStartTime()).toDays();
            if (daysFromNow > DAYS_IN_ADVANCE_STUDENT_CAN_BOOK) {
                errors.add("Students can only book up to " + DAYS_IN_ADVANCE_STUDENT_CAN_BOOK + " days in advance");
            }
        }

        log.debug("Student booking validation: {} errors found", errors.size());
        return errors;
    }

    private List<String> validateStaffBooking(BookingRequestDTO request) {
        List<String> errors = new ArrayList<>();

        // Rule: Max duration 8 hours
        if (request.getStartTime() != null && request.getEndTime() != null) {
            Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
            if (duration.toHours() > MAX_STAFF_BOOKING_DURATION_HOURS) {
                errors.add("Staff bookings cannot exceed " + MAX_STAFF_BOOKING_DURATION_HOURS + " hours");
            }
        }

        // Rule: Can book up to 90 days in advance
        if (request.getStartTime() != null) {
            long daysFromNow = Duration.between(LocalDateTime.now(), request.getStartTime()).toDays();
            if (daysFromNow > DAYS_IN_ADVANCE_STAFF_CAN_BOOK) {
                errors.add("Staff can only book up to " + DAYS_IN_ADVANCE_STAFF_CAN_BOOK + " days in advance");
            }
        }

        log.debug("Staff booking validation: {} errors found", errors.size());
        return errors;
    }

    private List<String> validateRoomSuitability(BookingRequestDTO request, Room room, User booker) {
        List<String> errors = new ArrayList<>();

        // Rule: Students cannot book lecture halls or lab rooms (only study rooms)
        if (booker.getRole() == Role.STUDENT) {
            List<String> nonStudentRoomTypes = Arrays.asList("Lecture Hall", "Lab", "Seminar Hall");
            if (nonStudentRoomTypes.stream().anyMatch(rt -> room.getType().equalsIgnoreCase(rt))) {
                errors.add("Students can only book study rooms, not " + room.getType());
            }

            // Rule: Check room capacity exceeds booking size
            if (request.getParticipantsCount() != null && request.getParticipantsCount() > room.getSeatingCapacity()) {
                errors.add("Room capacity (" + room.getSeatingCapacity() + ") is less than participants (" + request.getParticipantsCount() + ")");
            }
        }

        // Rule: Room must be in good condition
        if (!room.getCondition().equalsIgnoreCase("Excellent") && !room.getCondition().equalsIgnoreCase("Good")) {
            errors.add("Room is not in suitable condition: " + room.getCondition());
        }

        // Rule: Room must be operational
        if (!room.getMaintenanceStatus().equalsIgnoreCase("Operational")) {
            errors.add("Room is currently under maintenance");
        }

        log.debug("Room suitability validation: {} errors found", errors.size());
        return errors;
    }

    // ============= BUSINESS LOGIC HELPER METHODS =============

    /**
     * Check if user has exceeded their booking quota for a period
     */
    public boolean hasExceededBookingQuota(User user, String period) {
        if (user == null || user.getId() == null) {
            return false;
        }

        String normalizedPeriod = period == null ? "" : period.trim().toLowerCase(Locale.ROOT);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime periodStart;
        LocalDateTime periodEnd;

        switch (normalizedPeriod) {
            case "daily" -> {
                periodStart = now.truncatedTo(ChronoUnit.DAYS);
                periodEnd = periodStart.plusDays(1);
            }
            case "weekly" -> {
                periodStart = now.truncatedTo(ChronoUnit.DAYS).minusDays(now.getDayOfWeek().getValue() - 1L);
                periodEnd = periodStart.plusWeeks(1);
            }
            case "monthly" -> {
                periodStart = now.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
                periodEnd = periodStart.plusMonths(1);
            }
            default -> {
                log.warn("Unknown booking quota period: {}", period);
                return false;
            }
        }

        long bookingsInPeriod = roomBookingRepository.findByBookerId(user.getId()).stream()
                .filter(this::isActiveBooking)
                .filter(booking -> !booking.getStartTime().isBefore(periodStart) && booking.getStartTime().isBefore(periodEnd))
                .count();

        return bookingsInPeriod >= getQuotaLimit(user.getRole(), normalizedPeriod);
    }

    /**
     * Get next available booking time for a room
     */
    public LocalDateTime getNextAvailableTime(Room room, LocalDateTime fromTime) {
        if (room == null || room.getId() == null || fromTime == null) {
            return fromTime;
        }

        LocalDateTime cursor = fromTime.truncatedTo(ChronoUnit.MINUTES);
        LocalDateTime searchEnd = cursor.plusDays(NEXT_AVAILABLE_LOOKAHEAD_DAYS);

        while (!cursor.isAfter(searchEnd)) {
            LocalDateTime slotEnd = cursor.plusMinutes(NEXT_AVAILABLE_SLOT_MINUTES);
            boolean hasBookingConflict = !roomBookingRepository
                    .findConflictingBookings(room.getId(), cursor, slotEnd)
                    .isEmpty();
            boolean hasBlackoutConflict = !timeslotBlackoutRepository
                    .findConflictingBlackouts(room.getId(), cursor, slotEnd)
                    .isEmpty();
            boolean hasTimetableConflict = !roomTimetableRepository
                .findConflictingEntries(room.getId(), cursor.getDayOfWeek().name(), cursor.toLocalTime(), slotEnd.toLocalTime())
                .isEmpty();

            if (!hasBookingConflict && !hasBlackoutConflict && !hasTimetableConflict) {
                return cursor;
            }

            cursor = cursor.plusMinutes(NEXT_AVAILABLE_SLOT_MINUTES);
        }

        return fromTime;
    }

    /**
     * Check if booking conflicts with user's other bookings
     */
    public boolean hasUserScheduleConflict(User user, LocalDateTime startTime, LocalDateTime endTime) {
        if (user == null || user.getId() == null || startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            return false;
        }

        return roomBookingRepository.findByBookerId(user.getId()).stream()
                .filter(this::isActiveBooking)
                .anyMatch(booking -> hasTimeOverlap(startTime, endTime, booking.getStartTime(), booking.getEndTime()));
    }

    private boolean hasTimeOverlap(LocalDateTime startA, LocalDateTime endA,
                                   LocalDateTime startB, LocalDateTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private boolean isActiveBooking(RoomBooking booking) {
        return booking != null && booking.getStatus() != null && ACTIVE_BOOKING_STATUSES.contains(booking.getStatus());
    }

    /**
     * Get smart suggestions for similar available rooms
     */
    public List<Room> getSuggestedAlternativeRooms(Room originalRoom, LocalDateTime startTime, LocalDateTime endTime) {
        if (originalRoom == null || originalRoom.getBuilding() == null || startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            return Collections.emptyList();
        }

        List<Room> roomsInBuilding = roomRepository.findByBuildingIdOrderByNameAsc(originalRoom.getBuilding().getId());

        return roomsInBuilding.stream()
                .filter(room -> !Objects.equals(room.getId(), originalRoom.getId()))
                .filter(room -> room.getBookingAvailable() != null && room.getBookingAvailable())
                .filter(room -> equalsIgnoreCase(room.getType(), originalRoom.getType()))
                .filter(room -> equalsIgnoreCase(room.getMaintenanceStatus(), "Operational"))
                .filter(room -> equalsIgnoreCase(room.getCondition(), "Excellent") || equalsIgnoreCase(room.getCondition(), "Good"))
                .filter(room -> roomBookingRepository.findConflictingBookings(room.getId(), startTime, endTime).isEmpty())
                .filter(room -> timeslotBlackoutRepository.findConflictingBlackouts(room.getId(), startTime, endTime).isEmpty())
                .filter(room -> roomTimetableRepository.findConflictingEntries(room.getId(), startTime.getDayOfWeek().name(), startTime.toLocalTime(), endTime.toLocalTime()).isEmpty())
                .sorted(Comparator.comparingInt(room -> Math.abs(room.getSeatingCapacity() - originalRoom.getSeatingCapacity())))
                .limit(5)
                .toList();
    }

    /**
     * Validate room request doesn't conflict with critical events
     */
    public boolean hasConflictWithCriticalEvents(Room room, LocalDateTime startTime, LocalDateTime endTime) {
        if (room == null || room.getId() == null || startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            return false;
        }

        return timeslotBlackoutRepository.findConflictingBlackouts(room.getId(), startTime, endTime).stream()
                .map(TimeslotBlackout::getType)
                .anyMatch(type -> type == TimeslotBlackout.BlackoutType.EVENT
                        || type == TimeslotBlackout.BlackoutType.RESERVED
                        || type == TimeslotBlackout.BlackoutType.EMERGENCY);
    }

    private List<String> validateRoomOperatingHours(BookingRequestDTO request, Room room) {
        List<String> errors = new ArrayList<>();

        if (request.getStartTime() == null || request.getEndTime() == null) {
            return errors;
        }

        LocalDateTime start = request.getStartTime();
        LocalDateTime end = request.getEndTime();
        LocalTime roomOpen = room.getOpeningTime() != null ? room.getOpeningTime() : LocalTime.of(8, 0);
        LocalTime roomClose = room.getClosingTime() != null ? room.getClosingTime() : LocalTime.of(18, 0);

        if (start.toLocalTime().isBefore(roomOpen) || end.toLocalTime().isAfter(roomClose)) {
            errors.add("Requested time is outside the room operating hours");
        }

        if (Boolean.TRUE.equals(room.getClosedOnWeekends())) {
            if (start.getDayOfWeek().getValue() >= 6) {
                errors.add("Selected building is closed on weekends");
            }
        }

        if (!roomTimetableRepository.findConflictingEntries(room.getId(), start.getDayOfWeek().name(), start.toLocalTime(), end.toLocalTime()).isEmpty()) {
            errors.add("Selected time overlaps with the room timetable");
        }

        return errors;
    }

    private int getQuotaLimit(Role role, String period) {
        if (role == Role.STUDENT) {
            return switch (period) {
                case "daily" -> MAX_DAILY_STUDENT_BOOKINGS;
                case "weekly" -> MAX_WEEKLY_STUDENT_BOOKINGS;
                case "monthly" -> MAX_MONTHLY_STUDENT_BOOKINGS;
                default -> Integer.MAX_VALUE;
            };
        }

        return switch (period) {
            case "daily" -> MAX_DAILY_STAFF_BOOKINGS;
            case "weekly" -> MAX_WEEKLY_STAFF_BOOKINGS;
            case "monthly" -> MAX_MONTHLY_STAFF_BOOKINGS;
            default -> Integer.MAX_VALUE;
        };
    }

    private boolean equalsIgnoreCase(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }
}
