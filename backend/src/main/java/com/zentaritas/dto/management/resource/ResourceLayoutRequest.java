package com.zentaritas.dto.management.resource;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResourceLayoutRequest {

    @NotNull(message = "Resource ID is required")
    private Long resourceId;

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "X position is required")
    private Double x;

    @NotNull(message = "Y position is required")
    private Double y;

    @NotNull(message = "Z position is required")
    private Double z;

    @NotNull(message = "Rotation is required")
    private Double rotation;

    @NotNull(message = "Scale is required")
    @DecimalMin(value = "0.1", message = "Scale must be at least 0.1")
    private Double scale;
}
