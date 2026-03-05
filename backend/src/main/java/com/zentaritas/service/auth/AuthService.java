package com.zentaritas.service.auth;

import com.zentaritas.dto.auth.request.*;
import com.zentaritas.dto.auth.response.AuthResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.auth.VerificationToken;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.auth.VerificationTokenRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Random;

@Service
@Slf4j
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            VerificationTokenRepository verificationTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            @Lazy AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .accountLocked(!user.getIsActive())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user (only students can register)
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.STUDENT)
                .isVerified(false)
                .isActive(true)
                .build();

        userRepository.save(user);

        // Generate and send verification code
        String verificationCode = generateVerificationCode();
        saveVerificationToken(user.getEmail(), verificationCode, VerificationToken.TokenType.EMAIL_VERIFICATION);
        emailService.sendVerificationEmail(user.getEmail(), verificationCode);

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
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getIsVerified()) {
            throw new RuntimeException("Email not verified. Please verify your email first.");
        }

        UserDetails userDetails = loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .isVerified(user.getIsVerified())
                .build();
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        VerificationToken token = verificationTokenRepository
                .findByTokenAndEmailAndTokenType(
                        request.getVerificationCode(),
                        request.getEmail(),
                        VerificationToken.TokenType.EMAIL_VERIFICATION
                )
                .orElseThrow(() -> new RuntimeException("Invalid verification code"));

        if (token.getIsUsed()) {
            throw new RuntimeException("Verification code already used");
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code expired");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsVerified(true);
        userRepository.save(user);

        token.setIsUsed(true);
        verificationTokenRepository.save(token);

        log.info("Email verified successfully: {}", user.getEmail());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with this email"));

        // Delete old password reset tokens
        verificationTokenRepository.deleteByEmailAndTokenType(
                request.getEmail(),
                VerificationToken.TokenType.PASSWORD_RESET
        );

        // Generate and send new verification code
        String verificationCode = generateVerificationCode();
        saveVerificationToken(user.getEmail(), verificationCode, VerificationToken.TokenType.PASSWORD_RESET);
        emailService.sendPasswordResetEmail(user.getEmail(), verificationCode);

        log.info("Password reset code sent to: {}", user.getEmail());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken token = verificationTokenRepository
                .findByTokenAndEmailAndTokenType(
                        request.getVerificationCode(),
                        request.getEmail(),
                        VerificationToken.TokenType.PASSWORD_RESET
                )
                .orElseThrow(() -> new RuntimeException("Invalid verification code"));

        if (token.getIsUsed()) {
            throw new RuntimeException("Verification code already used");
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code expired");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setIsUsed(true);
        verificationTokenRepository.save(token);

        log.info("Password reset successfully for: {}", user.getEmail());
    }

    @Transactional
    public void resendVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsVerified()) {
            throw new RuntimeException("Email already verified");
        }

        // Delete old verification tokens
        verificationTokenRepository.deleteByEmailAndTokenType(
                email,
                VerificationToken.TokenType.EMAIL_VERIFICATION
        );

        // Generate and send new verification code
        String verificationCode = generateVerificationCode();
        saveVerificationToken(email, verificationCode, VerificationToken.TokenType.EMAIL_VERIFICATION);
        emailService.sendVerificationEmail(email, verificationCode);

        log.info("Verification code resent to: {}", email);
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
}
