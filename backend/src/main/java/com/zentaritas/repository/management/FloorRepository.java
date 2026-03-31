package com.zentaritas.repository.management;

import com.zentaritas.model.management.Floor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FloorRepository extends JpaRepository<Floor, Long> {
    List<Floor> findByBuildingIdOrderByFloorNumberAsc(Long buildingId);
    Optional<Floor> findByBuildingIdAndFloorNumber(Long buildingId, Integer floorNumber);
    boolean existsByBuildingIdAndFloorNumber(Long buildingId, Integer floorNumber);
    boolean existsByBuildingId(Long buildingId);
}
