package com.zentaritas.model.booking;

import com.zentaritas.model.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "booking_notifications")
public class BookingNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Recipient

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType type;

    @Column(name = "related_booking_id")
    private Long relatedBookingId;

    @Column(name = "related_ticket_id")
    private Long relatedTicketId;

    @Column(name = "target_path")
    private String targetPath;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "event_date")
    private LocalDateTime eventDate; // When the booking/event happens

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    @Column(name = "email_sent", nullable = false)
    @Builder.Default
    private Boolean emailSent = false;

    @Column(name = "signalr_sent", nullable = false)
    @Builder.Default
    private Boolean signalrSent = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        BOOKING_CONFIRMED,    // Room booking confirmed
        BOOKING_PENDING,      // Booking waiting approval
        BOOKING_REJECTED,     // Booking rejected
        TICKET_CREATED,       // New ticket has been created
        TICKET_ASSIGNED,      // Ticket assigned to staff
        TICKET_REPLY,         // New ticket reply in thread
        TICKET_STATUS_UPDATED, // Ticket status updated
        STUDENT_REGISTERED,   // New student account registered
        SWAP_REQUEST_RECEIVED, // Staff received swap request
        SWAP_REQUEST_APPROVED, // Swap request approved
        SWAP_REQUEST_REJECTED, // Swap request rejected
        BOOKING_REMINDER,      // Reminder before booking time
        BOOKING_CANCELLED,     // Booking was cancelled
        BOOKING_NO_SHOW,       // User didn't attend booking
        BOOKING_RESTRICTED,    // User booking access restricted
        BOOKING_UNRESTRICTED,  // User booking access restored
        ADMIN_ALERT            // Admin notification
    }

    public enum NotificationStatus {
        PENDING,   // Not yet sent via all channels
        SENT,      // Sent to all channels
        FAILED,    // Failed to send
        ARCHIVED   // Archived/old notification
    }
}
