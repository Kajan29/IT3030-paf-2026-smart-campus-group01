package com.zentaritas.repository.booking;

import com.zentaritas.model.booking.RoomBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {

    // Find bookings for a specific room
    List<RoomBooking> findByRoomId(Long roomId);

    // Find bookings by booker (user)
    List<RoomBooking> findByBookerId(Long bookerId);

    // Find confirmed bookings for a room in a time range
    @Query("SELECT b FROM RoomBooking b WHERE b.room.id = :roomId " +
            "AND (b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.APPROVED OR b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.CONFIRMED) " +
            "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    List<RoomBooking> findConflictingBookings(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // Find all bookings for a room in a date range
    @Query("SELECT b FROM RoomBooking b WHERE b.room.id = :roomId " +
            "AND b.startTime >= :startDate AND b.endTime <= :endDate " +
            "AND (b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.APPROVED OR b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.CONFIRMED)")
    List<RoomBooking> findBookingsInDateRange(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // Find pending bookings
    @Query("SELECT b FROM RoomBooking b WHERE b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.PENDING ORDER BY b.createdAt ASC")
    List<RoomBooking> findPendingBookings();

    // Find pending bookings for admin approval on specific room
    @Query("SELECT b FROM RoomBooking b WHERE b.room.id = :roomId AND b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.PENDING")
    List<RoomBooking> findPendingBookingsForRoom(@Param("roomId") Long roomId);

    // Find bookings requiring override (conflicting with other bookings or blackouts)
    @Query("SELECT b FROM RoomBooking b WHERE b.requiresOverride = true AND (b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.PENDING OR b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.APPROVED)")
    List<RoomBooking> findBookingsRequiringOverride();

    // Count confirmed bookings for a room
    @Query("SELECT COUNT(b) FROM RoomBooking b WHERE b.room.id = :roomId AND (b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.APPROVED OR b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.CONFIRMED)")
    Long countConfirmedBookings(@Param("roomId") Long roomId);

    // Find completed bookings for analytics
    @Query("SELECT b FROM RoomBooking b WHERE b.room.id = :roomId AND b.status = com.zentaritas.model.booking.RoomBooking.BookingStatus.COMPLETED " +
            "AND b.endTime >= :startDate AND b.startTime <= :endDate")
    List<RoomBooking> findCompletedBookingsInRange(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // Find all student bookings
    @Query("SELECT b FROM RoomBooking b WHERE b.bookingType = com.zentaritas.model.booking.RoomBooking.BookingType.STUDENT")
    List<RoomBooking> findAllStudentBookings();

    // Find student bookings for a user
    @Query("SELECT b FROM RoomBooking b WHERE b.booker.id = :userId AND b.bookingType = com.zentaritas.model.booking.RoomBooking.BookingType.STUDENT")
    List<RoomBooking> findStudentBookingsByUser(@Param("userId") Long userId);

    // Check whether the user already has an active/future booking in a blocking status
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM RoomBooking b " +
            "WHERE b.booker.id = :userId " +
            "AND b.status IN :statuses " +
            "AND b.endTime > :referenceTime")
    boolean existsActiveBookingForUser(
            @Param("userId") Long userId,
            @Param("statuses") Collection<RoomBooking.BookingStatus> statuses,
            @Param("referenceTime") LocalDateTime referenceTime
    );

    // Find bookings by status
    List<RoomBooking> findByStatus(RoomBooking.BookingStatus status);

        // Admin dashboard listing (latest first)
        List<RoomBooking> findAllByOrderByCreatedAtDesc();

        // Admin dashboard listing by status (latest first)
        List<RoomBooking> findByStatusOrderByCreatedAtDesc(RoomBooking.BookingStatus status);

    // Find bookings for a staff member for today (by direct assignment OR room's permanent staff)
    @Query("SELECT DISTINCT b FROM RoomBooking b WHERE " +
            "(b.assignedStaff.id = :staffId OR b.room.assignedStaff.id = :staffId) " +
            "AND b.startTime >= :dayStart AND b.startTime < :dayEnd " +
            "AND b.status IN (com.zentaritas.model.booking.RoomBooking.BookingStatus.APPROVED, " +
            "com.zentaritas.model.booking.RoomBooking.BookingStatus.CONFIRMED, " +
            "com.zentaritas.model.booking.RoomBooking.BookingStatus.ATTENDED) " +
            "ORDER BY b.startTime ASC")
    List<RoomBooking> findTodayBookingsForStaff(
            @Param("staffId") Long staffId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd
    );

    // Check if user has an overlapping booking at the given time
    @Query("SELECT b FROM RoomBooking b WHERE b.booker.id = :userId " +
            "AND b.status IN (com.zentaritas.model.booking.RoomBooking.BookingStatus.PENDING, " +
            "com.zentaritas.model.booking.RoomBooking.BookingStatus.APPROVED, " +
            "com.zentaritas.model.booking.RoomBooking.BookingStatus.CONFIRMED) " +
            "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    List<RoomBooking> findUserOverlappingBookings(
            @Param("userId") Long userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // Count approved/confirmed seats booked for a room in a time range
    @Query("SELECT COALESCE(SUM(b.seatsBooked), 0) FROM RoomBooking b " +
            "WHERE b.room.id = :roomId " +
            "AND b.status IN (com.zentaritas.model.booking.RoomBooking.BookingStatus.PENDING, " +
            "com.zentaritas.model.booking.RoomBooking.BookingStatus.APPROVED, " +
            "com.zentaritas.model.booking.RoomBooking.BookingStatus.CONFIRMED) " +
            "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    int countBookedSeatsForRoomInTimeRange(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // Find all bookings for a staff member (by direct assignment OR room's permanent staff)
    @Query("SELECT DISTINCT b FROM RoomBooking b WHERE " +
            "(b.assignedStaff.id = :staffId OR b.room.assignedStaff.id = :staffId) " +
            "ORDER BY b.startTime ASC")
    List<RoomBooking> findBookingsForStaff(@Param("staffId") Long staffId);
}
