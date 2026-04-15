package com.zentaritas.service.auth;

import com.zentaritas.dto.auth.request.*;
import com.zentaritas.dto.auth.response.AuthResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.auth.VerificationToken;
import com.zentaritas.model.booking.BookingNotification;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.auth.VerificationTokenRepository;
import com.zentaritas.service.booking.NotificationService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Locale;
import java.util.Random;

@Service
@Slf4j
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
        private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            VerificationTokenRepository verificationTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
                        RefreshTokenService refreshTokenService,
            EmailService emailService,
                NotificationService notificationService,
            @Lazy AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
                this.refreshTokenService = refreshTokenService;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        boolean isActive = !Boolean.FALSE.equals(user.getIsActive());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
            .accountLocked(!isActive)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        // Check if user already exists
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new RuntimeException("Email is already registered. Please log in instead.");
        }

        // Create new user (only students can register)
        User user = User.builder()
                .email(normalizedEmail)
                .username(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.STUDENT)
                .isVerified(false)
                .isActive(true)
                .build();

        userRepository.save(user);

        notificationService.notifyAdmins(
            BookingNotification.NotificationType.STUDENT_REGISTERED,
            "New Student Registered",
            user.getFirstName() + " " + user.getLastName() + " (" + user.getEmail() + ") created a new account.",
            null,
            null,
            "/admin?view=users"
        );

        // Generate and save verification code
        String verificationCode = generateVerificationCode();
        saveVerificationToken(user.getEmail(), verificationCode, VerificationToken.TokenType.EMAIL_VERIFICATION);

        // Send email after data is saved — don't let email failure roll back user creation
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationCode);
        } catch (Exception e) {
            log.error("Failed to send verification email to {} — user was still created", user.getEmail(), e);
        }

        log.info("User registered successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .isVerified(false)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    normalizedEmail,
                    request.getPassword()
                )
            );
        } catch (AuthenticationException ex) {
            throw new RuntimeException("Invalid email or password.");
        }

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getIsVerified()) {
            throw new RuntimeException("Email not verified. Please verify your email first.");
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new RuntimeException("User account is inactive.");
        }

        UserDetails userDetails = loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        refreshTokenService.revokeAllUserTokens(user.getId());
        String refreshToken = refreshTokenService.issueRefreshToken(user);

        log.info("User logged in successfully: {}", user.getEmail());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshToken) {
        RefreshTokenService.RefreshSession refreshSession = refreshTokenService.rotateRefreshToken(refreshToken);
        User user = refreshSession.user();
        UserDetails userDetails = loadUserByUsername(user.getEmail());

        String accessToken = jwtService.generateAccessToken(userDetails);
        return buildAuthResponse(user, accessToken, refreshSession.refreshToken());
    }

    @Transactional
    public void logout(String refreshToken, String userEmail) {
        if (StringUtils.hasText(refreshToken)) {
            refreshTokenService.revokeByRawToken(refreshToken);
        }

        if (StringUtils.hasText(userEmail)) {
            userRepository.findByEmailIgnoreCase(userEmail)
                    .ifPresent(user -> refreshTokenService.revokeAllUserTokens(user.getId()));
        }
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String verificationCode = request.getVerificationCode().trim();

        VerificationToken token = verificationTokenRepository
                .findByTokenAndEmailIgnoreCaseAndTokenType(
                        verificationCode,
                        normalizedEmail,
                        VerificationToken.TokenType.EMAIL_VERIFICATION
                )
                .orElseThrow(() -> new RuntimeException("Invalid verification code"));

        if (token.getIsUsed()) {
            throw new RuntimeException("Verification code already used");
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code expired");
        }

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsVerified(true);
        userRepository.save(user);

        token.setIsUsed(true);
        verificationTokenRepository.save(token);

        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());

        log.info("Email verified successfully: {}", user.getEmail());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address."));

        // Delete old password reset tokens
        verificationTokenRepository.deleteByEmailAndTokenType(
            user.getEmail(),
                VerificationToken.TokenType.PASSWORD_RESET
        );

        // Generate and save new verification code
        String verificationCode = generateVerificationCode();
        saveVerificationToken(user.getEmail(), verificationCode, VerificationToken.TokenType.PASSWORD_RESET);

        // Send email after data is saved — don't let email failure roll back token creation
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), verificationCode);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", user.getEmail(), e);
        }

        log.info("Password reset code sent to: {}", user.getEmail());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String verificationCode = request.getVerificationCode().trim();

        VerificationToken token = verificationTokenRepository
            .findByTokenAndEmailIgnoreCaseAndTokenType(
                verificationCode,
                normalizedEmail,
                        VerificationToken.TokenType.PASSWORD_RESET
                )
                .orElseThrow(() -> new RuntimeException("Invalid verification code"));

        if (token.getIsUsed()) {
            throw new RuntimeException("Verification code already used");
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code expired");
        }

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        refreshTokenService.revokeAllUserTokens(user.getId()); // invalidate existing sessions after password change
        userRepository.save(user);

        token.setIsUsed(true);
        verificationTokenRepository.save(token);

        log.info("Password reset successfully for: {}", user.getEmail());
    }

    @Transactional
    public void resendVerificationCode(String email) {
        String normalizedEmail = normalizeEmail(email);

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsVerified()) {
            throw new RuntimeException("Email already verified");
        }

        // Delete old verification tokens
        verificationTokenRepository.deleteByEmailAndTokenType(
            user.getEmail(),
                VerificationToken.TokenType.EMAIL_VERIFICATION
        );

        // Generate and save new verification code
        String verificationCode = generateVerificationCode();
        saveVerificationToken(user.getEmail(), verificationCode, VerificationToken.TokenType.EMAIL_VERIFICATION);

        // Send email after data is saved — don't let email failure roll back token creation
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationCode);
        } catch (Exception e) {
            log.error("Failed to resend verification email to {}", user.getEmail(), e);
        }

        log.info("Verification code resent to: {}", user.getEmail());
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private void saveVerificationToken(String email, String token, VerificationToken.TokenType tokenType) {
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .email(email)
                .tokenType(tokenType)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();

        verificationTokenRepository.save(verificationToken);
    }

        private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
                return AuthResponse.builder()
                                .token(accessToken)
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
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
