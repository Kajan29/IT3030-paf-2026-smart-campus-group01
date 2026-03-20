package com.zentaritas.dto.management;

import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserManagementResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private Boolean isVerified;
    private Boolean isActive;
    private String profilePicture;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserManagementResponse from(User user) {
        return UserManagementResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .isVerified(user.getIsVerified())
                .isActive(user.getIsActive())
                .profilePicture(user.getProfilePicture())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
