package com.zentaritas.dto.management.resource;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class LayoutSaveRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @Valid
    @NotEmpty(message = "Layout items cannot be empty")
    private List<ResourceLayoutRequest> layouts;
}
