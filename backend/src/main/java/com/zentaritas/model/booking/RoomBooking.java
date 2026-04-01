package com.zentaritas.model.booking;

import com.zentaritas.model.auth.User;
import com.zentaritas.model.management.Room;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "room_bookings")
public class RoomBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booker_id", nullable = false)
    private User booker;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_type", nullable = false)
    private BookingType bookingType; // STUDENT or STAFF

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "purpose", nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "participants_count")
    private Integer participantsCount;

    @Column(name = "seats_booked")
    private Integer seatsBooked; // For student bookings (max 1 seat per student)

    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private Boolean isRecurring = false;

    @Column(name = "recurring_pattern")
    private String recurringPattern; // DAILY, WEEKLY, CUSTOM

    @Column(name = "recurring_end_date")
    private LocalDateTime recurringEndDate;

    @Column(name = "requires_override", nullable = false)
    @Builder.Default
    private Boolean requiresOverride = false; // If booking conflicts with other bookings or blackouts

    @Column(name = "approved_by_id")
    private Long approvedById;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @Column(name = "cancelled_reason", columnDefinition = "TEXT")
    private String cancelledReason;

    @Column(name = "created_by", updatable = false)
    private Long createdById;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum BookingType {
        STUDENT,
        STAFF
    }

    public enum BookingStatus {
        PENDING,      // Awaiting admin approval
        APPROVED,     // Admin approved
        CONFIRMED,    // Ready/Active
        CANCELLED,    // Cancelled by user
        REJECTED,     // Rejected by admin
        COMPLETED,    // Booking time has passed
        NO_SHOW       // User didn't show up
    }
}
