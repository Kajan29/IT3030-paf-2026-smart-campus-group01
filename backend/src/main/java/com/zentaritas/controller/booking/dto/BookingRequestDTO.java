package com.zentaritas.controller.booking.dto;

import com.zentaritas.model.booking.RoomBooking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for creating/updating room bookings
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private RoomBooking.BookingType bookingType;
    private Integer participantsCount;
    private Integer seatsBooked;
    private Boolean isRecurring;
    private String recurringPattern;  // DAILY, WEEKLY, MONTHLY
    private LocalDateTime recurringEndDate;
}
