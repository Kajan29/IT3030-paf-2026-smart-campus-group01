package com.zentaritas.repository.booking;

import com.zentaritas.model.booking.TimeslotBlackout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TimeslotBlackoutRepository extends JpaRepository<TimeslotBlackout, Long> {

    // Find active blackouts for a room
    @Query("SELECT b FROM TimeslotBlackout b WHERE b.room.id = :roomId AND b.isActive = true")
    List<TimeslotBlackout> findActiveBlackoutsForRoom(@Param("roomId") Long roomId);

    // Find blackouts in a time range for a room
    @Query("SELECT b FROM TimeslotBlackout b WHERE b.room.id = :roomId " +
            "AND b.isActive = true " +
            "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    List<TimeslotBlackout> findConflictingBlackouts(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // Find all blackouts by type
    List<TimeslotBlackout> findByType(TimeslotBlackout.BlackoutType type);

    // Find active blackouts by type
    @Query("SELECT b FROM TimeslotBlackout b WHERE b.type = :type AND b.isActive = true")
    List<TimeslotBlackout> findActiveBlackoutsByType(@Param("type") TimeslotBlackout.BlackoutType type);

    // Find upcoming maintenance blackouts
    @Query("SELECT b FROM TimeslotBlackout b WHERE b.room.id = :roomId " +
            "AND b.type = com.zentaritas.model.booking.TimeslotBlackout.BlackoutType.MAINTENANCE " +
            "AND b.isActive = true AND b.startTime >= CURRENT_TIMESTAMP " +
            "ORDER BY b.startTime ASC")
    List<TimeslotBlackout> findUpcomingMaintenanceForRoom(@Param("roomId") Long roomId);

    // Find blackouts in a date range
    @Query("SELECT b FROM TimeslotBlackout b WHERE b.isActive = true " +
            "AND b.startTime >= :startDate AND b.endTime <= :endDate " +
            "ORDER BY b.startTime ASC")
    List<TimeslotBlackout> findBlackoutsInDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
