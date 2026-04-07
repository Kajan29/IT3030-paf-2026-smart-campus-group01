package com.zentaritas.service.management;

import com.zentaritas.dto.management.availability.RoomTimetableRequest;
import com.zentaritas.dto.management.availability.RoomTimetableResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.RoomTimetableEntry;
import com.zentaritas.model.management.Room;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.booking.RoomTimetableRepository;
import com.zentaritas.repository.management.RoomRepository;
import com.zentaritas.service.auth.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RoomTimetableService {

    private final RoomTimetableRepository timetableRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public List<RoomTimetableResponse> getEntriesForRoom(Long roomId) {
        return timetableRepository.findByRoomIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(roomId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RoomTimetableResponse> getEntriesForRoomAndDate(Long roomId, LocalDate date) {
        String dayOfWeek = date.getDayOfWeek().name();
        return timetableRepository.findActiveEntriesForRoomAndDay(roomId, dayOfWeek)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RoomTimetableResponse createEntry(RoomTimetableRequest request, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Room room = getRoom(request.getRoomId());
        Room substituteRoom = request.getSubstituteRoomId() != null ? getRoom(request.getSubstituteRoomId()) : null;
        validateTimes(request.getStartTime(), request.getEndTime());
        validateRoomWindow(room, request.getStartTime(), request.getEndTime(), request.getDayOfWeek());

        RoomTimetableEntry entry = RoomTimetableEntry.builder()
                .room(room)
                .substituteRoom(substituteRoom)
                .dayOfWeek(normalizeDay(request.getDayOfWeek()))
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .lectureName(request.getLectureName().trim())
                .lecturerName(request.getLecturerName().trim())
                .lecturerEmail(normalizeOptional(request.getLecturerEmail()))
                .purpose(request.getPurpose().trim())
                .notes(normalizeOptional(request.getNotes()))
                .entryType(parseEntryType(request.getEntryType()))
                .active(Boolean.TRUE.equals(request.getActive()))
                .createdBy(currentUser)
                .build();

        RoomTimetableEntry saved = timetableRepository.save(entry);
        notifySubstituteRoom(saved, null);
        return toResponse(saved);
    }

    @Transactional
    public RoomTimetableResponse updateEntry(Long id, RoomTimetableRequest request) {
        RoomTimetableEntry entry = getEntry(id);
        Room substituteBefore = entry.getSubstituteRoom();

        Room room = getRoom(request.getRoomId());
        Room substituteRoom = request.getSubstituteRoomId() != null ? getRoom(request.getSubstituteRoomId()) : null;
        validateTimes(request.getStartTime(), request.getEndTime());
        validateRoomWindow(room, request.getStartTime(), request.getEndTime(), request.getDayOfWeek());

        entry.setRoom(room);
        entry.setSubstituteRoom(substituteRoom);
        entry.setDayOfWeek(normalizeDay(request.getDayOfWeek()));
        entry.setStartTime(request.getStartTime());
        entry.setEndTime(request.getEndTime());
        entry.setLectureName(request.getLectureName().trim());
        entry.setLecturerName(request.getLecturerName().trim());
        entry.setLecturerEmail(normalizeOptional(request.getLecturerEmail()));
        entry.setPurpose(request.getPurpose().trim());
        entry.setNotes(normalizeOptional(request.getNotes()));
        entry.setEntryType(parseEntryType(request.getEntryType()));
        entry.setActive(Boolean.TRUE.equals(request.getActive()));
        entry.setSubstituteNotified(false);

        RoomTimetableEntry saved = timetableRepository.save(entry);
        notifySubstituteRoom(saved, substituteBefore);
        return toResponse(saved);
    }

    @Transactional
    public void deleteEntry(Long id) {
        timetableRepository.delete(getEntry(id));
    }

    private void notifySubstituteRoom(RoomTimetableEntry entry, Room previousSubstituteRoom) {
        if (entry.getLecturerEmail() == null || entry.getLecturerEmail().isBlank() || entry.getSubstituteRoom() == null) {
            return;
        }

        if (previousSubstituteRoom != null && previousSubstituteRoom.getId().equals(entry.getSubstituteRoom().getId()) && Boolean.TRUE.equals(entry.getSubstituteNotified())) {
            return;
        }

        String message = String.format(
                "Room change notice: %s in %s has been moved to %s for %s on %s from %s to %s.",
                entry.getLectureName(),
                entry.getRoom().getName(),
                entry.getSubstituteRoom().getName(),
                entry.getLecturerName(),
                entry.getDayOfWeek(),
                entry.getStartTime(),
                entry.getEndTime()
        );
        emailService.sendRoomChangeEmail(entry.getLecturerEmail(), entry.getLecturerName(), entry.getRoom().getName(), entry.getSubstituteRoom().getName(), entry.getDayOfWeek(), entry.getStartTime(), entry.getEndTime(), message);
        entry.setSubstituteNotified(true);
        timetableRepository.save(entry);
    }

    private RoomTimetableResponse toResponse(RoomTimetableEntry entry) {
        return RoomTimetableResponse.builder()
                .id(entry.getId())
                .roomId(entry.getRoom().getId())
                .roomCode(entry.getRoom().getCode())
                .roomName(entry.getRoom().getName())
                .substituteRoomId(entry.getSubstituteRoom() != null ? entry.getSubstituteRoom().getId() : null)
                .substituteRoomCode(entry.getSubstituteRoom() != null ? entry.getSubstituteRoom().getCode() : null)
                .substituteRoomName(entry.getSubstituteRoom() != null ? entry.getSubstituteRoom().getName() : null)
                .dayOfWeek(entry.getDayOfWeek())
                .startTime(entry.getStartTime())
                .endTime(entry.getEndTime())
                .lectureName(entry.getLectureName())
                .lecturerName(entry.getLecturerName())
                .lecturerEmail(entry.getLecturerEmail())
                .purpose(entry.getPurpose())
                .notes(entry.getNotes())
                .entryType(entry.getEntryType().name())
                .active(entry.getActive())
                .substituteNotified(entry.getSubstituteNotified())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private RoomTimetableEntry getEntry(Long id) {
        return timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable entry not found with id: " + id));
    }

    private Room getRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Authenticated user is required");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .or(() -> userRepository.findByUsername(authentication.getName()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found for identity: " + authentication.getName()));
    }

    private void validateTimes(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
    }

    private void validateRoomWindow(Room room, LocalTime startTime, LocalTime endTime, String dayOfWeek) {
        LocalTime roomOpen = room.getOpeningTime() != null ? room.getOpeningTime() : LocalTime.of(8, 0);
        LocalTime roomClose = room.getClosingTime() != null ? room.getClosingTime() : LocalTime.of(18, 0);
        if (startTime.isBefore(roomOpen) || endTime.isAfter(roomClose)) {
            throw new IllegalArgumentException("Timetable entry must stay within room opening hours");
        }

        if (Boolean.TRUE.equals(room.getClosedOnWeekends())) {
            DayOfWeek parsedDay = DayOfWeek.valueOf(normalizeDay(dayOfWeek));
            if (parsedDay == DayOfWeek.SATURDAY || parsedDay == DayOfWeek.SUNDAY) {
                throw new IllegalArgumentException("Selected building is closed on weekends");
            }
        }
    }

    private String normalizeDay(String dayOfWeek) {
        return dayOfWeek.trim().toUpperCase(Locale.ROOT);
    }

    private RoomTimetableEntry.EntryType parseEntryType(String entryType) {
        try {
            return RoomTimetableEntry.EntryType.valueOf(entryType.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return RoomTimetableEntry.EntryType.OTHER;
        }
    }

    private String normalizeOptional(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }
}