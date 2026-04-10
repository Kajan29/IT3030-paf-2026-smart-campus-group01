package com.zentaritas.dto.management.facility;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
public class RoomRequest {

    @NotBlank(message = "Room name is required")
    private String name;

    @NotBlank(message = "Room code is required")
    @Pattern(regexp = "^[A-Z0-9-]{2,16}$", message = "Room code must contain 2-16 uppercase letters, numbers, or hyphen")
    private String code;

    @NotNull(message = "Building is required")
    private Long buildingId;

    @NotNull(message = "Floor is required")
    private Long floorId;

    @NotBlank(message = "Room type is required")
    private String type;

    @NotNull(message = "Length is required")
    @DecimalMin(value = "1.0", message = "Length must be at least 1")
    @DecimalMax(value = "200.0", message = "Length must be at most 200")
    private Double lengthMeters;

    @NotNull(message = "Width is required")
    @DecimalMin(value = "1.0", message = "Width must be at least 1")
    @DecimalMax(value = "200.0", message = "Width must be at most 200")
    private Double widthMeters;

    @NotNull(message = "Seating capacity is required")
    @Min(value = 1, message = "Seating capacity must be at least 1")
    @Max(value = 1000, message = "Seating capacity must be at most 1000")
    private Integer seatingCapacity;

    @NotNull(message = "Facilities are required")
    @Size(min = 1, message = "At least one facility is required")
    private List<String> facilities;

    @NotBlank(message = "Status is required")
    private String status;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Condition is required")
    private String condition;

    @NotBlank(message = "Climate control is required")
    private String climateControl;

    @NotNull(message = "Smart classroom flag is required")
    private Boolean smartClassroomEnabled;

    @NotNull(message = "Projector flag is required")
    private Boolean projectorAvailable;

    @NotBlank(message = "Board type is required")
    private String boardType;

    @NotNull(message = "Internet flag is required")
    private Boolean internetAvailable;

    @NotNull(message = "Lab equipment flag is required")
    private Boolean labEquipmentAvailable;

    @NotNull(message = "Power backup flag is required")
    private Boolean powerBackupAvailable;

    @NotNull(message = "Accessibility support flag is required")
    private Boolean accessibilitySupport;

    @NotBlank(message = "Maintenance status is required")
    private String maintenanceStatus;

    @NotNull(message = "Booking availability flag is required")
    private Boolean bookingAvailable;

    private LocalTime openingTime;

    private LocalTime closingTime;

    private List<String> maintenanceHistory;
}
