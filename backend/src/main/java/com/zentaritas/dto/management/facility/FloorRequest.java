package com.zentaritas.dto.management.facility;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FloorRequest {

    @NotNull(message = "Building is required")
    private Long buildingId;

    @NotNull(message = "Floor number is required")
    @Min(value = 0, message = "Floor number must be at least 0")
    @Max(value = 100, message = "Floor number must be at most 100")
    private Integer floorNumber;

    @NotBlank(message = "Floor name is required")
    private String floorName;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Accessibility is required")
    private String accessibility;

    private String mapUrl;
}
