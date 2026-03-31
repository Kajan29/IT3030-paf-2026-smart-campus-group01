package com.zentaritas.repository.management;

import com.zentaritas.model.management.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<Room> findByCodeIgnoreCase(String code);
    boolean existsByBuildingId(Long buildingId);
    boolean existsByFloorId(Long floorId);
    List<Room> findByBuildingIdOrderByNameAsc(Long buildingId);
    List<Room> findByFloorIdOrderByNameAsc(Long floorId);
    List<Room> findByBuildingIdAndFloorIdOrderByNameAsc(Long buildingId, Long floorId);
}
