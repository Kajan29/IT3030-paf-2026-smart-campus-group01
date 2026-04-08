package com.zentaritas.repository.ticket;

import com.zentaritas.model.ticket.Ticket;
import com.zentaritas.model.ticket.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {
    List<TicketMessage> findByTicketOrderByCreatedAtAsc(Ticket ticket);
}
