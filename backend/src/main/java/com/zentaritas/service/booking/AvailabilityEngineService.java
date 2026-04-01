package com.zentaritas.service.booking;

import com.zentaritas.model.booking.*;

import com.zentaritas.repository.booking.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
// Removed unused import

/**
 * Core Room Availability Engine
 * Handles all availability checks, conflict detection, and booking validation
 *
 * Room Status Logic:
 * - RESERVED (🟡): Staff booking or maintenance blackout exists
 * - AVAILABLE (🟢): No conflicts
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AvailabilityEngineService {

    private final RoomBookingRepository roomBookingRepository;
    private final TimeslotBlackoutRepository timeslotBlackoutRepository;

    // ============= CORE AVAILABILITY CHECKS =============

    /**
     * Check if a room is available for a given time period
     * Returns: AVAILABLE (green) or RESERVED (yellow - booking or maintenance)
     */
    @Transactional(readOnly = true)
    public RoomAvailabilityStatus checkRoomAvailability(Long roomId, LocalDateTime startTime, LocalDateTime endTime) {
        log.debug("Checking availability for room {} from {} to {}", roomId, startTime, endTime);

        // Check room blackouts (maintenance, cleaning, etc.)
        List<TimeslotBlackout> blackouts = timeslotBlackoutRepository.findConflictingBlackouts(roomId, startTime, endTime);
        if (!blackouts.isEmpty()) {
            log.debug("Found blackout conflicts for room {}", roomId);
            return new RoomAvailabilityStatus(AvailabilityStatus.RESERVED, blackouts, null);
        }

        // Check existing bookings (TEMPORARY bookings - staff/student)
        List<RoomBooking> conflictingBookings = roomBookingRepository.findConflictingBookings(roomId, startTime, endTime);
        if (!conflictingBookings.isEmpty()) {
            log.debug("Found booking conflicts for room {}", roomId);
            return new RoomAvailabilityStatus(AvailabilityStatus.RESERVED, null, conflictingBookings);
        }

        log.debug("Room {} is available", roomId);
        return new RoomAvailabilityStatus(AvailabilityStatus.AVAILABLE, null, null);
    }

    /**
     * Get all available time slots for a room on a specific date
     * Returns list of 30/60-minute slots that are free
     */
    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableSlots(Long roomId, LocalDate date, int slotDurationMinutes) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        log.debug("Getting available slots for room {} on {} (slot duration: {} mins)", roomId, date, slotDurationMinutes);

        // Get all conflicts for the day
        List<TimeslotBlackout> dayBlackouts = timeslotBlackoutRepository.findConflictingBlackouts(roomId, startOfDay, endOfDay);
        List<RoomBooking> dayBookings = roomBookingRepository.findConflictingBookings(roomId, startOfDay, endOfDay);

        List<TimeSlot> allSlots = generateTimeSlots(date, slotDurationMinutes);
        List<TimeSlot> availableSlots = new ArrayList<>();

        for (TimeSlot slot : allSlots) {
            boolean hasConflict = false;

            // Check conflicts
            if (hasConflictWithBlackout(slot, dayBlackouts) ||
                hasConflictWithBooking(slot, dayBookings)) {
                hasConflict = true;
            }

            if (!hasConflict) {
                availableSlots.add(slot);
            }
        }

        log.debug("Found {} available slots for room {} on {}", availableSlots.size(), roomId, date);
        return availableSlots;
    }

    /**
     * Get room occupancy details for a specific day - useful for UI timeline
     */
    @Transactional(readOnly = true)
    public List<OccupancyBlock> getRoomOccupancyForDay(Long roomId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<OccupancyBlock> blocks = new ArrayList<>();

        // Add blackout blocks (MAINTENANCE - yellow)
        timeslotBlackoutRepository.findConflictingBlackouts(roomId, startOfDay, endOfDay)
                .forEach(b -> blocks.add(new OccupancyBlock(
                        "BLACKOUT:" + b.getType().toString(),
                        b.getReason(),
                        b.getStartTime(),
                        b.getEndTime(),
                        null
                )));

        // Add booking blocks (STAFF/STUDENT BOOKINGS - yellow)
        roomBookingRepository.findConflictingBookings(roomId, startOfDay, endOfDay)
                .forEach(b -> {
                    String description = b.getBookingType() == RoomBooking.BookingType.STUDENT ?
                            "Student Study (" + b.getBooker().getFirstName() + ")" :
                            "Staff Booking (" + b.getBooker().getFirstName() + ")";
                    blocks.add(new OccupancyBlock(
                            "BOOKING",
                            description,
                            b.getStartTime(),
                            b.getEndTime(),
                            null
                    ));
                });

        // Sort by start time
        blocks.sort(Comparator.comparing(OccupancyBlock::getStartTime));
        return blocks;
    }

    /**
     * Detect all conflicts for a booking request
     */
    @Transactional(readOnly = true)
    public BookingConflictReport detectConflicts(Long roomId, LocalDateTime startTime, LocalDateTime endTime) {
        log.debug("Detecting conflicts for room {} from {} to {}", roomId, startTime, endTime);

        return new BookingConflictReport(
                timeslotBlackoutRepository.findConflictingBlackouts(roomId, startTime, endTime),
                roomBookingRepository.findConflictingBookings(roomId, startTime, endTime)
        );
    }

    // ============= HELPER METHODS =============

    private boolean hasConflictWithBlackout(TimeSlot slot, List<TimeslotBlackout> blackouts) {
        return blackouts.stream().anyMatch(b ->
                !slot.getEndTime().isBefore(b.getStartTime()) &&
                !slot.getStartTime().isAfter(b.getEndTime())
        );
    }

    private boolean hasConflictWithBooking(TimeSlot slot, List<RoomBooking> bookings) {
        return bookings.stream().anyMatch(b ->
                !slot.getEndTime().isBefore(b.getStartTime()) &&
                !slot.getStartTime().isAfter(b.getEndTime())
        );
    }

    private List<TimeSlot> generateTimeSlots(LocalDate date, int durationMinutes) {
        List<TimeSlot> slots = new ArrayList<>();
        LocalTime startTime = LocalTime.of(8, 0);  // Start at 8 AM
        LocalTime endTime = LocalTime.of(18, 0);  // End at 6 PM

        LocalDateTime current = LocalDateTime.of(date, startTime);
        LocalDateTime dayEnd = LocalDateTime.of(date, endTime);

        while (current.isBefore(dayEnd)) {
            LocalDateTime slotEnd = current.plusMinutes(durationMinutes);
            if (!slotEnd.isAfter(dayEnd)) {
                slots.add(new TimeSlot(current, slotEnd));
            }
            current = slotEnd;
        }

        return slots;
    }

    // ============= DTOs FOR AVAILABILITY INFO =============

    public static class RoomAvailabilityStatus {
        public final AvailabilityStatus status;
        public final List<TimeslotBlackout> conflictingBlackouts;
        public final List<RoomBooking> conflictingBookings;

        public RoomAvailabilityStatus(AvailabilityStatus status,
                                      List<TimeslotBlackout> blackouts, List<RoomBooking> bookings) {
            this.status = status;
            this.conflictingBlackouts = blackouts;
            this.conflictingBookings = bookings;
        }
    }

    public enum AvailabilityStatus {
        AVAILABLE,   // Green - can book
        RESERVED     // Yellow - staff booking or maintenance
    }

    public static class TimeSlot {
        public final LocalDateTime startTime;
        public final LocalDateTime endTime;
        public final LocalDate date;

        public TimeSlot(LocalDateTime startTime, LocalDateTime endTime) {
            this.startTime = startTime;
            this.endTime = endTime;
            this.date = startTime.toLocalDate();
        }

        public LocalDateTime getStartTime() {
            return startTime;
        }

        public LocalDateTime getEndTime() {
            return endTime;
        }

        public LocalDate getDate() {
            return date;
        }
    }

    @Getter
    public static class OccupancyBlock {
        public final String type;     // BLACKOUT, BOOKING
        public final String description;
        public final LocalDateTime startTime;
        public final LocalDateTime endTime;
        public final String details;

        public OccupancyBlock(String type, String description, LocalDateTime startTime, LocalDateTime endTime, String details) {
            this.type = type;
            this.description = description;
            this.startTime = startTime;
            this.endTime = endTime;
            this.details = details;
        }
    }

    public static class BookingConflictReport {
        public final List<TimeslotBlackout> blackoutConflicts;
        public final List<RoomBooking> bookingConflicts;
        public final boolean hasConflicts;

        public BookingConflictReport(List<TimeslotBlackout> blackouts,
                                    List<RoomBooking> bookings) {
            this.blackoutConflicts = blackouts != null ? blackouts : Collections.emptyList();
            this.bookingConflicts = bookings != null ? bookings : Collections.emptyList();
            this.hasConflicts = !this.blackoutConflicts.isEmpty() || !this.bookingConflicts.isEmpty();
        }
    }
}
