package com.zentaritas.dto.management.facility;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalTime;

@Data
public class BuildingRequest {

    @NotBlank(message = "Building name is required")
    private String name;

    @NotBlank(message = "Building code is required")
    @Pattern(regexp = "^[A-Z0-9-]{2,12}$", message = "Building code must contain 2-12 uppercase letters, numbers, or hyphen")
    private String code;

    @NotBlank(message = "Building type is required")
    private String type;

    @NotBlank(message = "Campus is required")
    private String campus;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Total floors is required")
    @Min(value = 1, message = "Total floors must be at least 1")
    @Max(value = 60, message = "Total floors must be at most 60")
    private Integer totalFloors;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Status is required")
    private String status;

    @NotNull(message = "Year established is required")
    @Min(value = 1800, message = "Year established must be at least 1800")
    @Max(value = 2500, message = "Year established is invalid")
    private Integer yearEstablished;

    @NotBlank(message = "Manager is required")
    private String manager;

    private LocalTime openingTime;

    private LocalTime closingTime;

    private Boolean closedOnWeekends = false;
}
