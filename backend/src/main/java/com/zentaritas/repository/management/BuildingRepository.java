package com.zentaritas.repository.management;

import com.zentaritas.model.management.Building;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BuildingRepository extends JpaRepository<Building, Long> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<Building> findByCodeIgnoreCase(String code);
}
