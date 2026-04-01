package com.zentaritas.repository.auth;

import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByGoogleId(String googleId);
    Boolean existsByEmail(String email);
    Boolean existsByEmailIgnoreCase(String email);
    List<User> findByRole(Role role);
    List<User> findByIsActive(Boolean isActive);
    List<User> findByRoleAndIsActive(Role role, Boolean isActive);
}
