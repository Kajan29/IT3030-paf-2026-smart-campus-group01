package com.zentaritas.dto.management;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {
    @NotNull(message = "isActive is required")
    private Boolean isActive;

    private String reason;
}
