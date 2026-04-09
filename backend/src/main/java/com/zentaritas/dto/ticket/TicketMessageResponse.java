package com.zentaritas.dto.ticket;

import com.zentaritas.model.auth.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketMessageResponse {
    private Long id;
    private Long ticketId;
    private Long senderUserId;
    private String senderName;
    private String senderEmail;
    private Role senderRole;
    private String message;
    private LocalDateTime editedAt;
    private LocalDateTime createdAt;
}
