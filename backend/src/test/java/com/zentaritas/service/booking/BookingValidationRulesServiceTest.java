package com.zentaritas.service.booking;

import com.zentaritas.dto.booking.BookingRequestDTO;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.RoomBooking;
import com.zentaritas.model.booking.TimeslotBlackout;
import com.zentaritas.model.management.Building;
import com.zentaritas.model.management.Room;
import com.zentaritas.repository.booking.RoomBookingRepository;
import com.zentaritas.repository.booking.RoomTimetableRepository;
import com.zentaritas.repository.booking.TimeslotBlackoutRepository;
import com.zentaritas.repository.management.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingValidationRulesServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomBookingRepository roomBookingRepository;

    @Mock
    private TimeslotBlackoutRepository timeslotBlackoutRepository;

    @Mock
    private RoomTimetableRepository roomTimetableRepository;

    private BookingValidationRulesService bookingValidationRulesService;

    @BeforeEach
    void setUp() {
        bookingValidationRulesService = new BookingValidationRulesService(
                roomRepository,
                roomBookingRepository,
                timeslotBlackoutRepository,
                roomTimetableRepository
        );
    }

    @Test
    void validateBookingRequestReturnsUsefulErrorsForInvalidStudentBooking() {
        User student = User.builder().id(1L).role(Role.STUDENT).build();
        LocalDateTime futureStart = LocalDateTime.now().plusDays(40);
        BookingRequestDTO request = BookingRequestDTO.builder()
                .roomId(10L)
                .startTime(futureStart)
                .endTime(futureStart.plusHours(3))
                .purpose("Group study")
                .bookingType(RoomBooking.BookingType.STUDENT)
                .participantsCount(40)
                .seatsBooked(0)
                .build();

        Room room = baseRoomBuilder()
                .id(10L)
                .type("Lecture Hall")
                .seatingCapacity(30)
                .condition("Fair")
                .maintenanceStatus("Maintenance")
                .build();

        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(roomTimetableRepository.findConflictingEntries(anyLong(), anyString(), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(List.of());

        List<String> errors = bookingValidationRulesService.validateBookingRequest(request, student);

        assertTrue(errors.contains("You must book at least 1 seat"));
        assertTrue(errors.contains("Student bookings cannot exceed 2 hours"));
        assertTrue(errors.contains("Students can only book up to 30 days in advance"));
        assertTrue(errors.contains("Students can only book study rooms, not Lecture Hall"));
        assertTrue(errors.contains("Room capacity (30) is less than participants (40)"));
        assertTrue(errors.contains("Room is not in suitable condition: Fair"));
        assertTrue(errors.contains("Room is currently under maintenance"));
    }

    @Test
    void hasExceededBookingQuotaCountsOnlyActiveBookingsInRequestedPeriod() {
        User student = User.builder().id(5L).role(Role.STUDENT).build();
        LocalDateTime now = LocalDateTime.now();

        when(roomBookingRepository.findByBookerId(5L)).thenReturn(List.of(
                booking(now.plusHours(1), now.plusHours(2), RoomBooking.BookingStatus.PENDING),
                booking(now.plusHours(3), now.plusHours(4), RoomBooking.BookingStatus.APPROVED),
                booking(now.plusHours(5), now.plusHours(6), RoomBooking.BookingStatus.CANCELLED),
                booking(now.plusDays(4), now.plusDays(4).plusHours(1), RoomBooking.BookingStatus.CONFIRMED)
        ));

        assertTrue(bookingValidationRulesService.hasExceededBookingQuota(student, "daily"));
        assertFalse(bookingValidationRulesService.hasExceededBookingQuota(student, "monthly"));
    }

    @Test
    void getNextAvailableTimeSkipsBlockedSlotsUntilAFreeWindowExists() {
        Room room = baseRoomBuilder().id(20L).build();
        LocalDateTime requestedStart = LocalDateTime.of(2026, 5, 1, 9, 10);

        when(roomBookingRepository.findConflictingBookings(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(booking(requestedStart, requestedStart.plusMinutes(30), RoomBooking.BookingStatus.APPROVED)))
                .thenReturn(List.of())
                .thenReturn(List.of());
        when(timeslotBlackoutRepository.findConflictingBlackouts(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(blackout(TimeslotBlackout.BlackoutType.MAINTENANCE)))
                .thenReturn(List.of());
        when(roomTimetableRepository.findConflictingEntries(anyLong(), anyString(), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of());

        LocalDateTime nextAvailable = bookingValidationRulesService.getNextAvailableTime(room, requestedStart);

        assertEquals(LocalDateTime.of(2026, 5, 1, 10, 10), nextAvailable);
    }

    @Test
    void getSuggestedAlternativeRoomsReturnsClosestOperationalMatches() {
        Building building = Building.builder().id(3L).build();
        Room originalRoom = baseRoomBuilder()
                .id(1L)
                .building(building)
                .type("Study Room")
                .seatingCapacity(20)
                .build();
        Room closestMatch = baseRoomBuilder()
                .id(2L)
                .building(building)
                .name("B")
                .code("B")
                .type("Study Room")
                .seatingCapacity(19)
                .build();
        Room secondMatch = baseRoomBuilder()
                .id(3L)
                .building(building)
                .name("C")
                .code("C")
                .type("Study Room")
                .seatingCapacity(22)
                .build();
        Room wrongType = baseRoomBuilder()
                .id(4L)
                .building(building)
                .name("D")
                .code("D")
                .type("Lecture Hall")
                .build();
        Room underMaintenance = baseRoomBuilder()
                .id(5L)
                .building(building)
                .name("E")
                .code("E")
                .maintenanceStatus("Maintenance")
                .build();
        Room conflictingRoom = baseRoomBuilder()
                .id(6L)
                .building(building)
                .name("F")
                .code("F")
                .build();

        when(roomRepository.findByBuildingIdOrderByNameAsc(3L))
                .thenReturn(List.of(closestMatch, secondMatch, wrongType, underMaintenance, conflictingRoom));
        when(roomBookingRepository.findConflictingBookings(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenAnswer(invocation -> {
                    Long roomId = invocation.getArgument(0, Long.class);
                    return roomId.equals(6L)
                            ? List.of(booking(LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(1).plusHours(1), RoomBooking.BookingStatus.APPROVED))
                            : List.of();
                });
        when(timeslotBlackoutRepository.findConflictingBlackouts(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(roomTimetableRepository.findConflictingEntries(anyLong(), anyString(), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(List.of());

        List<Room> suggestions = bookingValidationRulesService.getSuggestedAlternativeRooms(
                originalRoom,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusHours(1)
        );

        assertIterableEquals(List.of(closestMatch, secondMatch), suggestions);
    }

    @Test
    void hasConflictWithCriticalEventsDetectsRestrictedBlackoutTypes() {
        Room room = baseRoomBuilder().id(8L).build();

        when(timeslotBlackoutRepository.findConflictingBlackouts(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(blackout(TimeslotBlackout.BlackoutType.EVENT)));

        boolean hasConflict = bookingValidationRulesService.hasConflictWithCriticalEvents(
                room,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusHours(2)
        );

        assertTrue(hasConflict);
    }

    private RoomBooking booking(LocalDateTime start, LocalDateTime end, RoomBooking.BookingStatus status) {
        return RoomBooking.builder()
                .startTime(start)
                .endTime(end)
                .status(status)
                .build();
    }

    private TimeslotBlackout blackout(TimeslotBlackout.BlackoutType type) {
        return TimeslotBlackout.builder()
                .type(type)
                .isActive(true)
                .build();
    }

    private Room.RoomBuilder baseRoomBuilder() {
        return Room.builder()
                .id(99L)
                .name("Room A")
                .code("ROOM-A")
                .type("Study Room")
                .seatingCapacity(20)
                .condition("Good")
                .maintenanceStatus("Operational")
                .bookingAvailable(true)
                .openingTime(LocalTime.of(8, 0))
                .closingTime(LocalTime.of(18, 0))
                .closedOnWeekends(false);
    }
}
