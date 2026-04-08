package com.zentaritas.service.management;

import com.zentaritas.dto.management.availability.RoomTimetableImportResult;
import com.zentaritas.dto.management.availability.RoomTimetableRequest;
import com.zentaritas.dto.management.availability.RoomTimetableResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.RoomTimetableEntry;
import com.zentaritas.model.management.Room;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.booking.RoomTimetableRepository;
import com.zentaritas.repository.management.RoomRepository;
import com.zentaritas.service.auth.EmailService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoomTimetableService {

    private static final Set<Role> STAFF_ROLES = EnumSet.of(Role.ACADEMIC_STAFF, Role.NON_ACADEMIC_STAFF);

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("d/M/uuuu"),
            DateTimeFormatter.ofPattern("d-M-uuuu"),
            DateTimeFormatter.ofPattern("d.M.uuuu"),
            DateTimeFormatter.ofPattern("M/d/uuuu"),
            DateTimeFormatter.ofPattern("M-d-uuuu")
    );

    private static final List<DateTimeFormatter> TIME_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_TIME,
            DateTimeFormatter.ofPattern("H:mm"),
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("h:mm:ss a", Locale.ENGLISH)
    );

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

        public List<RoomTimetableResponse> getEntriesForAcademicStaff(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        String email = currentUser.getEmail() != null ? currentUser.getEmail().trim() : "";
        String username = currentUser.getUsername() != null ? currentUser.getUsername().trim() : "";
        String fullName = ((currentUser.getFirstName() != null ? currentUser.getFirstName().trim() : "") + " " +
            (currentUser.getLastName() != null ? currentUser.getLastName().trim() : "")).trim();

        return timetableRepository.findActiveEntriesForLecturer(email, fullName, username)
            .stream()
            .map(this::toResponse)
            .sorted(Comparator
                .comparingInt((RoomTimetableResponse entry) -> daySortIndex(entry.getDayOfWeek()))
                .thenComparing(RoomTimetableResponse::getStartTime))
            .toList();
        }

    @Transactional
    public RoomTimetableResponse createEntry(RoomTimetableRequest request, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return createEntryRecord(request, currentUser, true);
    }

    @Transactional
    public RoomTimetableResponse updateEntry(Long id, RoomTimetableRequest request) {
        RoomTimetableEntry entry = getEntry(id);
        Room substituteBefore = entry.getSubstituteRoom();

        Room room = getRoom(request.getRoomId());
        Room substituteRoom = request.getSubstituteRoomId() != null ? getRoom(request.getSubstituteRoomId()) : null;
        validateTimes(request.getStartTime(), request.getEndTime());
        String normalizedDay = normalizeDay(request.getDayOfWeek());
        validateRoomWindow(room, request.getStartTime(), request.getEndTime(), normalizedDay);

        entry.setRoom(room);
        entry.setSubstituteRoom(substituteRoom);
        entry.setDayOfWeek(normalizedDay);
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
    public List<RoomTimetableImportResult> importEntriesFromExcel(MultipartFile file, Long defaultRoomId, Authentication authentication) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Excel file is required");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            throw new IllegalArgumentException("Only .xlsx files are supported");
        }

        User currentUser = getCurrentUser(authentication);
        Room defaultRoom = defaultRoomId != null ? getRoom(defaultRoomId) : null;

        DataFormatter formatter = new DataFormatter();
        List<RoomTimetableImportResult> results = new ArrayList<>();

        List<User> staffUsers = userRepository.findAll().stream()
                .filter(user -> STAFF_ROLES.contains(user.getRole()))
                .toList();

        Map<String, User> staffByEmail = new HashMap<>();
        Map<String, List<User>> staffByLookup = new HashMap<>();
        for (User staff : staffUsers) {
            if (staff.getEmail() != null && !staff.getEmail().isBlank()) {
                staffByEmail.putIfAbsent(staff.getEmail().trim().toLowerCase(Locale.ROOT), staff);
            }
            addLookup(staffByLookup, staff.getUsername(), staff);
            addLookup(staffByLookup, buildFullName(staff.getFirstName(), staff.getLastName()), staff);
            addLookup(staffByLookup, buildFullName(staff.getLastName(), staff.getFirstName()), staff);
        }

        List<Room> allRooms = roomRepository.findAll();
        Map<String, Room> roomByCode = new HashMap<>();
        Map<Long, Room> roomById = new HashMap<>();
        for (Room room : allRooms) {
            roomById.put(room.getId(), room);
            if (room.getCode() != null && !room.getCode().isBlank()) {
                roomByCode.put(room.getCode().trim().toLowerCase(Locale.ROOT), room);
            }
        }

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new IllegalArgumentException("Excel file is empty");
            }

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("Header row is missing in Excel file");
            }

            Map<String, Integer> columns = buildHeaderMap(headerRow, formatter);

            Integer buildingIdColumn = findColumn(columns, "buildingid");
            Integer buildingCodeColumn = findColumn(columns, "buildingcode");
            Integer floorIdColumn = findColumn(columns, "floorid");
            Integer floorNumberColumn = findColumn(columns, "floornumber");
            Integer roomCodeColumn = findColumn(columns, "roomcode", "room");
            Integer roomIdColumn = findColumn(columns, "roomid");
            Integer substituteRoomCodeColumn = findColumn(columns, "substituteroomcode");
            Integer substituteRoomIdColumn = findColumn(columns, "substituteroomid");
            Integer staffNameColumn = findColumn(columns, "staffname", "lecturername", "academicstaff");
            Integer staffEmailColumn = findColumn(columns, "staffemail", "lectureremail", "email");
            Integer dateColumn = findColumn(columns, "date", "lecturedate", "classdate");
            Integer dayColumn = findColumn(columns, "dayofweek", "day");
            Integer startTimeColumn = findColumn(columns, "starttime", "start");
            Integer endTimeColumn = findColumn(columns, "endtime", "end");
            Integer durationColumn = findColumn(columns, "durationhours", "duration");
            Integer lectureNameColumn = findColumn(columns, "lecturename", "modulename", "module", "subjectname", "subject");
            Integer subjectColumn = findColumn(columns, "subject", "subjectname", "module", "modulename");
            Integer batchColumn = findColumn(columns, "batch", "batchname", "batchcode");
            Integer purposeColumn = findColumn(columns, "purpose", "description", "activity");
            Integer notesColumn = findColumn(columns, "notes", "note", "remarks", "comment");
            Integer entryTypeColumn = findColumn(columns, "entrytype", "type");
            Integer activeColumn = findColumn(columns, "active", "isactive", "enabled");

            if (defaultRoom == null && roomCodeColumn == null && roomIdColumn == null) {
                throw new IllegalArgumentException("Excel must include roomCode or roomId, or provide defaultRoomId");
            }
            if (staffNameColumn == null && staffEmailColumn == null) {
                throw new IllegalArgumentException("Excel must include staffName or staffEmail");
            }
            if (dateColumn == null && dayColumn == null) {
                throw new IllegalArgumentException("Excel must include date or dayOfWeek");
            }
            if (startTimeColumn == null) {
                throw new IllegalArgumentException("Excel must include startTime");
            }

            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row, formatter)) {
                    continue;
                }

                int rowNumber = rowIndex + 1;

                try {
                    Room room = resolveRoom(
                            row,
                            formatter,
                            buildingIdColumn,
                            buildingCodeColumn,
                            floorIdColumn,
                            floorNumberColumn,
                            roomCodeColumn,
                            roomIdColumn,
                            defaultRoom,
                            roomByCode,
                            roomById
                    );
                    Room substituteRoom = resolveOptionalRoom(row, formatter, substituteRoomCodeColumn, substituteRoomIdColumn, roomByCode, roomById);

                    LocalDate date = parseDate(row, dateColumn, formatter);
                    String dayOfWeek = date != null
                            ? date.getDayOfWeek().name()
                            : normalizeDay(readCell(row, dayColumn, formatter));

                    LocalTime startTime = parseTime(row, startTimeColumn, formatter, "startTime");
                    LocalTime endTime = parseEndTime(row, endTimeColumn, durationColumn, startTime, formatter);

                    String staffNameRaw = readCell(row, staffNameColumn, formatter);
                    String staffEmailRaw = readCell(row, staffEmailColumn, formatter);
                    User staff = resolveStaff(staffNameRaw, staffEmailRaw, staffByEmail, staffByLookup);

                    String lectureName = firstNonBlank(
                            readCell(row, lectureNameColumn, formatter),
                            readCell(row, subjectColumn, formatter)
                    );
                    if (lectureName == null || lectureName.isBlank()) {
                        throw new IllegalArgumentException("Lecture name (or subject/module) is required");
                    }

                    String subject = readCell(row, subjectColumn, formatter);
                    String batch = readCell(row, batchColumn, formatter);
                    String purpose = buildPurpose(readCell(row, purposeColumn, formatter), batch, subject);
                    String notes = buildNotes(readCell(row, notesColumn, formatter), date);

                    RoomTimetableRequest request = new RoomTimetableRequest();
                    request.setRoomId(room.getId());
                    request.setSubstituteRoomId(substituteRoom != null ? substituteRoom.getId() : null);
                    request.setDayOfWeek(dayOfWeek);
                    request.setStartTime(startTime);
                    request.setEndTime(endTime);
                    request.setLectureName(lectureName);
                    request.setLecturerName(buildFullName(staff.getFirstName(), staff.getLastName()));
                    request.setLecturerEmail(staff.getEmail());
                    request.setPurpose(purpose);
                    request.setNotes(notes);
                    request.setEntryType(firstNonBlank(readCell(row, entryTypeColumn, formatter), "LECTURE"));
                    request.setActive(parseActiveFlag(readCell(row, activeColumn, formatter)));

                    validateNoConflict(room, dayOfWeek, startTime, endTime);
                    RoomTimetableResponse created = createEntryRecord(request, currentUser, false);

                    results.add(RoomTimetableImportResult.builder()
                            .rowNumber(rowNumber)
                            .imported(true)
                            .roomCode(room.getCode())
                            .staffName(request.getLecturerName())
                            .message("Imported successfully")
                            .entry(created)
                            .build());
                } catch (Exception ex) {
                    String message = ex.getMessage() == null || ex.getMessage().isBlank()
                            ? "Failed to import row"
                            : ex.getMessage();
                    results.add(RoomTimetableImportResult.builder()
                            .rowNumber(rowNumber)
                            .imported(false)
                            .message(message)
                            .build());
                }
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to read Excel file");
        }

        if (results.isEmpty()) {
            throw new IllegalArgumentException("No importable rows were found in the Excel file");
        }

        return results;
    }

    @Transactional(readOnly = true)
    public byte[] generateImportTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("TimetableImport");

            String[] headers = {
                    "buildingId",
                    "buildingCode",
                    "floorId",
                    "floorNumber",
                    "roomId",
                    "roomCode",
                    "staffName",
                    "staffEmail",
                    "date",
                    "dayOfWeek",
                    "startTime",
                    "endTime",
                    "duration",
                    "lectureName",
                    "subject",
                    "purpose",
                    "entryType",
                    "active",
                    "notes"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

                List<User> academicStaffUsers = userRepository.findAll().stream()
                    .filter(user -> user.getRole() == Role.ACADEMIC_STAFF)
                    .filter(user -> user.getIsActive() == null || user.getIsActive())
                    .sorted(Comparator.comparing(user -> buildFullName(user.getFirstName(), user.getLastName())))
                    .toList();

                List<Room> eligibleRooms = roomRepository.findAll().stream()
                    .filter(this::isAllowedAcademicTemplateRoom)
                    .sorted(Comparator
                        .comparing((Room room) -> room.getBuilding().getCode(), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(room -> room.getFloor().getFloorNumber())
                        .thenComparing(Room::getCode, String.CASE_INSENSITIVE_ORDER))
                    .toList();

                Map<Long, Room> oneRoomPerBuilding = new LinkedHashMap<>();
                for (Room room : eligibleRooms) {
                oneRoomPerBuilding.putIfAbsent(room.getBuilding().getId(), room);
                }

                List<Room> sampleRooms = new ArrayList<>(oneRoomPerBuilding.values());

            LocalDate startDate = LocalDate.now().plusDays(1);

            for (int i = 0; i < sampleRooms.size(); i++) {
                Room room = sampleRooms.get(i);
                User assignedStaff = academicStaffUsers.isEmpty() ? null : academicStaffUsers.get(i % academicStaffUsers.size());
                String staffName = assignedStaff != null
                    ? buildFullName(assignedStaff.getFirstName(), assignedStaff.getLastName())
                    : "Academic Staff Name";
                String staffEmail = assignedStaff != null && assignedStaff.getEmail() != null
                    ? assignedStaff.getEmail()
                    : "academic.staff@zentaritas.edu";

                Row row = sheet.createRow(i + 1);

                String date = startDate.plusDays(i).toString();
                row.createCell(0).setCellValue(room.getBuilding().getId());
                row.createCell(1).setCellValue(room.getBuilding().getCode());
                row.createCell(2).setCellValue(room.getFloor().getId());
                row.createCell(3).setCellValue(room.getFloor().getFloorNumber());
                row.createCell(4).setCellValue(room.getId());
                row.createCell(5).setCellValue(room.getCode());
                row.createCell(6).setCellValue(staffName);
                row.createCell(7).setCellValue(staffEmail);
                row.createCell(8).setCellValue(date);
                row.createCell(9).setCellValue("");
                row.createCell(10).setCellValue("09:00");
                row.createCell(11).setCellValue("11:00");
                row.createCell(12).setCellValue("");
                row.createCell(13).setCellValue("Academic Session - " + room.getBuilding().getCode());
                row.createCell(14).setCellValue("Departmental Module");
                row.createCell(15).setCellValue("Academic Staff Teaching Session");
                row.createCell(16).setCellValue("LECTURE");
                row.createCell(17).setCellValue("true");
                row.createCell(18).setCellValue("Sample row generated from database building/floor/room and academic staff");
            }

            if (sampleRooms.isEmpty()) {
                Row row = sheet.createRow(1);
                row.createCell(0).setCellValue("1");
                row.createCell(1).setCellValue("BLD-001");
                row.createCell(2).setCellValue("1");
                row.createCell(3).setCellValue("1");
                row.createCell(4).setCellValue("101");
                row.createCell(5).setCellValue("R-101");
                row.createCell(6).setCellValue("Academic Staff Name");
                row.createCell(7).setCellValue("academic.staff@zentaritas.edu");
                row.createCell(8).setCellValue(startDate.toString());
                row.createCell(10).setCellValue("09:00");
                row.createCell(11).setCellValue("11:00");
                row.createCell(13).setCellValue("Academic Session");
                row.createCell(14).setCellValue("Departmental Module");
                row.createCell(15).setCellValue("Academic Staff Teaching Session");
                row.createCell(16).setCellValue("LECTURE");
                row.createCell(17).setCellValue("true");
                row.createCell(18).setCellValue("Fallback sample row");
            }

            Sheet roomReferenceSheet = workbook.createSheet("BuildingFloorRoomRef");
            String[] roomReferenceHeaders = {
                    "buildingId",
                    "buildingCode",
                    "buildingName",
                    "floorId",
                    "floorNumber",
                    "floorName",
                    "roomId",
                    "roomCode",
                    "roomName",
                    "roomType"
            };

            Row roomRefHeader = roomReferenceSheet.createRow(0);
            for (int i = 0; i < roomReferenceHeaders.length; i++) {
                roomRefHeader.createCell(i).setCellValue(roomReferenceHeaders[i]);
            }

            for (int i = 0; i < eligibleRooms.size(); i++) {
                Room room = eligibleRooms.get(i);
                Row row = roomReferenceSheet.createRow(i + 1);
                row.createCell(0).setCellValue(room.getBuilding().getId());
                row.createCell(1).setCellValue(room.getBuilding().getCode());
                row.createCell(2).setCellValue(room.getBuilding().getName());
                row.createCell(3).setCellValue(room.getFloor().getId());
                row.createCell(4).setCellValue(room.getFloor().getFloorNumber());
                row.createCell(5).setCellValue(room.getFloor().getFloorName());
                row.createCell(6).setCellValue(room.getId());
                row.createCell(7).setCellValue(room.getCode());
                row.createCell(8).setCellValue(room.getName());
                row.createCell(9).setCellValue(room.getType());
            }

            Sheet staffReferenceSheet = workbook.createSheet("AcademicStaffRef");
            String[] staffReferenceHeaders = {
                    "staffId",
                    "staffName",
                    "staffEmail",
                    "department",
                    "username"
            };

            Row staffRefHeader = staffReferenceSheet.createRow(0);
            for (int i = 0; i < staffReferenceHeaders.length; i++) {
                staffRefHeader.createCell(i).setCellValue(staffReferenceHeaders[i]);
            }

            for (int i = 0; i < academicStaffUsers.size(); i++) {
                User staff = academicStaffUsers.get(i);
                Row row = staffReferenceSheet.createRow(i + 1);
                row.createCell(0).setCellValue(staff.getId());
                row.createCell(1).setCellValue(buildFullName(staff.getFirstName(), staff.getLastName()));
                row.createCell(2).setCellValue(staff.getEmail() == null ? "" : staff.getEmail());
                row.createCell(3).setCellValue(staff.getDepartment() == null ? "" : staff.getDepartment());
                row.createCell(4).setCellValue(staff.getUsername() == null ? "" : staff.getUsername());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            for (int i = 0; i < roomReferenceHeaders.length; i++) {
                roomReferenceSheet.autoSizeColumn(i);
            }
            for (int i = 0; i < staffReferenceHeaders.length; i++) {
                staffReferenceSheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to generate import template");
        }
    }

    @Transactional
    public void deleteEntry(Long id) {
        timetableRepository.delete(getEntry(id));
    }

    private RoomTimetableResponse createEntryRecord(RoomTimetableRequest request, User currentUser, boolean notifySubstitute) {
        Room room = getRoom(request.getRoomId());
        Room substituteRoom = request.getSubstituteRoomId() != null ? getRoom(request.getSubstituteRoomId()) : null;

        validateTimes(request.getStartTime(), request.getEndTime());
        String normalizedDay = normalizeDay(request.getDayOfWeek());
        validateRoomWindow(room, request.getStartTime(), request.getEndTime(), normalizedDay);

        RoomTimetableEntry entry = RoomTimetableEntry.builder()
                .room(room)
                .substituteRoom(substituteRoom)
                .dayOfWeek(normalizedDay)
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
        if (notifySubstitute) {
            notifySubstituteRoom(saved, null);
        }
        return toResponse(saved);
    }

    private void notifySubstituteRoom(RoomTimetableEntry entry, Room previousSubstituteRoom) {
        if (entry.getLecturerEmail() == null || entry.getLecturerEmail().isBlank() || entry.getSubstituteRoom() == null) {
            return;
        }

        if (previousSubstituteRoom != null
                && previousSubstituteRoom.getId().equals(entry.getSubstituteRoom().getId())
                && Boolean.TRUE.equals(entry.getSubstituteNotified())) {
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

        emailService.sendRoomChangeEmail(
                entry.getLecturerEmail(),
                entry.getLecturerName(),
                entry.getRoom().getName(),
                entry.getSubstituteRoom().getName(),
                entry.getDayOfWeek(),
                entry.getStartTime(),
                entry.getEndTime(),
                message
        );

        entry.setSubstituteNotified(true);
        timetableRepository.save(entry);
    }

    private RoomTimetableResponse toResponse(RoomTimetableEntry entry) {
        return RoomTimetableResponse.builder()
                .id(entry.getId())
                .buildingId(entry.getRoom().getBuilding().getId())
                .buildingCode(entry.getRoom().getBuilding().getCode())
                .buildingName(entry.getRoom().getBuilding().getName())
                .floorId(entry.getRoom().getFloor().getId())
                .floorNumber(entry.getRoom().getFloor().getFloorNumber())
                .floorName(entry.getRoom().getFloor().getFloorName())
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

    private int daySortIndex(String dayOfWeek) {
        if (dayOfWeek == null) {
            return Integer.MAX_VALUE;
        }

        return switch (dayOfWeek.toUpperCase(Locale.ROOT)) {
            case "MONDAY" -> 1;
            case "TUESDAY" -> 2;
            case "WEDNESDAY" -> 3;
            case "THURSDAY" -> 4;
            case "FRIDAY" -> 5;
            case "SATURDAY" -> 6;
            case "SUNDAY" -> 7;
            default -> Integer.MAX_VALUE;
        };
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
            DayOfWeek parsedDay = DayOfWeek.valueOf(dayOfWeek);
            if (parsedDay == DayOfWeek.SATURDAY || parsedDay == DayOfWeek.SUNDAY) {
                throw new IllegalArgumentException("Selected building is closed on weekends");
            }
        }
    }

    private void validateNoConflict(Room room, String dayOfWeek, LocalTime startTime, LocalTime endTime) {
        List<RoomTimetableEntry> conflicts = timetableRepository.findConflictingEntries(room.getId(), dayOfWeek, startTime, endTime);
        if (!conflicts.isEmpty()) {
            RoomTimetableEntry conflict = conflicts.get(0);
            throw new IllegalArgumentException(
                    "Time conflict in room " + room.getCode() + " with \""
                            + conflict.getLectureName() + "\" ("
                            + conflict.getStartTime() + "-" + conflict.getEndTime() + ")"
            );
        }
    }

    private String normalizeDay(String dayOfWeek) {
        if (dayOfWeek == null || dayOfWeek.trim().isBlank()) {
            throw new IllegalArgumentException("dayOfWeek is required");
        }

        String normalized = dayOfWeek.trim().toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');

        return switch (normalized) {
            case "MON", "MONDAY" -> "MONDAY";
            case "TUE", "TUES", "TUESDAY" -> "TUESDAY";
            case "WED", "WEDNESDAY" -> "WEDNESDAY";
            case "THU", "THUR", "THURSDAY" -> "THURSDAY";
            case "FRI", "FRIDAY" -> "FRIDAY";
            case "SAT", "SATURDAY" -> "SATURDAY";
            case "SUN", "SUNDAY" -> "SUNDAY";
            default -> throw new IllegalArgumentException("Invalid dayOfWeek: " + dayOfWeek);
        };
    }

    private RoomTimetableEntry.EntryType parseEntryType(String entryType) {
        if (entryType == null || entryType.isBlank()) {
            return RoomTimetableEntry.EntryType.OTHER;
        }

        try {
            return RoomTimetableEntry.EntryType.valueOf(entryType.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return RoomTimetableEntry.EntryType.OTHER;
        }
    }

    private String normalizeOptional(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private Map<String, Integer> buildHeaderMap(Row headerRow, DataFormatter formatter) {
        Map<String, Integer> columns = new HashMap<>();
        for (Cell cell : headerRow) {
            String header = formatter.formatCellValue(cell)
                    .trim()
                    .toLowerCase(Locale.ROOT)
                    .replace("_", "")
                    .replace("-", "")
                    .replace(" ", "");
            if (!header.isBlank()) {
                columns.put(header, cell.getColumnIndex());
            }
        }
        return columns;
    }

    private Integer findColumn(Map<String, Integer> columns, String... names) {
        for (String name : names) {
            Integer column = columns.get(name);
            if (column != null) {
                return column;
            }
        }
        return null;
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            if (i < 0) {
                continue;
            }
            if (!formatter.formatCellValue(row.getCell(i)).trim().isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String readCell(Row row, Integer column, DataFormatter formatter) {
        if (column == null) {
            return "";
        }
        return formatter.formatCellValue(row.getCell(column)).trim();
    }

    private Room resolveRoom(
            Row row,
            DataFormatter formatter,
            Integer buildingIdColumn,
            Integer buildingCodeColumn,
            Integer floorIdColumn,
            Integer floorNumberColumn,
            Integer roomCodeColumn,
            Integer roomIdColumn,
            Room defaultRoom,
            Map<String, Room> roomByCode,
            Map<Long, Room> roomById
    ) {
        String buildingIdText = readCell(row, buildingIdColumn, formatter);
        String buildingCode = readCell(row, buildingCodeColumn, formatter);
        String floorIdText = readCell(row, floorIdColumn, formatter);
        String floorNumberText = readCell(row, floorNumberColumn, formatter);
        String roomCode = readCell(row, roomCodeColumn, formatter);
        String roomIdText = readCell(row, roomIdColumn, formatter);

        Long expectedBuildingId = buildingIdText.isBlank() ? null : parseLong(buildingIdText, "buildingId");
        Integer expectedFloorNumber = floorNumberText.isBlank() ? null : parseInteger(floorNumberText, "floorNumber");
        Long expectedFloorId = floorIdText.isBlank() ? null : parseLong(floorIdText, "floorId");

        if (!roomCode.isBlank()) {
            Room room = roomByCode.get(roomCode.trim().toLowerCase(Locale.ROOT));
            if (room == null) {
                throw new IllegalArgumentException("Unknown roomCode: " + roomCode);
            }
            validateRoomHierarchy(room, expectedBuildingId, buildingCode, expectedFloorId, expectedFloorNumber);
            return room;
        }

        if (!roomIdText.isBlank()) {
            Long roomId = parseLong(roomIdText, "roomId");
            Room room = roomById.get(roomId);
            if (room == null) {
                throw new IllegalArgumentException("Unknown roomId: " + roomIdText);
            }
            validateRoomHierarchy(room, expectedBuildingId, buildingCode, expectedFloorId, expectedFloorNumber);
            return room;
        }

        if (defaultRoom != null) {
            validateRoomHierarchy(defaultRoom, expectedBuildingId, buildingCode, expectedFloorId, expectedFloorNumber);
            return defaultRoom;
        }

        throw new IllegalArgumentException("Room is required (roomCode or roomId)");
    }

    private Room resolveOptionalRoom(
            Row row,
            DataFormatter formatter,
            Integer roomCodeColumn,
            Integer roomIdColumn,
            Map<String, Room> roomByCode,
            Map<Long, Room> roomById
    ) {
        String roomCode = readCell(row, roomCodeColumn, formatter);
        String roomIdText = readCell(row, roomIdColumn, formatter);

        if (roomCode.isBlank() && roomIdText.isBlank()) {
            return null;
        }

        if (!roomCode.isBlank()) {
            Room room = roomByCode.get(roomCode.trim().toLowerCase(Locale.ROOT));
            if (room == null) {
                throw new IllegalArgumentException("Unknown substituteRoomCode: " + roomCode);
            }
            return room;
        }

        Long roomId = parseLong(roomIdText, "substituteRoomId");
        Room room = roomById.get(roomId);
        if (room == null) {
            throw new IllegalArgumentException("Unknown substituteRoomId: " + roomIdText);
        }

        return room;
    }

    private Long parseLong(String value, String fieldName) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid " + fieldName + ": " + value);
        }
    }

    private Integer parseInteger(String value, String fieldName) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid " + fieldName + ": " + value);
        }
    }

    private void validateRoomHierarchy(
            Room room,
            Long expectedBuildingId,
            String expectedBuildingCode,
            Long expectedFloorId,
            Integer expectedFloorNumber
    ) {
        if (expectedBuildingId != null && !expectedBuildingId.equals(room.getBuilding().getId())) {
            throw new IllegalArgumentException("buildingId does not match room " + room.getCode());
        }

        if (expectedBuildingCode != null && !expectedBuildingCode.isBlank()) {
            String normalizedExpected = expectedBuildingCode.trim().toLowerCase(Locale.ROOT);
            String normalizedActual = room.getBuilding().getCode() == null
                    ? ""
                    : room.getBuilding().getCode().trim().toLowerCase(Locale.ROOT);
            if (!normalizedExpected.equals(normalizedActual)) {
                throw new IllegalArgumentException("buildingCode does not match room " + room.getCode());
            }
        }

        if (expectedFloorId != null && !expectedFloorId.equals(room.getFloor().getId())) {
            throw new IllegalArgumentException("floorId does not match room " + room.getCode());
        }

        if (expectedFloorNumber != null && !expectedFloorNumber.equals(room.getFloor().getFloorNumber())) {
            throw new IllegalArgumentException("floorNumber does not match room " + room.getCode());
        }
    }

    private LocalDate parseDate(Row row, Integer column, DataFormatter formatter) {
        if (column == null) {
            return null;
        }

        Cell cell = row.getCell(column);
        if (cell == null) {
            return null;
        }

        if (isNumericCell(cell) && DateUtil.isCellDateFormatted(cell)) {
            LocalDateTime localDateTime = DateUtil.getLocalDateTime(cell.getNumericCellValue());
            return localDateTime.toLocalDate();
        }

        String value = formatter.formatCellValue(cell).trim();
        if (value.isBlank()) {
            return null;
        }

        for (DateTimeFormatter dateFormatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(value, dateFormatter);
            } catch (DateTimeParseException ignored) {
                // Try next format.
            }
        }

        throw new IllegalArgumentException("Invalid date value: " + value);
    }

    private LocalTime parseTime(Row row, Integer column, DataFormatter formatter, String fieldName) {
        if (column == null) {
            throw new IllegalArgumentException(fieldName + " column is missing");
        }

        Cell cell = row.getCell(column);
        if (cell == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        if (isNumericCell(cell)) {
            try {
                LocalDateTime localDateTime = DateUtil.getLocalDateTime(cell.getNumericCellValue());
                return localDateTime.toLocalTime().withSecond(0).withNano(0);
            } catch (Exception ignored) {
                // Fallback to string parsing below.
            }
        }

        String value = formatter.formatCellValue(cell).trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        return parseTimeString(value, fieldName);
    }

    private LocalTime parseEndTime(
            Row row,
            Integer endTimeColumn,
            Integer durationColumn,
            LocalTime startTime,
            DataFormatter formatter
    ) {
        String endValue = readCell(row, endTimeColumn, formatter);
        if (!endValue.isBlank()) {
            return parseTimeString(endValue, "endTime");
        }

        String durationValue = readCell(row, durationColumn, formatter);
        if (!durationValue.isBlank()) {
            try {
                double hours = Double.parseDouble(durationValue);
                if (hours <= 0) {
                    throw new IllegalArgumentException("duration must be positive");
                }
                long minutes = Math.round(hours * 60);
                return startTime.plusMinutes(minutes);
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("Invalid duration: " + durationValue);
            }
        }

        return startTime.plusHours(1);
    }

    private LocalTime parseTimeString(String value, String fieldName) {
        String normalized = value.trim().toUpperCase(Locale.ROOT);

        for (DateTimeFormatter formatter : TIME_FORMATTERS) {
            try {
                return LocalTime.parse(normalized, formatter).withSecond(0).withNano(0);
            } catch (DateTimeParseException ignored) {
                // Try next format.
            }
        }

        throw new IllegalArgumentException("Invalid " + fieldName + " value: " + value);
    }

    private boolean isNumericCell(Cell cell) {
        CellType cellType = cell.getCellType();
        if (cellType == CellType.NUMERIC) {
            return true;
        }
        return cellType == CellType.FORMULA && cell.getCachedFormulaResultType() == CellType.NUMERIC;
    }

    private User resolveStaff(
            String staffName,
            String staffEmail,
            Map<String, User> staffByEmail,
            Map<String, List<User>> staffByLookup
    ) {
        User emailMatch = null;

        if (staffEmail != null && !staffEmail.isBlank()) {
            String emailKey = staffEmail.trim().toLowerCase(Locale.ROOT);
            emailMatch = staffByEmail.get(emailKey);
            if (emailMatch == null) {
                throw new IllegalArgumentException("Staff not found for email: " + staffEmail);
            }
        }

        if (staffName != null && !staffName.isBlank()) {
            String nameKey = normalizeLookupKey(staffName);
            List<User> matches = staffByLookup.get(nameKey);

            if (matches == null || matches.isEmpty()) {
                if (emailMatch != null) {
                    return emailMatch;
                }
                throw new IllegalArgumentException("Staff not found for name: " + staffName);
            }

            if (emailMatch != null) {
                for (User matchedUser : matches) {
                    if (matchedUser.getId().equals(emailMatch.getId())) {
                        return emailMatch;
                    }
                }
                return emailMatch;
            }

            if (matches.size() > 1) {
                throw new IllegalArgumentException("Multiple staff members matched name: " + staffName + ". Use staffEmail.");
            }

            return matches.get(0);
        }

        if (emailMatch != null) {
            return emailMatch;
        }

        throw new IllegalArgumentException("staffName or staffEmail is required");
    }

    private void addLookup(Map<String, List<User>> staffByLookup, String rawKey, User user) {
        String key = normalizeLookupKey(rawKey);
        if (key.isBlank()) {
            return;
        }

        staffByLookup.computeIfAbsent(key, ignored -> new ArrayList<>());
        List<User> users = staffByLookup.get(key);
        if (users.stream().noneMatch(existing -> existing.getId().equals(user.getId()))) {
            users.add(user);
        }
    }

    private String normalizeLookupKey(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private String buildFullName(String firstName, String lastName) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();
        String full = (first + " " + last).trim();
        return full.isBlank() ? "Unknown Staff" : full;
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }
        if (second != null && !second.isBlank()) {
            return second.trim();
        }
        return null;
    }

    private String buildPurpose(String purpose, String batch, String subject) {
        List<String> parts = new ArrayList<>();

        if (purpose != null && !purpose.isBlank()) {
            parts.add(purpose.trim());
        }
        if (batch != null && !batch.isBlank()) {
            parts.add("Batch: " + batch.trim());
        }
        if (subject != null && !subject.isBlank()) {
            parts.add("Subject: " + subject.trim());
        }

        if (parts.isEmpty()) {
            return "Academic timetable session";
        }

        return String.join(" | ", parts);
    }

    private String buildNotes(String notes, LocalDate date) {
        List<String> parts = new ArrayList<>();
        parts.add("Imported via Excel");

        if (date != null) {
            parts.add("Date: " + date);
        }

        if (notes != null && !notes.isBlank()) {
            parts.add(notes.trim());
        }

        return String.join(" | ", parts);
    }

    private boolean parseActiveFlag(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return true;
        }

        String normalized = rawValue.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "1", "true", "yes", "y", "active", "enabled" -> true;
            case "0", "false", "no", "n", "inactive", "disabled" -> false;
            default -> true;
        };
    }

    private boolean isAllowedAcademicTemplateRoom(Room room) {
        String type = room.getType() == null ? "" : room.getType().toLowerCase(Locale.ROOT);
        String name = room.getName() == null ? "" : room.getName().toLowerCase(Locale.ROOT);
        String code = room.getCode() == null ? "" : room.getCode().toLowerCase(Locale.ROOT);

        List<String> blockedKeywords = List.of("study", "student", "reading");
        for (String keyword : blockedKeywords) {
            if (type.contains(keyword) || name.contains(keyword) || code.contains(keyword)) {
                return false;
            }
        }

        return true;
    }
}
