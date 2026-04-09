package com.zentaritas.service.management;

import com.zentaritas.dto.management.facility.BuildingResponse;
import com.zentaritas.dto.management.facility.FloorResponse;
import com.zentaritas.dto.management.facility.RoomResponse;
import com.zentaritas.dto.management.facility.UserSummaryResponse;
import com.zentaritas.dto.management.resource.LayoutSaveRequest;
import com.zentaritas.dto.management.resource.ResourceLayoutResponse;
import com.zentaritas.dto.management.resource.ResourceLayoutRequest;
import com.zentaritas.dto.management.resource.ResourceRequest;
import com.zentaritas.dto.management.resource.ResourceResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.management.Building;
import com.zentaritas.model.management.Floor;
import com.zentaritas.model.management.ResourceLayout;
import com.zentaritas.model.management.Room;
import com.zentaritas.model.management.RoomResource;
import com.zentaritas.repository.management.BuildingRepository;
import com.zentaritas.repository.management.FloorRepository;
import com.zentaritas.repository.management.ResourceLayoutRepository;
import com.zentaritas.repository.management.RoomRepository;
import com.zentaritas.repository.management.RoomResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceManagementService {
    private static final int MAX_RESOURCE_TYPE_LENGTH = 100;

    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final RoomResourceRepository roomResourceRepository;
    private final ResourceLayoutRepository resourceLayoutRepository;

    public List<BuildingResponse> getBuildings() {
        return buildingRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(this::toBuildingResponse)
                .collect(Collectors.toList());
    }

    public List<FloorResponse> getFloors(Long buildingId) {
        List<Floor> floors = buildingId == null
                ? floorRepository.findAll(Sort.by(Sort.Direction.ASC, "building.id").and(Sort.by(Sort.Direction.ASC, "floorNumber")))
                : floorRepository.findByBuildingIdOrderByFloorNumberAsc(buildingId);

        return floors.stream().map(this::toFloorResponse).collect(Collectors.toList());
    }

    public List<RoomResponse> getRooms(Long floorId) {
        List<Room> rooms = floorId == null
                ? roomRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                : roomRepository.findByFloorIdOrderByNameAsc(floorId);

        return rooms.stream().map(this::toRoomResponse).collect(Collectors.toList());
    }

    public List<ResourceResponse> getResources(Long roomId) {
        return roomResourceRepository.findByRoomIdOrderByNameAsc(roomId)
                .stream()
                .map(this::toResourceResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResourceResponse createResource(ResourceRequest request) {
        Room room = getRoomEntity(request.getRoomId());
        String name = sanitizeName(request.getName());
        String type = normalizeAndValidateType(request.getType());

        List<RoomResource> existingByType = roomResourceRepository.findByRoomIdAndType(room.getId(), type);
        if (!existingByType.isEmpty()) {
            RoomResource primary = existingByType.get(0);
            int mergedQuantity = request.getQuantity();
            for (RoomResource entry : existingByType) {
                mergedQuantity += entry.getQuantity();
            }

            primary.setName(name);
            primary.setQuantity(mergedQuantity);
            RoomResource updated = roomResourceRepository.save(primary);

            if (existingByType.size() > 1) {
                for (int index = 1; index < existingByType.size(); index++) {
                    roomResourceRepository.delete(existingByType.get(index));
                }
            }

            return toResourceResponse(updated);
        }

        RoomResource resource = RoomResource.builder()
            .name(name)
            .type(type)
                .quantity(request.getQuantity())
                .room(room)
                .build();

        RoomResource saved = roomResourceRepository.save(resource);

        ResourceLayout defaultLayout = ResourceLayout.builder()
                .resource(saved)
                .room(room)
                .x(0.0)
                .y(0.0)
                .z(0.0)
                .rotation(0.0)
                .scale(1.0)
                .build();

        resourceLayoutRepository.save(defaultLayout);

        return toResourceResponse(saved);
    }

    @Transactional
    public ResourceResponse updateResource(Long id, ResourceRequest request) {
        RoomResource resource = getResourceEntity(id);
        Room room = getRoomEntity(request.getRoomId());
        String name = sanitizeName(request.getName());
        String type = normalizeAndValidateType(request.getType());

        if (roomResourceRepository.existsByRoomIdAndTypeAndIdNot(room.getId(), type, resource.getId())) {
            throw new IllegalArgumentException("This resource type already exists in the selected room. Please edit the existing one.");
        }

        resource.setName(name);
        resource.setType(type);
        resource.setQuantity(request.getQuantity());
        resource.setRoom(room);

        RoomResource saved = roomResourceRepository.save(resource);

        ResourceLayout layout = resourceLayoutRepository.findByResourceId(saved.getId())
                .orElseGet(() -> ResourceLayout.builder()
                        .resource(saved)
                        .room(room)
                        .x(0.0)
                        .y(0.0)
                        .z(0.0)
                        .rotation(0.0)
                        .scale(1.0)
                        .build());

        layout.setRoom(room);
        resourceLayoutRepository.save(layout);

        return toResourceResponse(saved);
    }

    @Transactional
    public void deleteResource(Long id) {
        RoomResource resource = getResourceEntity(id);
        roomResourceRepository.delete(resource);
    }

    public List<ResourceLayoutResponse> getLayout(Long roomId) {
        getRoomEntity(roomId);
        return resourceLayoutRepository.findByRoomIdOrderByIdAsc(roomId)
                .stream()
                .map(this::toLayoutResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ResourceLayoutResponse> saveLayout(LayoutSaveRequest request) {
        getRoomEntity(request.getRoomId());

        List<ResourceLayout> layouts = request.getLayouts().stream()
                .map(this::upsertLayout)
                .collect(Collectors.toList());

        return layouts.stream().map(this::toLayoutResponse).collect(Collectors.toList());
    }

    @Transactional
    public ResourceLayoutResponse updateLayout(ResourceLayoutRequest request) {
        return toLayoutResponse(upsertLayout(request));
    }

    private ResourceLayout upsertLayout(ResourceLayoutRequest request) {
        RoomResource resource = getResourceEntity(request.getResourceId());
        Room room = getRoomEntity(request.getRoomId());

        if (!resource.getRoom().getId().equals(room.getId())) {
            throw new IllegalArgumentException("Resource does not belong to the selected room");
        }

        ResourceLayout layout = resourceLayoutRepository.findByResourceId(resource.getId())
                .orElseGet(() -> ResourceLayout.builder()
                        .resource(resource)
                        .room(room)
                        .x(0.0)
                        .y(0.0)
                        .z(0.0)
                        .rotation(0.0)
                        .scale(1.0)
                        .build());

        layout.setRoom(room);
        layout.setX(request.getX());
        layout.setY(request.getY());
        layout.setZ(request.getZ());
        layout.setRotation(request.getRotation());
        layout.setScale(request.getScale());

        return resourceLayoutRepository.save(layout);
    }

    private Room getRoomEntity(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));
    }

    private RoomResource getResourceEntity(Long resourceId) {
        return roomResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));
    }

    private String sanitizeName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Resource name is required");
        }
        if (normalized.length() > 100) {
            throw new IllegalArgumentException("Resource name must not exceed 100 characters");
        }
        return normalized;
    }

    private String normalizeAndValidateType(String type) {
        String normalized = type == null
                ? ""
                : type.trim().toLowerCase(Locale.ROOT).replace(" ", "_");

        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Resource type is required");
        }

        if (normalized.length() > MAX_RESOURCE_TYPE_LENGTH) {
            throw new IllegalArgumentException("Resource type must not exceed 100 characters");
        }

        return normalized;
    }

    private BuildingResponse toBuildingResponse(Building building) {
        return BuildingResponse.builder()
                .id(building.getId())
                .name(building.getName())
                .code(building.getCode())
                .type(building.getType())
                .campus(building.getCampus())
                .location(building.getLocation())
                .totalFloors(building.getTotalFloors())
                .description(building.getDescription())
                .status(building.getStatus())
                .imageUrl(building.getImageUrl())
                .yearEstablished(building.getYearEstablished())
                .manager(building.getManager())
                .openingTime(building.getOpeningTime())
                .closingTime(building.getClosingTime())
                .closedOnWeekends(building.getClosedOnWeekends())
                .createdBy(UserSummaryResponse.from(building.getCreatedBy()))
                .createdAt(building.getCreatedAt())
                .updatedAt(building.getUpdatedAt())
                .build();
    }

    private FloorResponse toFloorResponse(Floor floor) {
        return FloorResponse.builder()
                .id(floor.getId())
                .buildingId(floor.getBuilding().getId())
                .floorNumber(floor.getFloorNumber())
                .floorName(floor.getFloorName())
                .description(floor.getDescription())
                .accessibility(floor.getAccessibility())
                .mapUrl(floor.getMapUrl())
                .createdBy(UserSummaryResponse.from(floor.getCreatedBy()))
                .createdAt(floor.getCreatedAt())
                .updatedAt(floor.getUpdatedAt())
                .build();
    }

    private RoomResponse toRoomResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .code(room.getCode())
                .buildingId(room.getBuilding().getId())
                .floorId(room.getFloor().getId())
                .type(room.getType())
                .lengthMeters(room.getLengthMeters())
                .widthMeters(room.getWidthMeters())
                .areaSqMeters(room.getAreaSqMeters())
                .areaSqFeet(room.getAreaSqFeet())
                .seatingCapacity(room.getSeatingCapacity())
                .maxOccupancy(room.getMaxOccupancy())
                .facilities(room.getFacilities())
                .status(room.getStatus())
                .description(room.getDescription())
                .condition(room.getCondition())
                .climateControl(room.getClimateControl())
                .smartClassroomEnabled(room.getSmartClassroomEnabled())
                .projectorAvailable(room.getProjectorAvailable())
                .boardType(room.getBoardType())
                .internetAvailable(room.getInternetAvailable())
                .chairs(room.getChairs())
                .tables(room.getTables())
                .labEquipmentAvailable(room.getLabEquipmentAvailable())
                .powerBackupAvailable(room.getPowerBackupAvailable())
                .accessibilitySupport(room.getAccessibilitySupport())
                .maintenanceStatus(room.getMaintenanceStatus())
                .bookingAvailable(room.getBookingAvailable())
                .closedOnWeekends(room.getClosedOnWeekends())
                .openingTime(room.getOpeningTime())
                .closingTime(room.getClosingTime())
                .maintenanceHistory(room.getMaintenanceHistory())
                .imageUrl(room.getImageUrl())
                .createdBy(UserSummaryResponse.from(room.getCreatedBy()))
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    private ResourceResponse toResourceResponse(RoomResource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .quantity(resource.getQuantity())
                .roomId(resource.getRoom().getId())
                .build();
    }

    private ResourceLayoutResponse toLayoutResponse(ResourceLayout layout) {
        return ResourceLayoutResponse.builder()
                .id(layout.getId())
                .resourceId(layout.getResource().getId())
                .roomId(layout.getRoom().getId())
                .x(layout.getX())
                .y(layout.getY())
                .z(layout.getZ())
                .rotation(layout.getRotation())
                .scale(layout.getScale())
                .build();
    }
}
