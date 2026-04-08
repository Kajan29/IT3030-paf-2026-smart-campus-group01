package com.zentaritas.dto.ticket;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssignmentRequest {

    @NotNull(message = "staffId is required")
    private Long staffId;
}
