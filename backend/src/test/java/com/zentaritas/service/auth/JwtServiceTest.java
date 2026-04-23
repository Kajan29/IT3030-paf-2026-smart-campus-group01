package com.zentaritas.service.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String BASE64_SECRET = Base64.getEncoder()
            .encodeToString("01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", BASE64_SECRET);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 60_000L);
        userDetails = User.withUsername("student@zentaritas.com").password("password").roles("STUDENT").build();
    }

    @Test
    void generateAccessTokenCreatesValidTokenForMatchingUser() {
        String token = jwtService.generateAccessToken(userDetails);

        assertEquals("student@zentaritas.com", jwtService.extractUsername(token));
        assertTrue(jwtService.isAccessToken(token));
        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    void generateTokenPreservesExtraClaims() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "STUDENT");

        String token = jwtService.generateToken(extraClaims, userDetails);

        assertEquals("STUDENT", jwtService.extractClaim(token, claims -> claims.get("role", String.class)));
        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    void refreshStyleTokenIsNotTreatedAsValidAccessToken() {
        Instant now = Instant.now();
        String refreshToken = Jwts.builder()
                .claim("tokenType", "REFRESH")
                .subject(userDetails.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(60)))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(BASE64_SECRET)))
                .compact();

        assertFalse(jwtService.isAccessToken(refreshToken));
        assertFalse(jwtService.isTokenValid(refreshToken, userDetails));
    }
}
