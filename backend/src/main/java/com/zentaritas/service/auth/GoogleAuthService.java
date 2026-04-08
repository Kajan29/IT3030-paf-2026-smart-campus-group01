package com.zentaritas.service.auth;

import com.zentaritas.dto.auth.response.AuthResponse;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.repository.auth.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${app.auth.google.allowed-client-ids:}")
    private String allowedGoogleClientIds;

    public AuthResponse authenticateWithGoogle(String googleToken, Role role) {
        try {
            List<String> allowedClientIds = resolveAllowedClientIds();
            if (allowedClientIds.isEmpty()) {
                throw new IllegalStateException("Google authentication is not configured on the server.");
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(allowedClientIds)
                    .build();

            GoogleIdToken idToken = verifier.verify(googleToken);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new RuntimeException("Google token does not contain an email address");
            }

            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new RuntimeException("Google email address is not verified");
            }

            String googleId = payload.getSubject();
            String firstName = firstNonBlank((String) payload.get("given_name"), "Google");
            String lastName = firstNonBlank((String) payload.get("family_name"), "User");
            String pictureUrl = (String) payload.get("picture");

            // Prefer existing Google-linked account, then fallback to email match.
            User user = userRepository.findByGoogleId(googleId)
                    .orElseGet(() -> userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .email(email)
                                .username(email)
                                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                                .firstName(firstName)
                                .lastName(lastName)
                                .role(role)
                                .googleId(googleId)
                                .profilePicture(pictureUrl)
                                .isVerified(true) // Google accounts are pre-verified
                                .isActive(true)
                                .build();
                        return userRepository.save(newUser);
                    }));

            // Update Google ID if not set
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                user.setIsVerified(true);
                userRepository.save(user);
            }

            if (user.getUsername() == null || user.getUsername().isBlank()) {
                user.setUsername(user.getEmail());
                userRepository.save(user);
            }

            UserDetails userDetails = authService.loadUserByUsername(user.getEmail());
            String accessToken = jwtService.generateAccessToken(userDetails);
            refreshTokenService.revokeAllUserTokens(user.getId());
            String refreshToken = refreshTokenService.issueRefreshToken(user);

            log.info("User authenticated with Google: {}", user.getEmail());

            return AuthResponse.builder()
                    .token(accessToken)
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .username(user.getUsername())
                    .profilePicture(user.getProfilePicture())
                    .phoneNumber(user.getPhoneNumber())
                    .department(user.getDepartment())
                    .role(user.getRole())
                    .isVerified(user.getIsVerified())
                    .build();

        } catch (Exception e) {
            log.error("Error authenticating with Google", e);
            throw new RuntimeException("Failed to authenticate with Google: " + e.getMessage());
        }
    }

    private List<String> resolveAllowedClientIds() {
        List<String> configured = Arrays.stream(allowedGoogleClientIds.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toList());

        if (!googleClientId.isBlank() && !configured.contains(googleClientId)) {
            configured.add(googleClientId);
        }

        return configured;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary == null || primary.isBlank()) {
            return fallback;
        }
        return primary;
    }
}
