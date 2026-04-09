package com.zentaritas.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketMessageUpdateRequest {

    @NotBlank(message = "Ticket reply is required")
    @Size(max = 5000, message = "Ticket reply is too long")
    private String message;
}
