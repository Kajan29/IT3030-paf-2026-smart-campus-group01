package com.zentaritas.controller.ticket;

import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.dto.ticket.CreateTicketRequest;
import com.zentaritas.dto.ticket.TicketResponse;
import com.zentaritas.service.ticket.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/public/tickets")
@RequiredArgsConstructor
public class PublicTicketController {

    private final TicketService ticketService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        TicketResponse created = ticketService.createTicket(request, email);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Ticket submitted successfully"));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TicketResponse>> createTicketWithAttachments(
            @Valid @RequestPart("data") CreateTicketRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        TicketResponse created = ticketService.createTicket(request, email, attachments);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Ticket submitted successfully"));
    }
}
