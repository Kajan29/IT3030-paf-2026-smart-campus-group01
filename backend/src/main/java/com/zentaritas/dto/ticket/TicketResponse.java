package com.zentaritas.dto.ticket;

import com.zentaritas.model.auth.Role;
import com.zentaritas.model.ticket.TicketAudience;
import com.zentaritas.model.ticket.TicketCategory;
import com.zentaritas.model.ticket.TicketPriority;
import com.zentaritas.model.ticket.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private String subject;
    private String description;
    private TicketCategory category;
    private TicketAudience audience;
    private TicketPriority priority;
    private TicketStatus status;
    private String requesterName;
    private String requesterEmail;
    private Role requesterRole;
    private Long assignedStaffId;
    private String assignedStaffName;
    private String assignedStaffEmail;
    private String resolutionNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
