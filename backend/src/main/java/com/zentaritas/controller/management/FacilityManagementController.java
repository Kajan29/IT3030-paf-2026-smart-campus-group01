package com.zentaritas.controller.management;

import com.zentaritas.dto.management.facility.BuildingRequest;
import com.zentaritas.dto.management.facility.BuildingResponse;
import com.zentaritas.dto.management.facility.FloorRequest;
import com.zentaritas.dto.management.facility.FloorResponse;
import com.zentaritas.dto.management.facility.RoomRequest;
import com.zentaritas.dto.management.facility.RoomResponse;
import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.service.management.FacilityManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/management/facilities")
@RequiredArgsConstructor
public class FacilityManagementController {

    private final FacilityManagementService facilityManagementService;

    @GetMapping("/buildings")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<BuildingResponse>>> getBuildings() {
        return ResponseEntity.ok(ApiResponse.success(facilityManagementService.getAllBuildings()));
    }

    @GetMapping("/buildings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<BuildingResponse>> getBuildingById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(facilityManagementService.getBuildingById(id)));
    }

    @PostMapping(value = "/buildings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<BuildingResponse>> createBuilding(
            @Valid @RequestPart("data") BuildingRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication
    ) {
        BuildingResponse response = facilityManagementService.createBuilding(request, image, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Building created successfully"));
    }

    @PutMapping(value = "/buildings/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<BuildingResponse>> updateBuilding(
            @PathVariable Long id,
            @Valid @RequestPart("data") BuildingRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        BuildingResponse response = facilityManagementService.updateBuilding(id, request, image);
        return ResponseEntity.ok(ApiResponse.success(response, "Building updated successfully"));
    }

    @DeleteMapping("/buildings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteBuilding(@PathVariable Long id) {
        facilityManagementService.deleteBuilding(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Building deleted successfully"));
    }

    @GetMapping("/floors")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<FloorResponse>>> getFloors(
            @RequestParam(value = "buildingId", required = false) Long buildingId
    ) {
        return ResponseEntity.ok(ApiResponse.success(facilityManagementService.getFloors(buildingId)));
    }

    @GetMapping("/floors/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<FloorResponse>> getFloorById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(facilityManagementService.getFloorById(id)));
    }

    @PostMapping("/floors")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<FloorResponse>> createFloor(
            @Valid @RequestBody FloorRequest request,
            Authentication authentication
    ) {
        FloorResponse response = facilityManagementService.createFloor(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Floor created successfully"));
    }

    @PutMapping("/floors/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<FloorResponse>> updateFloor(
            @PathVariable Long id,
            @Valid @RequestBody FloorRequest request
    ) {
        FloorResponse response = facilityManagementService.updateFloor(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Floor updated successfully"));
    }

    @DeleteMapping("/floors/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteFloor(@PathVariable Long id) {
        facilityManagementService.deleteFloor(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Floor deleted successfully"));
    }

    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRooms(
            @RequestParam(value = "buildingId", required = false) Long buildingId,
            @RequestParam(value = "floorId", required = false) Long floorId
    ) {
        return ResponseEntity.ok(ApiResponse.success(facilityManagementService.getRooms(buildingId, floorId)));
    }

    @GetMapping("/rooms/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(facilityManagementService.getRoomById(id)));
    }

    @PostMapping(value = "/rooms", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestPart("data") RoomRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication
    ) {
        RoomResponse response = facilityManagementService.createRoom(request, image, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Room created successfully"));
    }

    @PutMapping(value = "/rooms/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable Long id,
            @Valid @RequestPart("data") RoomRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        RoomResponse response = facilityManagementService.updateRoom(id, request, image);
        return ResponseEntity.ok(ApiResponse.success(response, "Room updated successfully"));
    }

    @DeleteMapping("/rooms/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        facilityManagementService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Room deleted successfully"));
    }

    /**
     * Permanently assign a non-academic staff member to a room.
     * PUT /api/management/facilities/rooms/{roomId}/assign-staff
     * Body: { "staffId": 123 }  (or { "staffId": null } to unassign)
     */
    @PutMapping("/rooms/{roomId}/assign-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomResponse>> assignStaffToRoom(
            @PathVariable Long roomId,
            @RequestBody java.util.Map<String, Long> body
    ) {
        Long staffId = body.get("staffId");
        RoomResponse response = facilityManagementService.assignStaffToRoom(roomId, staffId);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff assigned to room successfully"));
    }
}
