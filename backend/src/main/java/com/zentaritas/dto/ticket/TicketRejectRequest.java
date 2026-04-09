package com.zentaritas.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketRejectRequest {

    @NotBlank(message = "reason is required")
    @Size(max = 5000, message = "reason is too long")
    private String reason;
}
