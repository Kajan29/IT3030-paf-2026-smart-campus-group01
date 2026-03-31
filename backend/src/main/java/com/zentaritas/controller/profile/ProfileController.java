package com.zentaritas.controller.profile;

import com.zentaritas.dto.auth.response.AuthResponse;
import com.zentaritas.dto.profile.ProfileUpdateRequest;
import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.service.profile.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(ApiResponse.success(profileService.getProfile(email)));
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(
            @Valid @ModelAttribute ProfileUpdateRequest request,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,
            Authentication authentication
    ) {
        String email = authentication.getName();
        AuthResponse updated = profileService.updateProfile(email, request, avatar);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated"));
    }
}
