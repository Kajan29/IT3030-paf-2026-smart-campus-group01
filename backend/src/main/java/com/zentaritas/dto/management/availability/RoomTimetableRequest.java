package com.zentaritas.dto.management.availability;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class RoomTimetableRequest {
    @NotNull
    private Long roomId;

    private Long substituteRoomId;

    @NotBlank
    private String dayOfWeek;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @NotBlank
    private String lectureName;

    @NotBlank
    private String lecturerName;

    private String lecturerEmail;

    @NotBlank
    private String purpose;

    private String notes;

    @NotBlank
    private String entryType;

    private Boolean active = true;
}