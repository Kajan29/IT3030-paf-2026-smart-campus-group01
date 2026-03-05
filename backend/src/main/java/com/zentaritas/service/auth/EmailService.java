package com.zentaritas.service.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Load HTML template from resources and replace placeholders
     */
    private String loadTemplate(String templateName) {
        try {
            ClassPathResource resource = new ClassPathResource("templates/" + templateName);
            byte[] bytes = Files.readAllBytes(resource.getFile().toPath());
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to load email template: {}", templateName, e);
            throw new RuntimeException("Failed to load email template", e);
        }
    }

    /**
     * Send HTML email with template
     */
    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML
            
            mailSender.send(message);
            log.info("Email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send verification email with professional HTML template
     */
    public void sendVerificationEmail(String toEmail, String verificationCode) {
        try {
            String htmlContent = loadTemplate("email-verification.html");
            htmlContent = htmlContent.replace("${verificationCode}", verificationCode);
            
            sendHtmlEmail(toEmail, "Email Verification - Zentaritas", htmlContent);
            log.info("Verification email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    /**
     * Send password reset email with professional HTML template
     */
    public void sendPasswordResetEmail(String toEmail, String verificationCode) {
        try {
            String htmlContent = loadTemplate("password-reset.html");
            htmlContent = htmlContent.replace("${verificationCode}", verificationCode);
            htmlContent = htmlContent.replace("${userEmail}", toEmail);
            
            sendHtmlEmail(toEmail, "Password Reset - Zentaritas", htmlContent);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    /**
     * Send welcome email after successful verification
     */
    public void sendWelcomeEmail(String toEmail, String userName) {
        try {
            String htmlContent = loadTemplate("welcome-email.html");
            htmlContent = htmlContent.replace("${userName}", userName);
            htmlContent = htmlContent.replace("${loginUrl}", frontendUrl + "/login");
            
            sendHtmlEmail(toEmail, "Welcome to Zentaritas! 🎉", htmlContent);
            log.info("Welcome email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
            // Don't throw exception for welcome email - it's not critical
            log.warn("Continuing without sending welcome email");
        }
    }

    /**
     * Send admin welcome email with credentials
     */
    public void sendAdminWelcomeEmail(String toEmail, String adminName, String defaultPassword) {
        try {
            String htmlContent = loadTemplate("admin-welcome.html");
            htmlContent = htmlContent.replace("${adminName}", adminName);
            htmlContent = htmlContent.replace("${adminEmail}", toEmail);
            htmlContent = htmlContent.replace("${defaultPassword}", defaultPassword);
            htmlContent = htmlContent.replace("${loginUrl}", frontendUrl + "/login");
            htmlContent = htmlContent.replace("${dashboardUrl}", frontendUrl + "/admin");
            
            sendHtmlEmail(toEmail, "Admin Account Created - Zentaritas", htmlContent);
            log.info("Admin welcome email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send admin welcome email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send admin welcome email", e);
        }
    }

    /**
     * Send staff credentials email
     */
    public void sendStaffCredentialsEmail(String toEmail, String staffName, String defaultPassword, String roleType) {
        try {
            String htmlContent = loadTemplate("admin-welcome.html");
            htmlContent = htmlContent.replace("${adminName}", staffName);
            htmlContent = htmlContent.replace("${adminEmail}", toEmail);
            htmlContent = htmlContent.replace("${defaultPassword}", defaultPassword);
            htmlContent = htmlContent.replace("${loginUrl}", frontendUrl + "/login");
            htmlContent = htmlContent.replace("${dashboardUrl}", frontendUrl + "/dashboard");
            htmlContent = htmlContent.replace("Admin", roleType.replace("_", " "));
            
            sendHtmlEmail(toEmail, "Staff Account Created - Zentaritas", htmlContent);
            log.info("Staff credentials email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send staff credentials email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send staff credentials email", e);
        }
    }
}
