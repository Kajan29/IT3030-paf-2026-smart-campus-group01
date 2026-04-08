package com.zentaritas.repository.booking;

import com.zentaritas.model.booking.BookingNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingNotificationRepository extends JpaRepository<BookingNotification, Long> {

    // Find unread notifications for a user
    @Query("SELECT n FROM BookingNotification n WHERE n.user.id = :userId AND n.isRead = false ORDER BY n.createdAt DESC")
    List<BookingNotification> findUnreadNotifications(@Param("userId") Long userId);

    // Find all notifications for a user
    @Query("SELECT n FROM BookingNotification n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    List<BookingNotification> findNotificationsByUser(@Param("userId") Long userId);

    // Find notifications by type
    List<BookingNotification> findByType(BookingNotification.NotificationType type);

    @Query("SELECT n FROM BookingNotification n WHERE n.user.id = :userId AND n.type = :type ORDER BY n.createdAt DESC")
    List<BookingNotification> findByUserAndType(
            @Param("userId") Long userId,
            @Param("type") BookingNotification.NotificationType type
    );

    Optional<BookingNotification> findByIdAndUserId(Long id, Long userId);

    // Find notifications by status
    List<BookingNotification> findByStatus(BookingNotification.NotificationStatus status);

    // Find unread notifications that haven't been sent yet
    @Query("SELECT n FROM BookingNotification n WHERE n.isRead = false AND n.status = com.zentaritas.model.booking.BookingNotification.NotificationStatus.PENDING")
    List<BookingNotification> findUnsentNotifications();

    // Find notifications by booking ID
    @Query("SELECT n FROM BookingNotification n WHERE n.relatedBookingId = :bookingId ORDER BY n.createdAt DESC")
    List<BookingNotification> findNotificationsByBooking(@Param("bookingId") Long bookingId);

    // Find reminder notifications that need to be sent (30 mins before event)
    @Query("SELECT n FROM BookingNotification n WHERE n.type = com.zentaritas.model.booking.BookingNotification.NotificationType.BOOKING_REMINDER " +
            "AND n.signalrSent = false AND n.eventDate <= CURRENT_TIMESTAMP AND n.eventDate > :thirtyMinsAgo")
    List<BookingNotification> findUpcomingReminders(@Param("thirtyMinsAgo") LocalDateTime thirtyMinsAgo);

    // Count unread notifications for a user
    @Query("SELECT COUNT(n) FROM BookingNotification n WHERE n.user.id = :userId AND n.isRead = false")
    Long countUnreadNotifications(@Param("userId") Long userId);

    // Find notifications by date range
    @Query("SELECT n FROM BookingNotification n WHERE n.createdAt >= :startDate AND n.createdAt <= :endDate ORDER BY n.createdAt DESC")
    List<BookingNotification> findNotificationsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
