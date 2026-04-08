package com.zentaritas.controller.ticket;

import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.dto.ticket.TicketResolveRequest;
import com.zentaritas.dto.ticket.TicketResponse;
import com.zentaritas.service.ticket.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getMyTickets(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getMyTickets(authentication.getName())));
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAssignedTickets(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getAssignedTickets(authentication.getName())));
    }

    @PatchMapping("/{ticketId}/resolve")
    @PreAuthorize("hasRole('NON_ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<TicketResponse>> resolveAssignedTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketResolveRequest request,
            Authentication authentication) {
        TicketResponse ticket = ticketService.resolveAssignedTicket(ticketId, authentication.getName(), request.getResolutionNote());
        return ResponseEntity.ok(ApiResponse.success(ticket, "Ticket resolved successfully"));
    }
}
