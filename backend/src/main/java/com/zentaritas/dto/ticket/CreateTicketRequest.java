package com.zentaritas.dto.ticket;

import com.zentaritas.model.ticket.TicketAudience;
import com.zentaritas.model.ticket.TicketCategory;
import com.zentaritas.model.ticket.TicketPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    @NotNull(message = "category is required")
    private TicketCategory category;

    @NotNull(message = "audience is required")
    private TicketAudience audience;

    private TicketPriority priority;

    @NotBlank(message = "subject is required")
    private String subject;

    @NotBlank(message = "description is required")
    private String description;

    private String resourceLocation;

    @NotBlank(message = "preferredContactDetails is required")
    private String preferredContactDetails;

    private String name;

    @Email(message = "Invalid email address")
    private String email;
}
