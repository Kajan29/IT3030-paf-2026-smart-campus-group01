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
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private String subject;
    private String description;
    private String resourceLocation;
    private String preferredContactDetails;
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
    private LocalDateTime assignedAt;
    private String resolutionNote;
    private String rejectionReason;
    private String resolvedByName;
    private String closedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private List<TicketAttachmentResponse> attachments;
}
