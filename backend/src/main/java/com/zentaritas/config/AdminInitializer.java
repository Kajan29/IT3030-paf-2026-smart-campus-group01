package com.zentaritas.config;

import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.service.auth.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * AdminInitializer - Automatically creates an admin account on application startup
 * if it doesn't already exist. The admin credentials are configured via application.properties.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.firstname}")
    private String adminFirstName;

    @Value("${app.admin.lastname}")
    private String adminLastName;

    @Bean
    CommandLineRunner initAdminAccount() {
        return args -> {
            try {
                log.info("🔍 Checking for admin account with email: {}", adminEmail);
                
                // Check if admin account already exists with this specific email
                if (userRepository.existsByEmail(adminEmail)) {
                    log.info("✓ Admin account already exists: {}", adminEmail);
                    return;
                }

                log.info("🆕 No admin account found. Creating admin account for: {}", adminEmail);

                // Create admin account
                User admin = User.builder()
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .firstName(adminFirstName)
                        .lastName(adminLastName)
                        .role(Role.ADMIN)
                        .isVerified(true) // Admin is pre-verified
                        .isActive(true)
                        .build();

                userRepository.save(admin);
                log.info("✅ Admin account created successfully: {}", adminEmail);
                log.info("   Name: {} {}", adminFirstName, adminLastName);
                log.info("   Role: ADMIN");

                // Send welcome email to admin
                try {
                    emailService.sendAdminWelcomeEmail(
                            adminEmail,
                            adminFirstName + " " + adminLastName,
                            adminPassword
                    );
                    log.info("📧 Welcome email sent to admin: {}", adminEmail);
                } catch (Exception e) {
                    log.error("⚠️ Failed to send welcome email to admin. Admin account created but email not sent.", e);
                }

            } catch (Exception e) {
                log.error("❌ Failed to initialize admin account for email: {}", adminEmail, e);
            }
        };
    }
}
