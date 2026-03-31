package com.zentaritas.service.profile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.zentaritas.dto.auth.response.AuthResponse;
import com.zentaritas.dto.profile.ProfileUpdateRequest;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.User;
import com.zentaritas.repository.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    public AuthResponse getProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(user);
    }

    public AuthResponse updateProfile(String email, ProfileUpdateRequest request, MultipartFile avatar) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        if (avatar != null && !avatar.isEmpty()) {
            try {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(avatar.getBytes(), ObjectUtils.asMap(
                        "folder", "zentaritas/profile",
                        "resource_type", "image",
                        "public_id", "user-" + user.getId()
                ));
                String secureUrl = Objects.toString(uploadResult.get("secure_url"), null);
                user.setProfilePicture(secureUrl);
            } catch (IOException e) {
                log.error("Failed to upload profile image", e);
                throw new RuntimeException("Failed to upload profile image");
            }
        }

        userRepository.save(user);
        return toResponse(user);
    }

    private AuthResponse toResponse(User user) {
        return AuthResponse.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .phoneNumber(user.getPhoneNumber())
                .department(user.getDepartment())
                .profilePicture(user.getProfilePicture())
                .role(user.getRole())
                .isVerified(user.getIsVerified())
                .build();
    }
}
