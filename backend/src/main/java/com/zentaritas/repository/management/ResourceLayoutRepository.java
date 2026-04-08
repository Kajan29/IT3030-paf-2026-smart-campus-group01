package com.zentaritas.repository.management;

import com.zentaritas.model.management.ResourceLayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResourceLayoutRepository extends JpaRepository<ResourceLayout, Long> {
    List<ResourceLayout> findByRoomIdOrderByIdAsc(Long roomId);
    Optional<ResourceLayout> findByResourceId(Long resourceId);
}
