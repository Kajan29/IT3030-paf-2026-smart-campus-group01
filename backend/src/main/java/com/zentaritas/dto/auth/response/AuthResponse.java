package com.zentaritas.dto.auth.response;

import com.zentaritas.model.auth.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private Boolean isVerified;
}
