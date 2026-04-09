package com.zentaritas.repository.booking;

import com.zentaritas.model.booking.RoomTimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;

public interface RoomTimetableRepository extends JpaRepository<RoomTimetableEntry, Long> {

    List<RoomTimetableEntry> findByRoomIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long roomId);

    @Query("SELECT e FROM RoomTimetableEntry e WHERE e.room.id = :roomId AND e.active = true AND e.dayOfWeek = :dayOfWeek AND NOT (e.endTime <= :startTime OR e.startTime >= :endTime)")
    List<RoomTimetableEntry> findConflictingEntries(
            @Param("roomId") Long roomId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("SELECT e FROM RoomTimetableEntry e WHERE e.room.id = :roomId AND e.active = true AND e.dayOfWeek = :dayOfWeek ORDER BY e.startTime ASC")
    List<RoomTimetableEntry> findActiveEntriesForRoomAndDay(
            @Param("roomId") Long roomId,
            @Param("dayOfWeek") String dayOfWeek
    );

    @Query("SELECT e FROM RoomTimetableEntry e WHERE e.active = true AND (" +
            "LOWER(COALESCE(e.lecturerEmail, '')) = LOWER(:email) OR " +
            "LOWER(COALESCE(e.lecturerName, '')) = LOWER(:fullName) OR " +
            "LOWER(COALESCE(e.lecturerName, '')) = LOWER(:username)) " +
            "ORDER BY e.dayOfWeek ASC, e.startTime ASC")
    List<RoomTimetableEntry> findActiveEntriesForLecturer(
            @Param("email") String email,
            @Param("fullName") String fullName,
            @Param("username") String username
    );
}