package com.zentaritas.controller.management;

import com.zentaritas.dto.management.CreateStaffRequest;
import com.zentaritas.dto.management.StaffCreationResponse;
import com.zentaritas.dto.management.UpdateUserStatusRequest;
import com.zentaritas.dto.management.UserManagementResponse;
import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.model.auth.Role;
import com.zentaritas.service.management.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserManagementResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.getAllUsers()));
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<UserManagementResponse>>> getStudents() {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.getStudents()));
    }

    @GetMapping("/staff")
    public ResponseEntity<ApiResponse<List<UserManagementResponse>>> getStaff() {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.getStaff()));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<List<UserManagementResponse>>> getUsersByRole(@PathVariable String role) {
        Role parsedRole = Role.valueOf(role.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(userManagementService.getUsersByRole(parsedRole)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserManagementResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.getUserById(id)));
    }

    @PostMapping("/staff")
    public ResponseEntity<ApiResponse<StaffCreationResponse>> createStaffAccount(
            @Valid @RequestBody CreateStaffRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.createStaffAccount(request)));
    }

    @PostMapping("/staff/import")
    public ResponseEntity<ApiResponse<List<StaffCreationResponse>>> importStaffFromExcel(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.importStaffFromExcel(file)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserManagementResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.updateUserStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userManagementService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }
}
