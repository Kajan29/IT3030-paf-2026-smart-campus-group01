package com.zentaritas.config;

import com.zentaritas.model.management.ResourceLayout;
import com.zentaritas.model.management.Room;
import com.zentaritas.model.management.RoomResource;
import com.zentaritas.repository.management.ResourceLayoutRepository;
import com.zentaritas.repository.management.RoomRepository;
import com.zentaritas.repository.management.RoomResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class ResourceSampleDataInitializer {

    private final RoomRepository roomRepository;
    private final RoomResourceRepository roomResourceRepository;
    private final ResourceLayoutRepository resourceLayoutRepository;

    @Bean
    @Order(3)
    CommandLineRunner initResourceSampleData() {
        return args -> {
            int resourcesCreated = 0;
            int layoutsCreated = 0;

            for (ResourceSeedData data : resourceSeedData()) {
                Optional<Room> roomOptional = roomRepository.findByCodeIgnoreCase(data.roomCode().trim());
                if (roomOptional.isEmpty()) {
                    log.warn("Skipping resource seed. Room not found for code={}", data.roomCode());
                    continue;
                }

                Room room = roomOptional.get();
                RoomResource resource = findRoomResourceByName(room.getId(), data.name())
                        .orElseGet(() -> {
                            RoomResource entity = RoomResource.builder()
                                    .name(data.name().trim())
                                    .type(data.type().trim())
                                    .quantity(data.quantity())
                                    .room(room)
                                    .build();
                            return roomResourceRepository.save(entity);
                        });

                if (resource.getId() != null && !resource.getType().equalsIgnoreCase(data.type().trim())) {
                    resource.setType(data.type().trim());
                }
                if (resource.getQuantity() == null || !resource.getQuantity().equals(data.quantity())) {
                    resource.setQuantity(data.quantity());
                }
                if (!resource.getRoom().getId().equals(room.getId())) {
                    resource.setRoom(room);
                }

                boolean isNewResource = resource.getCreatedAt() == null;
                resource = roomResourceRepository.save(resource);
                if (isNewResource) {
                    resourcesCreated++;
                }

                Optional<ResourceLayout> existingLayout = resourceLayoutRepository.findByResourceId(resource.getId());
                if (existingLayout.isPresent()) {
                    ResourceLayout layout = existingLayout.get();
                    layout.setRoom(room);
                    layout.setX(data.x());
                    layout.setY(data.y());
                    layout.setZ(data.z());
                    layout.setRotation(data.rotation());
                    layout.setScale(data.scale());
                    resourceLayoutRepository.save(layout);
                } else {
                    ResourceLayout layout = ResourceLayout.builder()
                            .resource(resource)
                            .room(room)
                            .x(data.x())
                            .y(data.y())
                            .z(data.z())
                            .rotation(data.rotation())
                            .scale(data.scale())
                            .build();
                    resourceLayoutRepository.save(layout);
                    layoutsCreated++;
                }
            }

            log.info("Resource sample-data: resources newly created={}, layouts newly created={}", resourcesCreated, layoutsCreated);
        };
    }

    private Optional<RoomResource> findRoomResourceByName(Long roomId, String name) {
        String normalized = name.trim().toLowerCase(Locale.ROOT);
        return roomResourceRepository.findByRoomIdOrderByNameAsc(roomId)
                .stream()
                .filter(resource -> resource.getName() != null
                        && resource.getName().trim().toLowerCase(Locale.ROOT).equals(normalized))
                .findFirst();
    }

    private List<ResourceSeedData> resourceSeedData() {
        return List.of(
                new ResourceSeedData("MAB-101", "Chair Set A", "chair", 60, 2.0, 0.0, 3.0, 0.0, 1.0),
                new ResourceSeedData("MAB-101", "Table Set A", "table", 20, 5.0, 0.0, 4.5, 0.0, 1.0),
                new ResourceSeedData("MAB-101", "Projector", "projector", 1, 10.5, 0.0, 1.2, 180.0, 1.0),
                new ResourceSeedData("MAB-101", "Whiteboard", "whiteboard", 2, 11.2, 0.0, 5.8, 90.0, 1.0),

                new ResourceSeedData("MAB-205", "Seminar Chairs", "chair", 30, 1.5, 0.0, 2.8, 0.0, 1.0),
                new ResourceSeedData("MAB-205", "Round Tables", "table", 8, 4.5, 0.0, 3.8, 15.0, 1.0),
                new ResourceSeedData("MAB-205", "Portable Projector", "projector", 1, 8.8, 0.0, 1.5, 180.0, 1.0),

                new ResourceSeedData("ENB-214", "Ergonomic Chairs", "chair", 28, 2.1, 0.0, 2.4, 0.0, 1.0),
                new ResourceSeedData("ENB-214", "Workstations", "desk", 14, 5.4, 0.0, 3.6, 0.0, 1.05),
                new ResourceSeedData("ENB-214", "Laser Projector", "projector", 1, 10.2, 0.0, 1.1, 180.0, 1.0),
                new ResourceSeedData("ENB-214", "Glass Board", "whiteboard", 1, 10.8, 0.0, 5.2, 90.0, 1.0),

                new ResourceSeedData("LIB-001", "Reading Chairs", "chair", 120, 2.3, 0.0, 2.7, 0.0, 1.0),
                new ResourceSeedData("LIB-001", "Reading Tables", "table", 40, 5.0, 0.0, 3.8, 0.0, 1.0),
                new ResourceSeedData("LIB-001", "Info Screen", "screen", 2, 9.6, 0.0, 1.6, 180.0, 1.0),
                new ResourceSeedData("LIB-001", "Notice Board", "whiteboard", 2, 10.2, 0.0, 5.0, 90.0, 1.0),

                new ResourceSeedData("ENB-010", "Lab Chair Set", "chair", 24, 1.8, 0.0, 2.6, 0.0, 1.0),
                new ResourceSeedData("ENB-010", "Lab Bench", "table", 12, 4.8, 0.0, 3.9, 0.0, 1.1),
                new ResourceSeedData("ENB-010", "Safety Whiteboard", "whiteboard", 1, 9.6, 0.0, 5.1, 90.0, 1.0),

                new ResourceSeedData("ENB-308", "Research Desk", "desk", 6, 2.0, 0.0, 2.2, 0.0, 1.0),
                new ResourceSeedData("ENB-308", "Discussion Chairs", "chair", 12, 4.2, 0.0, 3.0, 0.0, 1.0),
                new ResourceSeedData("ENB-308", "Data Wall Display", "screen", 1, 8.0, 0.0, 1.4, 180.0, 1.0)
        );
    }

    private record ResourceSeedData(
            String roomCode,
            String name,
            String type,
            Integer quantity,
            Double x,
            Double y,
            Double z,
            Double rotation,
            Double scale
    ) {
    }
}
