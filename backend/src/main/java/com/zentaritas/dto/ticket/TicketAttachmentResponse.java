package com.zentaritas.dto.ticket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAttachmentResponse {
    private Long id;
    private String imageUrl;
    private String originalFileName;
    private LocalDateTime createdAt;
}
