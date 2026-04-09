package com.zentaritas.service.ticket;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.zentaritas.dto.management.facility.UserSummaryResponse;
import com.zentaritas.dto.ticket.CreateTicketRequest;
import com.zentaritas.dto.ticket.TicketAttachmentResponse;
import com.zentaritas.dto.ticket.TicketMessageResponse;
import com.zentaritas.dto.ticket.TicketResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.BookingNotification;
import com.zentaritas.model.ticket.Ticket;
import com.zentaritas.model.ticket.TicketAttachment;
import com.zentaritas.model.ticket.TicketCategory;
import com.zentaritas.model.ticket.TicketPriority;
import com.zentaritas.model.ticket.TicketMessage;
import com.zentaritas.model.ticket.TicketStatus;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.ticket.TicketAttachmentRepository;
import com.zentaritas.repository.ticket.TicketMessageRepository;
import com.zentaritas.repository.ticket.TicketRepository;
import com.zentaritas.service.booking.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private static final int MAX_TICKET_ATTACHMENTS = 3;
    private static final long MAX_TICKET_ATTACHMENT_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final List<String> ALLOWED_ATTACHMENT_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/jpg"
    );

    private final TicketRepository ticketRepository;
    private final TicketMessageRepository ticketMessageRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final NotificationService notificationService;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String authenticatedEmail) {
        return createTicket(request, authenticatedEmail, List.of());
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String authenticatedEmail, List<MultipartFile> attachments) {
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

        List<MultipartFile> usableAttachments = normalizeAndValidateAttachments(attachments);
        String resourceLocation = trimToNull(request.getResourceLocation());
        if ((request.getCategory() == TicketCategory.FACILITIES || request.getCategory() == TicketCategory.ROOM_BOOKING)
            && !StringUtils.hasText(resourceLocation)) {
            throw new IllegalArgumentException("resourceLocation is required for facilities and room booking tickets");
        }

        Ticket ticket = Ticket.builder()
                .ticketNumber(generateTicketNumber())
                .subject(request.getSubject().trim())
                .description(request.getDescription().trim())
            .resourceLocation(resourceLocation)
                .preferredContactDetails(request.getPreferredContactDetails().trim())
                .category(request.getCategory())
                .audience(request.getAudience())
                .priority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .requesterName(requesterName)
                .requesterEmail(requesterEmail)
                .requesterRole(requesterRole)
                .requesterUser(requesterUser)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        if (!usableAttachments.isEmpty()) {
            uploadTicketAttachments(savedTicket, usableAttachments);
        }

        notificationService.notifyAdmins(
                BookingNotification.NotificationType.TICKET_CREATED,
                "New Support Ticket",
                "A new ticket " + savedTicket.getTicketNumber() + " was submitted: " + savedTicket.getSubject(),
                null,
                savedTicket.getId(),
                "/admin?view=tickets"
        );

        return toResponse(savedTicket);
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
    public TicketResponse assignTicket(Long ticketId, Long staffId, String adminEmail) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Resolved or closed tickets cannot be reassigned");
        }
        if (ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Rejected tickets cannot be reassigned");
        }
        if (ticket.getAssignedTo() != null && ticket.getStatus() == TicketStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("This ticket is already transferred to staff and cannot be reassigned by admin");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found"));

        if (staff.getRole() != Role.NON_ACADEMIC_STAFF) {
            throw new IllegalArgumentException("Tickets can only be assigned to non-academic staff");
        }
        if (!Boolean.TRUE.equals(staff.getIsActive())) {
            throw new IllegalArgumentException("Cannot assign ticket to an inactive staff member");
        }

        User actingAdmin = userRepository.findByEmailIgnoreCase(adminEmail).orElse(null);
        String actingAdminName = resolveDisplayName(actingAdmin, "Admin Team");
        String assignedStaffName = resolveDisplayName(staff, staff.getEmail());

        ticket.setAssignedTo(staff);
        ticket.setAssignedAt(LocalDateTime.now());
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        clearResolutionAndClosure(ticket);
        ticket.setRejectionReason(null);

        Ticket savedTicket = ticketRepository.save(ticket);
        addTicketMessageInternal(
                savedTicket,
                actingAdmin,
                actingAdminName,
                actingAdmin != null ? actingAdmin.getEmail() : null,
                actingAdmin != null ? actingAdmin.getRole() : Role.ADMIN,
                "Ticket transferred to " + assignedStaffName + ". Please continue updates in this conversation thread."
        );

            notificationService.createNotification(
                staff,
                BookingNotification.NotificationType.TICKET_ASSIGNED,
                "Ticket Assigned",
                "Ticket " + savedTicket.getTicketNumber() + " has been assigned to you.",
                null,
                savedTicket.getId(),
                "/profile?section=assignedTickets",
                null
            );

            User requester = resolveRequesterUser(savedTicket);
            if (requester != null) {
                notificationService.createNotification(
                    requester,
                    BookingNotification.NotificationType.TICKET_STATUS_UPDATED,
                    "Ticket Assigned to Staff",
                    "Your ticket " + savedTicket.getTicketNumber() + " is now assigned to " + assignedStaffName + ".",
                    null,
                    savedTicket.getId(),
                    resolveTicketTargetPath(requester),
                    null
                );
            }

        return toResponse(savedTicket);
    }

    @Transactional
    public TicketResponse markAssignedTicketInProgress(Long ticketId, String authenticatedEmail) {
        User staff = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (staff.getRole() != Role.NON_ACADEMIC_STAFF) {
            throw new IllegalArgumentException("Only non-academic staff can update assigned ticket status");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(staff.getId())) {
            throw new IllegalArgumentException("You can only update tickets assigned to you");
        }

        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Closed or rejected tickets cannot be moved to in-progress");
        }
        if (ticket.getStatus() == TicketStatus.RESOLVED) {
            throw new IllegalArgumentException("Resolved tickets cannot be moved back to in-progress");
        }

        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticketRepository.save(ticket);
            addTicketMessageInternal(
                    ticket,
                    staff,
                    resolveDisplayName(staff, staff.getEmail()),
                    staff.getEmail(),
                    staff.getRole(),
                    "Ticket marked as IN_PROGRESS."
            );

                    User requester = resolveRequesterUser(ticket);
                    if (requester != null) {
                    notificationService.createNotification(
                        requester,
                        BookingNotification.NotificationType.TICKET_STATUS_UPDATED,
                        "Ticket In Progress",
                        "Your ticket " + ticket.getTicketNumber() + " is now in progress.",
                        null,
                        ticket.getId(),
                        resolveTicketTargetPath(requester),
                        null
                    );
                    }
        }

        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse resolveTicketByAdmin(Long ticketId, String resolutionNote, String adminEmail) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (ticket.getAssignedTo() != null) {
            throw new IllegalArgumentException("Transferred tickets must be resolved by the assigned staff member");
        }
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Closed tickets cannot be resolved again");
        }
        if (ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Rejected tickets cannot be resolved");
        }

        User adminUser = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElse(null);
        String adminName = resolveDisplayName(adminUser, "Admin Team");

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNote(trimToNull(resolutionNote));
        ticket.setResolvedAt(LocalDateTime.now());
        ticket.setResolvedByName(adminName);
        ticket.setRejectionReason(null);
        ticket.setClosedAt(null);
        ticket.setClosedByName(null);

        Ticket savedTicket = ticketRepository.save(ticket);
        if (StringUtils.hasText(savedTicket.getResolutionNote())) {
            addTicketMessageInternal(
                    savedTicket,
                    adminUser,
                    adminName,
                    adminUser != null ? adminUser.getEmail() : null,
                    adminUser != null ? adminUser.getRole() : Role.ADMIN,
                    savedTicket.getResolutionNote()
            );
        }

        User requester = resolveRequesterUser(savedTicket);
        if (requester != null) {
            notificationService.createNotification(
                    requester,
                    BookingNotification.NotificationType.TICKET_STATUS_UPDATED,
                    "Ticket Resolved",
                    "Your ticket " + savedTicket.getTicketNumber() + " has been resolved by admin.",
                    null,
                    savedTicket.getId(),
                    resolveTicketTargetPath(requester),
                    null
            );
        }

        return toResponse(savedTicket);
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
        if (!StringUtils.hasText(resolutionNote)) {
            throw new IllegalArgumentException("Resolution note is required when resolving a transferred ticket");
        }
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Closed or rejected tickets cannot be resolved");
        }

        String staffName = resolveDisplayName(staff, staff.getEmail());

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNote(trimToNull(resolutionNote));
        ticket.setResolvedAt(LocalDateTime.now());
        ticket.setResolvedByName(staffName);
        ticket.setRejectionReason(null);
        ticket.setClosedAt(null);
        ticket.setClosedByName(null);

        Ticket savedTicket = ticketRepository.save(ticket);
        addTicketMessageInternal(
                savedTicket,
                staff,
                staffName,
                staff.getEmail(),
                staff.getRole(),
                savedTicket.getResolutionNote()
        );

            User requester = resolveRequesterUser(savedTicket);
            if (requester != null) {
                notificationService.createNotification(
                    requester,
                    BookingNotification.NotificationType.TICKET_STATUS_UPDATED,
                    "Ticket Resolved",
                    "Your ticket " + savedTicket.getTicketNumber() + " has been resolved by support staff.",
                    null,
                    savedTicket.getId(),
                    resolveTicketTargetPath(requester),
                    null
                );
            }

        return toResponse(savedTicket);
    }

    @Transactional
    public TicketResponse closeTicket(Long ticketId, String authenticatedEmail) {
        User actor = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ensureCanCloseTicket(actor, ticket);

        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new IllegalArgumentException("Only resolved tickets can be closed");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());
        ticket.setClosedByName(resolveDisplayName(actor, actor.getEmail()));

        Ticket savedTicket = ticketRepository.save(ticket);
        addTicketMessageInternal(
                savedTicket,
                actor,
                resolveDisplayName(actor, actor.getEmail()),
                actor.getEmail(),
                actor.getRole(),
                "Ticket marked as CLOSED."
        );

            User requester = resolveRequesterUser(savedTicket);
            if (requester != null && !requester.getId().equals(actor.getId())) {
                notificationService.createNotification(
                    requester,
                    BookingNotification.NotificationType.TICKET_STATUS_UPDATED,
                    "Ticket Closed",
                    "Your ticket " + savedTicket.getTicketNumber() + " has been closed.",
                    null,
                    savedTicket.getId(),
                    resolveTicketTargetPath(requester),
                    null
                );
            }

        return toResponse(savedTicket);
    }

    @Transactional
    public TicketResponse rejectTicketByAdmin(Long ticketId, String reason, String adminEmail) {
        String trimmedReason = trimToNull(reason);
        if (!StringUtils.hasText(trimmedReason)) {
            throw new IllegalArgumentException("Rejection reason is required");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Closed tickets cannot be rejected");
        }
        if (ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Ticket is already rejected");
        }

        User adminUser = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElse(null);
        String adminName = resolveDisplayName(adminUser, "Admin Team");

        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(trimmedReason);
        clearResolutionAndClosure(ticket);

        Ticket savedTicket = ticketRepository.save(ticket);
        addTicketMessageInternal(
                savedTicket,
                adminUser,
                adminName,
                adminUser != null ? adminUser.getEmail() : null,
                adminUser != null ? adminUser.getRole() : Role.ADMIN,
                "Ticket rejected: " + trimmedReason
        );

            User requester = resolveRequesterUser(savedTicket);
            if (requester != null) {
                notificationService.createNotification(
                    requester,
                    BookingNotification.NotificationType.TICKET_STATUS_UPDATED,
                    "Ticket Rejected",
                    "Your ticket " + savedTicket.getTicketNumber() + " was rejected: " + trimmedReason,
                    null,
                    savedTicket.getId(),
                    resolveTicketTargetPath(requester),
                    null
                );
            }

        return toResponse(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<TicketMessageResponse> getTicketReplies(Long ticketId, String authenticatedEmail) {
        User actor = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ensureCanAccessTicket(actor, ticket);

        return ticketMessageRepository.findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketMessageResponse addTicketReply(Long ticketId, String authenticatedEmail, String message) {
        User actor = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ensureCanAccessTicket(actor, ticket);

        String trimmedMessage = trimToNull(message);
        if (!StringUtils.hasText(trimmedMessage)) {
            throw new IllegalArgumentException("Ticket reply is required");
        }

        TicketMessage saved = addTicketMessageInternal(
                ticket,
                actor,
                resolveDisplayName(actor, actor.getEmail()),
                actor.getEmail(),
                actor.getRole(),
                trimmedMessage
        );

            notifyTicketReplyParticipants(ticket, actor, trimmedMessage);

        return toMessageResponse(saved);
    }

    @Transactional
    public TicketMessageResponse updateTicketReply(Long ticketId, Long messageId, String authenticatedEmail, String message) {
        User actor = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ensureCanAccessTicket(actor, ticket);

        TicketMessage ticketMessage = ticketMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket reply not found"));

        if (!ticketMessage.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Ticket reply does not belong to this ticket");
        }

        ensureCanManageMessage(actor, ticketMessage);

        String trimmedMessage = trimToNull(message);
        if (!StringUtils.hasText(trimmedMessage)) {
            throw new IllegalArgumentException("Ticket reply is required");
        }

        ticketMessage.setMessage(trimmedMessage);
        ticketMessage.setEditedAt(LocalDateTime.now());
        return toMessageResponse(ticketMessageRepository.save(ticketMessage));
    }

    @Transactional
    public void deleteTicketReply(Long ticketId, Long messageId, String authenticatedEmail) {
        User actor = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ensureCanAccessTicket(actor, ticket);

        TicketMessage ticketMessage = ticketMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket reply not found"));

        if (!ticketMessage.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Ticket reply does not belong to this ticket");
        }

        ensureCanManageMessage(actor, ticketMessage);

        ticketMessageRepository.delete(ticketMessage);
    }

    private List<MultipartFile> normalizeAndValidateAttachments(List<MultipartFile> attachments) {
        List<MultipartFile> normalized = (attachments == null ? List.<MultipartFile>of() : attachments).stream()
                .filter(Objects::nonNull)
                .filter(file -> !file.isEmpty())
                .collect(Collectors.toList());

        if (normalized.size() > MAX_TICKET_ATTACHMENTS) {
            throw new IllegalArgumentException("You can upload up to 3 evidence images per ticket");
        }

        for (MultipartFile file : normalized) {
            String contentType = file.getContentType();
            if (file.getSize() > MAX_TICKET_ATTACHMENT_SIZE_BYTES) {
                throw new IllegalArgumentException("Each evidence image must be 5MB or smaller");
            }

            if (!StringUtils.hasText(file.getOriginalFilename())) {
                throw new IllegalArgumentException("Attachment file name is required");
            }

            if (StringUtils.hasText(contentType)) {
                if (!ALLOWED_ATTACHMENT_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                    throw new IllegalArgumentException("Only JPG, PNG, WEBP, and GIF images are allowed");
                }
            } else if (!hasAllowedImageExtension(file.getOriginalFilename())) {
                throw new IllegalArgumentException("Only JPG, PNG, WEBP, and GIF images are allowed");
            }
        }

        return normalized;
    }

    private boolean hasAllowedImageExtension(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".png")
                || lower.endsWith(".webp")
                || lower.endsWith(".gif");
    }

    private void uploadTicketAttachments(Ticket ticket, List<MultipartFile> attachments) {
        List<String> uploadedPublicIds = new ArrayList<>();
        try {
            for (MultipartFile file : attachments) {
                ImageUploadResult uploadResult = uploadImage(file, "zentaritas/tickets/evidence", "ticket-" + ticket.getId());
                uploadedPublicIds.add(uploadResult.publicId());

                TicketAttachment attachment = TicketAttachment.builder()
                        .ticket(ticket)
                        .imageUrl(uploadResult.url())
                        .publicId(uploadResult.publicId())
                        .originalFileName(trimToNull(file.getOriginalFilename()))
                        .build();

                ticketAttachmentRepository.save(attachment);
            }
        } catch (RuntimeException ex) {
            uploadedPublicIds.forEach(this::deleteCloudinaryAssetQuietly);
            throw ex;
        }
    }

    private ImageUploadResult uploadImage(MultipartFile image, String folder, String publicIdPrefix) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(image.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "public_id", publicIdPrefix + "-" + UUID.randomUUID()
            ));
            String secureUrl = Objects.toString(uploadResult.get("secure_url"), null);
            String publicId = Objects.toString(uploadResult.get("public_id"), null);
            if (secureUrl == null || publicId == null) {
                throw new IllegalArgumentException("Cloudinary did not return a valid image response");
            }
            return new ImageUploadResult(secureUrl, publicId);
        } catch (IOException ex) {
            log.error("Failed to upload ticket attachment to Cloudinary", ex);
            throw new IllegalArgumentException("Failed to upload ticket attachment");
        }
    }

    private void deleteCloudinaryAssetQuietly(String publicId) {
        if (!StringUtils.hasText(publicId)) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException ex) {
            log.warn("Failed to delete Cloudinary asset: {}", publicId, ex);
        }
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

        List<TicketAttachmentResponse> attachments = ticketAttachmentRepository.findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(this::toAttachmentResponse)
                .collect(Collectors.toList());

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .resourceLocation(ticket.getResourceLocation())
                .preferredContactDetails(ticket.getPreferredContactDetails())
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
                .assignedAt(ticket.getAssignedAt())
                .resolutionNote(ticket.getResolutionNote())
                .rejectionReason(ticket.getRejectionReason())
                .resolvedByName(ticket.getResolvedByName())
                .closedByName(ticket.getClosedByName())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .closedAt(ticket.getClosedAt())
                .attachments(attachments)
                .build();
    }

    private TicketAttachmentResponse toAttachmentResponse(TicketAttachment attachment) {
        return TicketAttachmentResponse.builder()
                .id(attachment.getId())
                .imageUrl(attachment.getImageUrl())
                .originalFileName(attachment.getOriginalFileName())
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    private String resolveDisplayName(User user, String fallback) {
        if (user == null) {
            return fallback;
        }

        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        if (StringUtils.hasText(fullName)) {
            return fullName;
        }
        if (StringUtils.hasText(user.getUsername())) {
            return user.getUsername();
        }
        if (StringUtils.hasText(user.getEmail())) {
            return user.getEmail();
        }
        return fallback;
    }

    private TicketMessageResponse toMessageResponse(TicketMessage message) {
        return TicketMessageResponse.builder()
                .id(message.getId())
                .ticketId(message.getTicket().getId())
                .senderUserId(message.getSenderUser() != null ? message.getSenderUser().getId() : null)
                .senderName(message.getSenderName())
                .senderEmail(message.getSenderEmail())
                .senderRole(message.getSenderRole())
                .message(message.getMessage())
                .editedAt(message.getEditedAt())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private void ensureCanAccessTicket(User actor, Ticket ticket) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        boolean requesterMatchesUser = ticket.getRequesterUser() != null
                && ticket.getRequesterUser().getId().equals(actor.getId());
        boolean requesterMatchesEmail = StringUtils.hasText(ticket.getRequesterEmail())
                && ticket.getRequesterEmail().equalsIgnoreCase(actor.getEmail());
        boolean isAssignedStaff = ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(actor.getId());

        if (!(requesterMatchesUser || requesterMatchesEmail || isAssignedStaff)) {
            throw new IllegalArgumentException("You do not have access to this ticket conversation");
        }
    }

    private void ensureCanManageMessage(User actor, TicketMessage message) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        boolean ownerByUser = message.getSenderUser() != null
                && message.getSenderUser().getId().equals(actor.getId());
        boolean ownerByEmail = message.getSenderUser() == null
                && StringUtils.hasText(message.getSenderEmail())
                && message.getSenderEmail().equalsIgnoreCase(actor.getEmail());

        if (!(ownerByUser || ownerByEmail)) {
            throw new IllegalArgumentException("You can edit or delete only your own ticket replies");
        }
    }

    private void ensureCanCloseTicket(User actor, Ticket ticket) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        boolean requesterMatchesUser = ticket.getRequesterUser() != null
                && ticket.getRequesterUser().getId().equals(actor.getId());
        boolean requesterMatchesEmail = StringUtils.hasText(ticket.getRequesterEmail())
                && ticket.getRequesterEmail().equalsIgnoreCase(actor.getEmail());
        boolean assignedStaff = actor.getRole() == Role.NON_ACADEMIC_STAFF
                && ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(actor.getId());

        if (!(requesterMatchesUser || requesterMatchesEmail || assignedStaff)) {
            throw new IllegalArgumentException("You do not have permission to close this ticket");
        }
    }

    private TicketMessage addTicketMessageInternal(
            Ticket ticket,
            User senderUser,
            String senderName,
            String senderEmail,
            Role senderRole,
            String message
    ) {
        TicketMessage entry = TicketMessage.builder()
                .ticket(ticket)
                .senderUser(senderUser)
                .senderName(senderName)
                .senderEmail(senderEmail)
                .senderRole(senderRole)
                .message(message)
                .build();

        return ticketMessageRepository.save(entry);
    }

    private void notifyTicketReplyParticipants(Ticket ticket, User actor, String message) {
        Set<Long> notifiedUserIds = new HashSet<>();
        String actorName = resolveDisplayName(actor, "Support Team");
        String snippet = message.length() > 120 ? message.substring(0, 117) + "..." : message;
        String notificationMessage = actorName + " replied to " + ticket.getTicketNumber() + ": " + snippet;

        User requester = resolveRequesterUser(ticket);
        maybeNotifyReplyRecipient(ticket, requester, actor, notifiedUserIds, notificationMessage);
        maybeNotifyReplyRecipient(ticket, ticket.getAssignedTo(), actor, notifiedUserIds, notificationMessage);
    }

    private void maybeNotifyReplyRecipient(
            Ticket ticket,
            User recipient,
            User actor,
            Set<Long> notifiedUserIds,
            String message
    ) {
        if (recipient == null || recipient.getId() == null || !Boolean.TRUE.equals(recipient.getIsActive())) {
            return;
        }

        if (actor != null && recipient.getId().equals(actor.getId())) {
            return;
        }

        if (!notifiedUserIds.add(recipient.getId())) {
            return;
        }

        notificationService.createNotification(
                recipient,
                BookingNotification.NotificationType.TICKET_REPLY,
                "New Ticket Reply",
                message,
                null,
                ticket.getId(),
                resolveTicketTargetPath(recipient),
                null
        );
    }

    private User resolveRequesterUser(Ticket ticket) {
        if (ticket.getRequesterUser() != null) {
            return ticket.getRequesterUser();
        }

        if (StringUtils.hasText(ticket.getRequesterEmail())) {
            return userRepository.findByEmailIgnoreCase(ticket.getRequesterEmail()).orElse(null);
        }

        return null;
    }

    private String resolveTicketTargetPath(User recipient) {
        if (recipient == null) {
            return "/my-tickets";
        }

        return switch (recipient.getRole()) {
            case ADMIN -> "/admin?view=tickets";
            case NON_ACADEMIC_STAFF -> "/profile?section=assignedTickets";
            default -> "/my-tickets";
        };
    }

    private void clearResolutionAndClosure(Ticket ticket) {
        ticket.setResolutionNote(null);
        ticket.setResolvedAt(null);
        ticket.setResolvedByName(null);
        ticket.setClosedAt(null);
        ticket.setClosedByName(null);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private record ImageUploadResult(String url, String publicId) {
    }
}
