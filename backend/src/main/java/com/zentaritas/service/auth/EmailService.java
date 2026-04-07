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
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalTime;

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
            byte[] bytes;
            try (InputStream inputStream = resource.getInputStream()) {
                bytes = inputStream.readAllBytes();
            }
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
            String htmlContent = loadTemplate("staff-credentials.html");
            htmlContent = htmlContent.replace("${staffName}", staffName);
            htmlContent = htmlContent.replace("${staffEmail}", toEmail);
            htmlContent = htmlContent.replace("${defaultPassword}", defaultPassword);
            htmlContent = htmlContent.replace("${loginUrl}", frontendUrl + "/auth/login");
            
            // Format role type nicely (e.g., ACADEMIC_STAFF -> Academic Staff)
            String formattedRole = roleType.replace("_", " ").toLowerCase();
            formattedRole = formattedRole.substring(0, 1).toUpperCase() + formattedRole.substring(1);
            htmlContent = htmlContent.replace("${roleType}", formattedRole);
            
            sendHtmlEmail(toEmail, "Staff Account Created - Zentaritas", htmlContent);
            log.info("Staff credentials email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send staff credentials email to: {}", toEmail, e);
            // Don't throw exception - we still want to return the password even if email fails
            log.warn("Continuing without sending staff credentials email");
        }
    }

        public void sendRoomChangeEmail(
                        String toEmail,
                        String lecturerName,
                        String originalRoom,
                        String substituteRoom,
                        String dayOfWeek,
                        LocalTime startTime,
                        LocalTime endTime,
                        String note
        ) {
                try {
                        String htmlContent = """
                                        <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; color: #0f172a;">
                                            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
                                                <div style="background: linear-gradient(135deg, #0f766e, #115e59); padding: 28px 32px; color: white;">
                                                    <div style="font-size: 12px; letter-spacing: .18em; text-transform: uppercase; opacity: .85;">Zentaritas</div>
                                                    <h2 style="margin: 8px 0 0; font-size: 26px; line-height: 1.2;">Room allocation updated</h2>
                                                </div>
                                                <div style="padding: 32px;">
                                                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hello ${lecturerName},</p>
                                                    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Your scheduled room has been updated by the admin team.</p>
                                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin: 20px 0;">
                                                        <p style="margin: 0 0 8px;"><strong>Original room:</strong> ${originalRoom}</p>
                                                        <p style="margin: 0 0 8px;"><strong>Substitute room:</strong> ${substituteRoom}</p>
                                                        <p style="margin: 0 0 8px;"><strong>Day:</strong> ${dayOfWeek}</p>
                                                        <p style="margin: 0 0 8px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
                                                        <p style="margin: 0;"><strong>Note:</strong> ${note}</p>
                                                    </div>
                                                    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">Please review the updated schedule before the next session.</p>
                                                </div>
                                            </div>
                                        </div>
                                        """;

                        htmlContent = htmlContent.replace("${lecturerName}", lecturerName)
                                        .replace("${originalRoom}", originalRoom)
                                        .replace("${substituteRoom}", substituteRoom)
                                        .replace("${dayOfWeek}", dayOfWeek)
                                        .replace("${startTime}", startTime.toString())
                                        .replace("${endTime}", endTime.toString())
                                        .replace("${note}", note);

                        sendHtmlEmail(toEmail, "Room update notification - Zentaritas", htmlContent);
                } catch (Exception e) {
                        log.error("Failed to send room change email to: {}", toEmail, e);
                        log.warn("Continuing without sending room change email");
                }
        }
}
