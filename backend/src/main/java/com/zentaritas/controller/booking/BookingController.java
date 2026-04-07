package com.zentaritas.controller.booking;

import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.RoomBooking;
import com.zentaritas.service.booking.AvailabilityEngineService;
import com.zentaritas.service.booking.BookingService;
import com.zentaritas.controller.booking.dto.BookingRequestDTO;
import com.zentaritas.controller.booking.dto.BookingResultDTO;
import com.zentaritas.repository.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * REST API Controller for room bookings
 * Endpoints: /api/bookings/**
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Slf4j
public class BookingController {

    private final BookingService bookingService;
    private final AvailabilityEngineService availabilityEngineService;
    private final UserRepository userRepository;

    // ============= AVAILABILITY ENDPOINTS =============

    /**
     * Check room availability for a specific time period
     * GET /api/bookings/availability/{roomId}?startTime=...&endTime=...
     */
    @GetMapping("/availability/{roomId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<AvailabilityResponse> checkRoomAvailability(
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        log.debug("Checking availability for room {} from {} to {}", roomId, startTime, endTime);

        AvailabilityEngineService.RoomAvailabilityStatus status = availabilityEngineService.checkRoomAvailability(roomId, startTime, endTime);
        
        return ResponseEntity.ok(new AvailabilityResponse(
                status.status.toString(),
                status.conflictingBlackouts != null ? status.conflictingBlackouts.size() : 0,
            status.conflictingBookings != null ? status.conflictingBookings.size() : 0,
            status.conflictingTimetableEntries != null ? status.conflictingTimetableEntries.size() : 0
        ));
    }

    /**
     * Get available time slots for a room on a specific date
     * GET /api/bookings/available-slots/{roomId}?date=...&slotDuration=30
     */
    @GetMapping("/available-slots/{roomId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<SlotsResponse> getAvailableSlots(
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "30") int slotDuration) {
        
        log.debug("Getting available slots for room {} on {}", roomId, date);

        List<AvailabilityEngineService.TimeSlot> slots = availabilityEngineService.getAvailableSlots(roomId, date, slotDuration);
        
        List<SlotDetail> slotDetails = slots.stream()
                .map(s -> new SlotDetail(s.startTime, s.endTime))
                .toList();

        return ResponseEntity.ok(new SlotsResponse(slotDetails.size(), slotDetails));
    }

    /**
     * Get room occupancy/timeline for a specific date
     * GET /api/bookings/occupancy/{roomId}?date=...
     */
    @GetMapping("/occupancy/{roomId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<OccupancyResponse> getRoomOccupancy(
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.debug("Getting occupancy for room {} on {}", roomId, date);

        List<AvailabilityEngineService.OccupancyBlock> blocks = availabilityEngineService.getRoomOccupancyForDay(roomId, date);
        
        List<OccupancyBlockDetail> blockDetails = blocks.stream()
                .map(b -> new OccupancyBlockDetail(
                        b.type,
                        b.description,
                        b.startTime,
                        b.endTime,
                        b.details
                ))
                .toList();

        return ResponseEntity.ok(new OccupancyResponse(blockDetails));
    }

    /**
     * Detect conflicts for a proposed booking
     * POST /api/bookings/detect-conflicts
     */
    @PostMapping("/detect-conflicts")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ConflictReportResponse> detectConflicts(@RequestBody ConflictDetectionRequest request) {
        log.debug("Detecting conflicts for room {} from {} to {}", request.roomId, request.startTime, request.endTime);

        AvailabilityEngineService.BookingConflictReport report = availabilityEngineService.detectConflicts(
                request.roomId, request.startTime, request.endTime
        );

        return ResponseEntity.ok(new ConflictReportResponse(
                report.hasConflicts,
                report.blackoutConflicts.size(),
            report.bookingConflicts.size(),
            report.timetableConflicts.size()
        ));
    }

    // ============= BOOKING MANAGEMENT ENDPOINTS =============

    /**
     * Create a new booking
     * POST /api/bookings
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF')")
    public ResponseEntity<?> createBooking(@RequestBody BookingDto bookingRequest, Authentication authentication) {
        log.info("Creating booking for user {}", authentication.getName());

        User booker = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Convert BookingDto to BookingRequestDTO
        BookingRequestDTO request = BookingRequestDTO.builder()
                .roomId(bookingRequest.roomId())
                .startTime(bookingRequest.startTime())
                .endTime(bookingRequest.endTime())
                .bookingType(bookingRequest.bookingType())
                .purpose(bookingRequest.purpose())
                .participantsCount(bookingRequest.participantsCount())
                .seatsBooked(bookingRequest.seatsBooked())
                .isRecurring(bookingRequest.isRecurring())
                .recurringPattern(bookingRequest.recurringPattern())
                .recurringEndDate(bookingRequest.recurringEndDate())
                .build();

        BookingResultDTO result = bookingService.createBooking(request, booker);

        if (Boolean.TRUE.equals(result.getSuccess())) {
            BookingCreatedResponse response = new BookingCreatedResponse(
                    result.getBooking().getId(),
                    result.getBooking().getStatus().toString(),
                    result.getBooking().getRequiresOverride()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            ErrorResponse errorResponse = new ErrorResponse("Booking failed", result.getErrors());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get all pending bookings (Admin only)
     * GET /api/bookings/pending
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RoomBooking>> getPendingBookings() {
        log.debug("Fetching pending bookings");
        return ResponseEntity.ok(bookingService.getPendingBookings());
    }

    /**
     * Get bookings for current user
     * GET /api/bookings/my-bookings
     */
    @GetMapping("/my-bookings")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF')")
    public ResponseEntity<List<RoomBooking>> getMyBookings(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.debug("Fetching bookings for user {}", user.getId());
        return ResponseEntity.ok(bookingService.getBookingsForUser(user.getId()));
    }

    /**
     * Approve a pending booking (Admin only)
     * PUT /api/bookings/{bookingId}/approve
     */
    @PutMapping("/{bookingId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveBooking(
            @PathVariable Long bookingId,
            @RequestBody ApprovalRequest request,
            Authentication authentication) {
        
        log.info("Approving booking {} by admin {}", bookingId, authentication.getName());

        User approver = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BookingService.BookingResult result = bookingService.approveBooking(bookingId, approver, request.notes);

        if (result.success) {
            return ResponseEntity.ok(new ApprovalResponse(true, "Booking approved"));
        } else {
            return ResponseEntity.badRequest().body(new ErrorResponse("Approval failed", result.errors));
        }
    }

    /**
     * Reject a pending booking (Admin only)
     * PUT /api/bookings/{bookingId}/reject
     */
    @PutMapping("/{bookingId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectBooking(
            @PathVariable Long bookingId,
            @RequestBody RejectionRequest request,
            Authentication authentication) {
        
        log.info("Rejecting booking {} by admin {}", bookingId, authentication.getName());

        User approver = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BookingService.BookingResult result = bookingService.rejectBooking(bookingId, approver, request.reason);

        if (result.success) {
            return ResponseEntity.ok(new RejectionResponse(true, "Booking rejected"));
        } else {
            return ResponseEntity.badRequest().body(new ErrorResponse("Rejection failed", result.errors));
        }
    }

    /**
     * Cancel a booking
     * DELETE /api/bookings/{bookingId}
     */
    @DeleteMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) String reason) {
        
        log.info("Cancelling booking {}", bookingId);

        BookingService.BookingResult result = bookingService.cancelBooking(bookingId, reason != null ? reason : "User cancelled");

        if (result.success) {
            return ResponseEntity.ok(new CancellationResponse(true, "Booking cancelled"));
        } else {
            return ResponseEntity.badRequest().body(new ErrorResponse("Cancellation failed", result.errors));
        }
    }

    // ============= DTOs =============

    public record AvailabilityResponse(String status, int blackoutConflicts, int bookingConflicts, int timetableConflicts) {}
    public record SlotsResponse(int totalSlots, List<SlotDetail> slots) {}
    public record SlotDetail(LocalDateTime startTime, LocalDateTime endTime) {}
    public record OccupancyResponse(List<OccupancyBlockDetail> blocks) {}
    public record OccupancyBlockDetail(String type, String description, LocalDateTime startTime, LocalDateTime endTime, String details) {}
    public record ConflictDetectionRequest(Long roomId, LocalDateTime startTime, LocalDateTime endTime) {}
    public record ConflictReportResponse(boolean hasConflicts, int blackoutCount, int bookingCount, int timetableCount) {}
    public record BookingDto(
            Long roomId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            RoomBooking.BookingType bookingType,
            String purpose,
            Integer participantsCount,
            Integer seatsBooked,
            Boolean isRecurring,
            String recurringPattern,
            LocalDateTime recurringEndDate
    ) {}
    public record BookingCreatedResponse(Long bookingId, String status, Boolean requiresOverride) {}
    public record ApprovalRequest(String notes) {}
    public record ApprovalResponse(boolean success, String message) {}
    public record RejectionRequest(String reason) {}
    public record RejectionResponse(boolean success, String message) {}
    public record CancellationResponse(boolean success, String message) {}
    public record ErrorResponse(String error, List<String> details) {}
}
