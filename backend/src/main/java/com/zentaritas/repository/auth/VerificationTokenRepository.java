package com.zentaritas.repository.auth;

import com.zentaritas.model.auth.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByTokenAndEmailAndTokenType(
        String token, 
        String email, 
        VerificationToken.TokenType tokenType
    );

    Optional<VerificationToken> findByTokenAndEmailIgnoreCaseAndTokenType(
        String token,
        String email,
        VerificationToken.TokenType tokenType
    );
    
    void deleteByEmailAndTokenType(String email, VerificationToken.TokenType tokenType);
    
    void deleteByExpiryDateBefore(LocalDateTime dateTime);
}
