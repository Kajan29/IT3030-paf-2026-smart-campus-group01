package com.zentaritas.repository.ticket;

import com.zentaritas.model.ticket.Ticket;
import com.zentaritas.model.ticket.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    List<TicketAttachment> findByTicketOrderByCreatedAtAsc(Ticket ticket);
}
