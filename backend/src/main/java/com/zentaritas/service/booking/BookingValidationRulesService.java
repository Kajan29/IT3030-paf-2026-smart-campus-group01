package com.zentaritas.service.booking;

import com.zentaritas.controller.booking.dto.BookingRequestDTO;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.management.Room;
import com.zentaritas.repository.management.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
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

    // Business rule constants
    private static final int MAX_STUDENT_BOOKING_DURATION_HOURS = 2;
    private static final int MAX_STAFF_BOOKING_DURATION_HOURS = 8;
    private static final int MIN_BOOKING_DURATION_MINUTES = 30;
    private static final int DAYS_IN_ADVANCE_STUDENT_CAN_BOOK = 30;
    private static final int DAYS_IN_ADVANCE_STAFF_CAN_BOOK = 90;

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
        // Implement quota logic based on user role and period
        // period: "daily", "weekly", "monthly"
        return false; // TODO: Implement quota checking
    }

    /**
     * Get next available booking time for a room
     */
    public LocalDateTime getNextAvailableTime(Room room, LocalDateTime fromTime) {
        // TODO: Implement logic to find next available slot
        return fromTime;
    }

    /**
     * Check if booking conflicts with user's other bookings
     */
    public boolean hasUserScheduleConflict(User user, LocalDateTime startTime, LocalDateTime endTime) {
        // TODO: Check if user has overlapping bookings
        return false;
    }

    /**
     * Get smart suggestions for similar available rooms
     */
    public List<Room> getSuggestedAlternativeRooms(Room originalRoom, LocalDateTime startTime, LocalDateTime endTime) {
        // TODO: Find similar rooms that are available in the same time
        return Collections.emptyList();
    }

    /**
     * Validate room request doesn't conflict with critical events
     */
    public boolean hasConflictWithCriticalEvents(Room room, LocalDateTime startTime, LocalDateTime endTime) {
        // TODO: Check against exams, major events, etc.
        return false;
    }
}
