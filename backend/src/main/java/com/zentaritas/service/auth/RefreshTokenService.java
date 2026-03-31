package com.zentaritas.service.auth;

import com.zentaritas.model.auth.RefreshToken;
import com.zentaritas.model.auth.User;
import com.zentaritas.repository.auth.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-expiration-days:7}")
    private long refreshTokenExpirationDays;

    @Transactional
    public String issueRefreshToken(User user) {
        String rawToken = generateRawToken();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional
    public RefreshSession rotateRefreshToken(String rawToken) {
        RefreshToken existingToken = getValidToken(rawToken);
        User user = existingToken.getUser();

        existingToken.setRevoked(true);
        refreshTokenRepository.save(existingToken);

        String newRefreshToken = issueRefreshToken(user);
        return new RefreshSession(user, newRefreshToken);
    }

    @Transactional
    public void revokeByRawToken(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return;
        }

        refreshTokenRepository.findByTokenHashAndRevokedFalse(hashToken(rawToken))
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    @Transactional
    public void revokeAllUserTokens(Long userId) {
        refreshTokenRepository.revokeAllActiveTokensByUserId(userId);
    }

    private RefreshToken getValidToken(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            throw new RuntimeException("Refresh token is required");
        }

        RefreshToken token = refreshTokenRepository.findByTokenHashAndRevokedFalse(hashToken(rawToken))
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new RuntimeException("Refresh token expired");
        }

        User user = token.getUser();
        if (Boolean.FALSE.equals(user.getIsActive())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new RuntimeException("User account is inactive");
        }

        return token;
    }

    private String generateRawToken() {
        return UUID.randomUUID() + "." + UUID.randomUUID();
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash refresh token", e);
        }
    }

    public record RefreshSession(User user, String refreshToken) {
    }
}
