package com.zentaritas.controller.management;

import com.zentaritas.dto.management.availability.RoomTimetableRequest;
import com.zentaritas.dto.management.availability.RoomTimetableImportResult;
import com.zentaritas.dto.management.availability.RoomTimetableResponse;
import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.service.management.RoomTimetableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/management/availability")
@RequiredArgsConstructor
public class RoomAvailabilityController {

    private final RoomTimetableService roomTimetableService;

    @GetMapping("/rooms/{roomId}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<RoomTimetableResponse>>> getRoomEntries(@PathVariable Long roomId) {
        return ResponseEntity.ok(ApiResponse.success(roomTimetableService.getEntriesForRoom(roomId)));
    }

    @GetMapping("/rooms/{roomId}/date")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<RoomTimetableResponse>>> getRoomEntriesForDate(
            @PathVariable Long roomId,
            @RequestParam LocalDate date
    ) {
        return ResponseEntity.ok(ApiResponse.success(roomTimetableService.getEntriesForRoomAndDate(roomId, date)));
    }

    @GetMapping("/my-allocations")
    @PreAuthorize("hasRole('ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<RoomTimetableResponse>>> getMyAllocations(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(roomTimetableService.getEntriesForAcademicStaff(authentication)));
    }

    @PostMapping("/entries")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<RoomTimetableResponse>> createEntry(
            @Valid @RequestBody RoomTimetableRequest request,
            Authentication authentication
    ) {
        RoomTimetableResponse response = roomTimetableService.createEntry(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Timetable entry created successfully"));
    }

    @PutMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<RoomTimetableResponse>> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody RoomTimetableRequest request
    ) {
        RoomTimetableResponse response = roomTimetableService.updateEntry(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Timetable entry updated successfully"));
    }

    @DeleteMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(@PathVariable Long id) {
        roomTimetableService.deleteEntry(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Timetable entry deleted successfully"));
    }

    @PostMapping("/entries/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RoomTimetableImportResult>>> importEntriesFromExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "defaultRoomId", required = false) Long defaultRoomId,
            Authentication authentication
    ) {
        List<RoomTimetableImportResult> response = roomTimetableService.importEntriesFromExcel(file, defaultRoomId, authentication);
        return ResponseEntity.ok(ApiResponse.success(response, "Timetable import processed"));
    }

    @GetMapping("/entries/import-template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=room-timetable-import-template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(roomTimetableService.generateImportTemplate());
    }
}