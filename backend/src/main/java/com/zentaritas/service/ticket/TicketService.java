package com.zentaritas.service.ticket;

import com.zentaritas.dto.management.facility.UserSummaryResponse;
import com.zentaritas.dto.ticket.CreateTicketRequest;
import com.zentaritas.dto.ticket.TicketResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.ticket.Ticket;
import com.zentaritas.model.ticket.TicketPriority;
import com.zentaritas.model.ticket.TicketStatus;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.ticket.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String authenticatedEmail) {
        User requesterUser = null;
        String requesterName;
        String requesterEmail;
        Role requesterRole = null;

        if (StringUtils.hasText(authenticatedEmail)) {
            requesterUser = userRepository.findByEmailIgnoreCase(authenticatedEmail).orElse(null);

            if (requesterUser != null) {
                requesterName = (requesterUser.getFirstName() + " " + requesterUser.getLastName()).trim();
                if (!StringUtils.hasText(requesterName)) {
                    requesterName = requesterUser.getUsername();
                }
                requesterEmail = requesterUser.getEmail();
                requesterRole = requesterUser.getRole();
            } else {
                if (!StringUtils.hasText(request.getName()) || !StringUtils.hasText(request.getEmail())) {
                    throw new ResourceNotFoundException("Authenticated user not found. Please sign in again.");
                }
                requesterName = request.getName().trim();
                requesterEmail = request.getEmail().trim();
            }
        } else {
            if (!StringUtils.hasText(request.getName()) || !StringUtils.hasText(request.getEmail())) {
                throw new IllegalArgumentException("Name and email are required for guest ticket submissions");
            }
            requesterName = request.getName().trim();
            requesterEmail = request.getEmail().trim();
        }

        Ticket ticket = Ticket.builder()
                .ticketNumber(generateTicketNumber())
                .subject(request.getSubject().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory())
                .audience(request.getAudience())
                .priority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .requesterName(requesterName)
                .requesterEmail(requesterEmail)
                .requesterRole(requesterRole)
                .requesterUser(requesterUser)
                .build();

        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(String authenticatedEmail) {
        User user = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Ticket> byUser = ticketRepository.findByRequesterUserOrderByCreatedAtDesc(user);
        List<Ticket> byEmail = ticketRepository.findByRequesterEmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail());

        Map<Long, Ticket> uniqueTickets = new LinkedHashMap<>();
        byUser.forEach(ticket -> uniqueTickets.put(ticket.getId(), ticket));
        byEmail.forEach(ticket -> uniqueTickets.putIfAbsent(ticket.getId(), ticket));

        return uniqueTickets.values().stream()
                .sorted(Comparator.comparing(Ticket::getCreatedAt).reversed())
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAssignedTickets(String authenticatedEmail) {
        User user = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.NON_ACADEMIC_STAFF) {
            throw new IllegalArgumentException("Only non-academic staff can access assigned tickets");
        }

        return ticketRepository.findByAssignedToOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets(TicketStatus status) {
        List<Ticket> tickets;
        if (status == null) {
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        } else {
            tickets = ticketRepository.findByStatusOrderByCreatedAtDesc(status);
        }

        return tickets.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getAssignableNonAcademicStaff() {
        return userRepository.findByRoleAndIsActive(Role.NON_ACADEMIC_STAFF, true)
                .stream()
                .map(UserSummaryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketResponse assignTicket(Long ticketId, Long staffId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found"));

        if (staff.getRole() != Role.NON_ACADEMIC_STAFF) {
            throw new IllegalArgumentException("Tickets can only be assigned to non-academic staff");
        }
        if (!Boolean.TRUE.equals(staff.getIsActive())) {
            throw new IllegalArgumentException("Cannot assign ticket to an inactive staff member");
        }

        ticket.setAssignedTo(staff);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        ticket.setResolvedAt(null);

        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse resolveTicketByAdmin(Long ticketId, String resolutionNote) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNote(resolutionNote);
        ticket.setResolvedAt(LocalDateTime.now());

        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse resolveAssignedTicket(Long ticketId, String authenticatedEmail, String resolutionNote) {
        User staff = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (staff.getRole() != Role.NON_ACADEMIC_STAFF) {
            throw new IllegalArgumentException("Only non-academic staff can resolve assigned tickets");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(staff.getId())) {
            throw new IllegalArgumentException("You can only resolve tickets assigned to you");
        }

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNote(resolutionNote);
        ticket.setResolvedAt(LocalDateTime.now());

        return toResponse(ticketRepository.save(ticket));
    }

    private String generateTicketNumber() {
        int currentYear = Year.now().getValue();
        Random random = new Random();

        for (int attempt = 0; attempt < 10; attempt++) {
            String candidate = "ZT-" + currentYear + "-" + (10000 + random.nextInt(90000));
            if (!ticketRepository.existsByTicketNumber(candidate)) {
                return candidate;
            }
        }

        // Very unlikely fallback to avoid collisions under heavy load.
        return "ZT-" + currentYear + "-" + System.currentTimeMillis();
    }

    private TicketResponse toResponse(Ticket ticket) {
        String assignedName = null;
        String assignedEmail = null;
        Long assignedId = null;

        if (ticket.getAssignedTo() != null) {
            assignedId = ticket.getAssignedTo().getId();
            assignedEmail = ticket.getAssignedTo().getEmail();
            assignedName = (ticket.getAssignedTo().getFirstName() + " " + ticket.getAssignedTo().getLastName()).trim();
            if (!StringUtils.hasText(assignedName)) {
                assignedName = ticket.getAssignedTo().getUsername();
            }
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .category(ticket.getCategory())
                .audience(ticket.getAudience())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .requesterName(ticket.getRequesterName())
                .requesterEmail(ticket.getRequesterEmail())
                .requesterRole(ticket.getRequesterRole())
                .assignedStaffId(assignedId)
                .assignedStaffName(assignedName)
                .assignedStaffEmail(assignedEmail)
                .resolutionNote(ticket.getResolutionNote())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .build();
    }
}
