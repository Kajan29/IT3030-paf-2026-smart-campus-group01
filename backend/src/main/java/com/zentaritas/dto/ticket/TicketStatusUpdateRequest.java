package com.zentaritas.dto.ticket;

import com.zentaritas.model.ticket.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatusUpdateRequest {

    @NotNull(message = "status is required")
    private TicketStatus status;

    private String note;
}
