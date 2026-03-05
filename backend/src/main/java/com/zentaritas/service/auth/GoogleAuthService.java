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

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    public AuthResponse authenticateWithGoogle(String googleToken, Role role) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleToken);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String googleId = payload.getSubject();
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");
            String pictureUrl = (String) payload.get("picture");

            // Check if user exists
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        // Create new user
                        User newUser = User.builder()
                                .email(email)
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
                    });

            // Update Google ID if not set
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                user.setIsVerified(true);
                userRepository.save(user);
            }

            UserDetails userDetails = authService.loadUserByUsername(user.getEmail());
            String jwtToken = jwtService.generateToken(userDetails);

            log.info("User authenticated with Google: {}", user.getEmail());

            return AuthResponse.builder()
                    .token(jwtToken)
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole())
                    .isVerified(user.getIsVerified())
                    .build();

        } catch (Exception e) {
            log.error("Error authenticating with Google", e);
            throw new RuntimeException("Failed to authenticate with Google: " + e.getMessage());
        }
    }
}
