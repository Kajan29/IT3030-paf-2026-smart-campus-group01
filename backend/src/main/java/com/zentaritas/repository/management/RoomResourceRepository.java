package com.zentaritas.repository.management;

import com.zentaritas.model.management.RoomResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomResourceRepository extends JpaRepository<RoomResource, Long> {
    List<RoomResource> findByRoomIdOrderByNameAsc(Long roomId);
}
