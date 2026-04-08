package com.zentaritas.controller.ticket;

import com.zentaritas.dto.management.facility.UserSummaryResponse;
import com.zentaritas.dto.response.ApiResponse;
import com.zentaritas.dto.ticket.TicketAssignmentRequest;
import com.zentaritas.dto.ticket.TicketRejectRequest;
import com.zentaritas.dto.ticket.TicketResolveRequest;
import com.zentaritas.dto.ticket.TicketResponse;
import com.zentaritas.model.ticket.TicketStatus;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tickets")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminTicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAllTickets(
            @RequestParam(required = false) TicketStatus status) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getAllTickets(status)));
    }

    @GetMapping("/assignable-staff")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getAssignableStaff() {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getAssignableNonAcademicStaff()));
    }

    @PatchMapping("/{ticketId}/assign")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketAssignmentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.assignTicket(ticketId, request.getStaffId(), authentication.getName()),
                "Ticket assigned successfully"
        ));
    }

    @PatchMapping("/{ticketId}/resolve")
    public ResponseEntity<ApiResponse<TicketResponse>> resolveTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketResolveRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.resolveTicketByAdmin(ticketId, request.getResolutionNote(), authentication.getName()),
            "Ticket resolved successfully"
        ));
    }

    @PatchMapping("/{ticketId}/reject")
    public ResponseEntity<ApiResponse<TicketResponse>> rejectTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketRejectRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.rejectTicketByAdmin(ticketId, request.getReason(), authentication.getName()),
                "Ticket rejected successfully"
        ));
    }

    @PatchMapping("/{ticketId}/close")
    public ResponseEntity<ApiResponse<TicketResponse>> closeTicket(
            @PathVariable Long ticketId,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.closeTicket(ticketId, authentication.getName()),
                "Ticket closed successfully"
        ));
    }
}
