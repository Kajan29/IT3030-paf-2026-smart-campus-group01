package com.zentaritas.controller.management;

import com.zentaritas.dto.management.facility.BuildingResponse;
import com.zentaritas.dto.management.facility.FloorResponse;
import com.zentaritas.dto.management.facility.RoomResponse;
import com.zentaritas.dto.management.resource.LayoutSaveRequest;
import com.zentaritas.dto.management.resource.ResourceLayoutResponse;
import com.zentaritas.dto.management.resource.ResourceLayoutRequest;
import com.zentaritas.dto.management.resource.ResourceRequest;
import com.zentaritas.dto.management.resource.ResourceResponse;
import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.service.management.ResourceManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/management/resource-management")
@RequiredArgsConstructor
public class ResourceManagementController {

    private final ResourceManagementService resourceManagementService;

    @GetMapping("/buildings")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<BuildingResponse>>> getBuildings() {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.getBuildings()));
    }

    @GetMapping("/floors")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<FloorResponse>>> getFloors(@RequestParam(value = "buildingId", required = false) Long buildingId) {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.getFloors(buildingId)));
    }

    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRooms(@RequestParam(value = "floorId", required = false) Long floorId) {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.getRooms(floorId)));
    }

    @GetMapping("/resources")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> getResources(@RequestParam("roomId") Long roomId) {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.getResources(roomId)));
    }

    @PostMapping("/resources")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<ResourceResponse>> createResource(@Valid @RequestBody ResourceRequest request) {
        ResourceResponse response = resourceManagementService.createResource(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Resource created successfully"));
    }

    @PutMapping("/resources/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<ResourceResponse>> updateResource(@PathVariable Long id, @Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.updateResource(id, request), "Resource updated successfully"));
    }

    @DeleteMapping("/resources/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable Long id) {
        resourceManagementService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Resource deleted successfully"));
    }

    @GetMapping("/layout")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF','STUDENT')")
    public ResponseEntity<ApiResponse<List<ResourceLayoutResponse>>> getLayout(@RequestParam("roomId") Long roomId) {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.getLayout(roomId)));
    }

    @PostMapping("/layout/save")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<ResourceLayoutResponse>>> saveLayout(@Valid @RequestBody LayoutSaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.saveLayout(request), "Layout saved successfully"));
    }

    @PutMapping("/layout/update")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<ResourceLayoutResponse>> updateLayout(@Valid @RequestBody ResourceLayoutRequest request) {
        return ResponseEntity.ok(ApiResponse.success(resourceManagementService.updateLayout(request), "Layout updated successfully"));
    }
}
