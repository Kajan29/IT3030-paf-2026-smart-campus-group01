package com.zentaritas.repository.ticket;

import com.zentaritas.model.auth.User;
import com.zentaritas.model.ticket.Ticket;
import com.zentaritas.model.ticket.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    boolean existsByTicketNumber(String ticketNumber);
    List<Ticket> findByRequesterUserOrderByCreatedAtDesc(User requesterUser);
    List<Ticket> findByRequesterEmailIgnoreCaseOrderByCreatedAtDesc(String requesterEmail);
    List<Ticket> findByAssignedToOrderByCreatedAtDesc(User assignedTo);
    List<Ticket> findByStatusOrderByCreatedAtDesc(TicketStatus status);
    List<Ticket> findAllByOrderByCreatedAtDesc();
}
