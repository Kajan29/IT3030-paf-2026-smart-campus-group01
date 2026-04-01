package com.zentaritas.controller.booking.dto;

import com.zentaritas.model.booking.RoomBooking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for booking operation results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResultDTO {
    private Boolean success;
    private RoomBooking booking;
    private List<String> errors;
}
