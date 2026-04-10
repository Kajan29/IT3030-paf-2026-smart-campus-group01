package com.zentaritas.service.management;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.zentaritas.dto.management.facility.*;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.management.Building;
import com.zentaritas.model.management.Floor;
import com.zentaritas.model.management.Room;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.management.BuildingRepository;
import com.zentaritas.repository.management.FloorRepository;
import com.zentaritas.repository.management.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacilityManagementService {

    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    public List<BuildingResponse> getAllBuildings() {
        return buildingRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(this::toBuildingResponse)
                .collect(Collectors.toList());
    }

    public BuildingResponse getBuildingById(Long id) {
        Building building = getBuildingEntity(id);
        return toBuildingResponse(building);
    }

    @Transactional
    public BuildingResponse createBuilding(BuildingRequest request, MultipartFile image, Authentication authentication) {
        if (buildingRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new IllegalArgumentException("Building code already exists");
        }

        User currentUser = getCurrentUser(authentication);
        Building building = Building.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase(Locale.ROOT))
                .type(request.getType().trim())
                .campus(request.getCampus().trim())
                .location(request.getLocation().trim())
                .totalFloors(request.getTotalFloors())
                .description(request.getDescription().trim())
                .status(request.getStatus().trim())
                .yearEstablished(request.getYearEstablished())
                .manager(request.getManager().trim())
                .openingTime(request.getOpeningTime())
                .closingTime(request.getClosingTime())
                .closedOnWeekends(Boolean.TRUE.equals(request.getClosedOnWeekends()))
                .createdBy(currentUser)
                .build();

        if (image != null && !image.isEmpty()) {
            ImageUploadResult uploadResult = uploadImage(image, "zentaritas/facilities/buildings", "building");
            building.setImageUrl(uploadResult.url());
            building.setImagePublicId(uploadResult.publicId());
        }

        Building saved = buildingRepository.save(building);
        return toBuildingResponse(saved);
    }

    @Transactional
    public BuildingResponse updateBuilding(Long id, BuildingRequest request, MultipartFile image) {
        Building building = getBuildingEntity(id);

        String nextCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (!building.getCode().equalsIgnoreCase(nextCode) && buildingRepository.existsByCodeIgnoreCase(nextCode)) {
            throw new IllegalArgumentException("Building code already exists");
        }

        building.setName(request.getName().trim());
        building.setCode(nextCode);
        building.setType(request.getType().trim());
        building.setCampus(request.getCampus().trim());
        building.setLocation(request.getLocation().trim());
        building.setTotalFloors(request.getTotalFloors());
        building.setDescription(request.getDescription().trim());
        building.setStatus(request.getStatus().trim());
        building.setYearEstablished(request.getYearEstablished());
        building.setManager(request.getManager().trim());
        building.setOpeningTime(request.getOpeningTime());
        building.setClosingTime(request.getClosingTime());
        building.setClosedOnWeekends(Boolean.TRUE.equals(request.getClosedOnWeekends()));

        if (image != null && !image.isEmpty()) {
            deleteCloudinaryAssetQuietly(building.getImagePublicId());
            ImageUploadResult uploadResult = uploadImage(image, "zentaritas/facilities/buildings", "building");
            building.setImageUrl(uploadResult.url());
            building.setImagePublicId(uploadResult.publicId());
        }

        Building saved = buildingRepository.save(building);
        return toBuildingResponse(saved);
    }

    @Transactional
    public void deleteBuilding(Long id) {
        Building building = getBuildingEntity(id);
        if (floorRepository.existsByBuildingId(id) || roomRepository.existsByBuildingId(id)) {
            throw new IllegalArgumentException("Cannot delete building with existing floors or rooms");
        }
        deleteCloudinaryAssetQuietly(building.getImagePublicId());
        buildingRepository.delete(building);
    }

    public List<FloorResponse> getFloors(Long buildingId) {
        List<Floor> floors;
        if (buildingId != null) {
            floors = floorRepository.findByBuildingIdOrderByFloorNumberAsc(buildingId);
        } else {
            floors = floorRepository.findAll(Sort.by(Sort.Direction.ASC, "building.id").and(Sort.by(Sort.Direction.ASC, "floorNumber")));
        }

        return floors.stream()
                .map(this::toFloorResponse)
                .collect(Collectors.toList());
    }

    public FloorResponse getFloorById(Long id) {
        Floor floor = getFloorEntity(id);
        return toFloorResponse(floor);
    }

    @Transactional
    public FloorResponse createFloor(FloorRequest request, Authentication authentication) {
        Building building = getBuildingEntity(request.getBuildingId());
        if (floorRepository.existsByBuildingIdAndFloorNumber(building.getId(), request.getFloorNumber())) {
            throw new IllegalArgumentException("Floor number already exists in selected building");
        }

        User currentUser = getCurrentUser(authentication);
        Floor floor = Floor.builder()
                .building(building)
                .floorNumber(request.getFloorNumber())
                .floorName(request.getFloorName().trim())
                .description(request.getDescription().trim())
                .accessibility(request.getAccessibility().trim())
                .mapUrl(normalizeOptionalText(request.getMapUrl()))
                .createdBy(currentUser)
                .build();

        Floor saved = floorRepository.save(floor);
        return toFloorResponse(saved);
    }

    @Transactional
    public FloorResponse updateFloor(Long id, FloorRequest request) {
        Floor floor = getFloorEntity(id);
        Building building = getBuildingEntity(request.getBuildingId());

        boolean isSameSlot = floor.getBuilding().getId().equals(building.getId())
                && floor.getFloorNumber().equals(request.getFloorNumber());
        if (!isSameSlot && floorRepository.existsByBuildingIdAndFloorNumber(building.getId(), request.getFloorNumber())) {
            throw new IllegalArgumentException("Floor number already exists in selected building");
        }

        floor.setBuilding(building);
        floor.setFloorNumber(request.getFloorNumber());
        floor.setFloorName(request.getFloorName().trim());
        floor.setDescription(request.getDescription().trim());
        floor.setAccessibility(request.getAccessibility().trim());
        floor.setMapUrl(normalizeOptionalText(request.getMapUrl()));

        Floor saved = floorRepository.save(floor);
        return toFloorResponse(saved);
    }

    @Transactional
    public void deleteFloor(Long id) {
        Floor floor = getFloorEntity(id);
        if (roomRepository.existsByFloorId(id)) {
            throw new IllegalArgumentException("Cannot delete floor with existing rooms");
        }
        floorRepository.delete(floor);
    }

    public List<RoomResponse> getRooms(Long buildingId, Long floorId) {
        List<Room> rooms;
        if (buildingId != null && floorId != null) {
            rooms = roomRepository.findByBuildingIdAndFloorIdOrderByNameAsc(buildingId, floorId);
        } else if (buildingId != null) {
            rooms = roomRepository.findByBuildingIdOrderByNameAsc(buildingId);
        } else if (floorId != null) {
            rooms = roomRepository.findByFloorIdOrderByNameAsc(floorId);
        } else {
            rooms = roomRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
        }

        return rooms.stream()
                .map(this::toRoomResponse)
                .collect(Collectors.toList());
    }

    public RoomResponse getRoomById(Long id) {
        Room room = getRoomEntity(id);
        return toRoomResponse(room);
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request, MultipartFile image, Authentication authentication) {
        if (roomRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new IllegalArgumentException("Room code already exists");
        }

        Building building = getBuildingEntity(request.getBuildingId());
        Floor floor = getFloorEntity(request.getFloorId());
        validateFloorBelongsToBuilding(floor, building);

        User currentUser = getCurrentUser(authentication);
        Room room = Room.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase(Locale.ROOT))
                .building(building)
                .floor(floor)
                .type(request.getType().trim())
                .lengthMeters(request.getLengthMeters())
                .widthMeters(request.getWidthMeters())
                .areaSqMeters(roundToTwoDecimals(request.getLengthMeters() * request.getWidthMeters()))
                .areaSqFeet(roundToTwoDecimals(request.getLengthMeters() * request.getWidthMeters() * 10.7639))
                .seatingCapacity(request.getSeatingCapacity())
                .facilities(normalizeStringList(request.getFacilities()))
                .status(request.getStatus().trim())
                .description(request.getDescription().trim())
                .condition(request.getCondition().trim())
                .climateControl(request.getClimateControl().trim())
                .smartClassroomEnabled(Boolean.TRUE.equals(request.getSmartClassroomEnabled()))
                .projectorAvailable(Boolean.TRUE.equals(request.getProjectorAvailable()))
                .boardType(request.getBoardType().trim())
                .internetAvailable(Boolean.TRUE.equals(request.getInternetAvailable()))
                .labEquipmentAvailable(Boolean.TRUE.equals(request.getLabEquipmentAvailable()))
                .powerBackupAvailable(Boolean.TRUE.equals(request.getPowerBackupAvailable()))
                .accessibilitySupport(Boolean.TRUE.equals(request.getAccessibilitySupport()))
                .maintenanceStatus(request.getMaintenanceStatus().trim())
                .bookingAvailable(Boolean.TRUE.equals(request.getBookingAvailable()))
                .closedOnWeekends(Boolean.TRUE.equals(building.getClosedOnWeekends()))
                .openingTime(request.getOpeningTime())
                .closingTime(request.getClosingTime())
                .maintenanceHistory(normalizeStringList(request.getMaintenanceHistory()))
                .createdBy(currentUser)
                .build();

        if (room.getMaintenanceHistory().isEmpty()) {
            room.setMaintenanceHistory(new ArrayList<>(List.of("Initial setup")));
        }

        if (image != null && !image.isEmpty()) {
            ImageUploadResult uploadResult = uploadImage(image, "zentaritas/facilities/rooms", "room");
            room.setImageUrl(uploadResult.url());
            room.setImagePublicId(uploadResult.publicId());
        }

        Room saved = roomRepository.save(room);
        return toRoomResponse(saved);
    }

    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request, MultipartFile image) {
        Room room = getRoomEntity(id);

        String nextCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (!room.getCode().equalsIgnoreCase(nextCode) && roomRepository.existsByCodeIgnoreCase(nextCode)) {
            throw new IllegalArgumentException("Room code already exists");
        }

        Building building = getBuildingEntity(request.getBuildingId());
        Floor floor = getFloorEntity(request.getFloorId());
        validateFloorBelongsToBuilding(floor, building);

        room.setName(request.getName().trim());
        room.setCode(nextCode);
        room.setBuilding(building);
        room.setFloor(floor);
        room.setType(request.getType().trim());
        room.setLengthMeters(request.getLengthMeters());
        room.setWidthMeters(request.getWidthMeters());
        room.setAreaSqMeters(roundToTwoDecimals(request.getLengthMeters() * request.getWidthMeters()));
        room.setAreaSqFeet(roundToTwoDecimals(request.getLengthMeters() * request.getWidthMeters() * 10.7639));
        room.setSeatingCapacity(request.getSeatingCapacity());
        room.setFacilities(normalizeStringList(request.getFacilities()));
        room.setStatus(request.getStatus().trim());
        room.setDescription(request.getDescription().trim());
        room.setCondition(request.getCondition().trim());
        room.setClimateControl(request.getClimateControl().trim());
        room.setSmartClassroomEnabled(Boolean.TRUE.equals(request.getSmartClassroomEnabled()));
        room.setProjectorAvailable(Boolean.TRUE.equals(request.getProjectorAvailable()));
        room.setBoardType(request.getBoardType().trim());
        room.setInternetAvailable(Boolean.TRUE.equals(request.getInternetAvailable()));
        room.setLabEquipmentAvailable(Boolean.TRUE.equals(request.getLabEquipmentAvailable()));
        room.setPowerBackupAvailable(Boolean.TRUE.equals(request.getPowerBackupAvailable()));
        room.setAccessibilitySupport(Boolean.TRUE.equals(request.getAccessibilitySupport()));
        room.setMaintenanceStatus(request.getMaintenanceStatus().trim());
        room.setBookingAvailable(Boolean.TRUE.equals(request.getBookingAvailable()));
        room.setClosedOnWeekends(Boolean.TRUE.equals(building.getClosedOnWeekends()));
        room.setOpeningTime(request.getOpeningTime());
        room.setClosingTime(request.getClosingTime());

        List<String> history = normalizeStringList(request.getMaintenanceHistory());
        room.setMaintenanceHistory(history.isEmpty() ? new ArrayList<>(List.of("Initial setup")) : history);

        if (image != null && !image.isEmpty()) {
            deleteCloudinaryAssetQuietly(room.getImagePublicId());
            ImageUploadResult uploadResult = uploadImage(image, "zentaritas/facilities/rooms", "room");
            room.setImageUrl(uploadResult.url());
            room.setImagePublicId(uploadResult.publicId());
        }

        Room saved = roomRepository.save(room);
        return toRoomResponse(saved);
    }

    @Transactional
    public void deleteRoom(Long id) {
        Room room = getRoomEntity(id);
        deleteCloudinaryAssetQuietly(room.getImagePublicId());
        roomRepository.delete(room);
    }

    /**
     * Permanently assign a non-academic staff member to a room.
     * That staff will automatically manage all bookings for this room.
     */
    @Transactional
    public RoomResponse assignStaffToRoom(Long roomId, Long staffId) {
        Room room = getRoomEntity(roomId);

        if (staffId == null) {
            // Unassign
            room.setAssignedStaff(null);
        } else {
            User staff = userRepository.findById(staffId)
                    .orElseThrow(() -> new IllegalArgumentException("Staff member not found"));
            room.setAssignedStaff(staff);
        }

        Room saved = roomRepository.save(room);
        log.info("Staff {} {} assigned to room {}", staffId, staffId != null ? "" : "(unassigned)", roomId);
        return toRoomResponse(saved);
    }

    private Building getBuildingEntity(Long id) {
        return buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + id));
    }

    private Floor getFloorEntity(Long id) {
        return floorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + id));
    }

    private Room getRoomEntity(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Authenticated user is required");
        }

        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
    }

    private void validateFloorBelongsToBuilding(Floor floor, Building building) {
        if (!Objects.equals(floor.getBuilding().getId(), building.getId())) {
            throw new IllegalArgumentException("Selected floor does not belong to the selected building");
        }
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
                .facilities(new ArrayList<>(Optional.ofNullable(room.getFacilities()).orElseGet(ArrayList::new)))
                .status(room.getStatus())
                .description(room.getDescription())
                .condition(room.getCondition())
                .climateControl(room.getClimateControl())
                .smartClassroomEnabled(room.getSmartClassroomEnabled())
                .projectorAvailable(room.getProjectorAvailable())
                .boardType(room.getBoardType())
                .internetAvailable(room.getInternetAvailable())
                .labEquipmentAvailable(room.getLabEquipmentAvailable())
                .powerBackupAvailable(room.getPowerBackupAvailable())
                .accessibilitySupport(room.getAccessibilitySupport())
                .maintenanceStatus(room.getMaintenanceStatus())
                .bookingAvailable(room.getBookingAvailable())
                .closedOnWeekends(room.getClosedOnWeekends())
                .openingTime(room.getOpeningTime())
                .closingTime(room.getClosingTime())
                .maintenanceHistory(new ArrayList<>(Optional.ofNullable(room.getMaintenanceHistory()).orElseGet(ArrayList::new)))
                .imageUrl(room.getImageUrl())
                .assignedStaffId(room.getAssignedStaff() != null ? room.getAssignedStaff().getId() : null)
                .assignedStaffName(room.getAssignedStaff() != null ? room.getAssignedStaff().getFirstName() + " " + room.getAssignedStaff().getLastName() : null)
                .assignedStaffEmail(room.getAssignedStaff() != null ? room.getAssignedStaff().getEmail() : null)
                .createdBy(UserSummaryResponse.from(room.getCreatedBy()))
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    private ImageUploadResult uploadImage(MultipartFile image, String folder, String publicIdPrefix) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(image.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "public_id", publicIdPrefix + "-" + UUID.randomUUID()
            ));
            String secureUrl = Objects.toString(uploadResult.get("secure_url"), null);
            String publicId = Objects.toString(uploadResult.get("public_id"), null);
            if (secureUrl == null || publicId == null) {
                throw new IllegalArgumentException("Cloudinary did not return a valid image response");
            }
            return new ImageUploadResult(secureUrl, publicId);
        } catch (IOException ex) {
            log.error("Failed to upload image to Cloudinary", ex);
            throw new IllegalArgumentException("Failed to upload image");
        }
    }

    private void deleteCloudinaryAssetQuietly(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException ex) {
            log.warn("Failed to delete Cloudinary asset: {}", publicId, ex);
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> normalizeStringList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }

        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record ImageUploadResult(String url, String publicId) {
    }
}
