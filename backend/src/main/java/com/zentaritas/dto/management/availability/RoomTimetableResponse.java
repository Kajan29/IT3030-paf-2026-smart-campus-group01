package com.zentaritas.dto.management.availability;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomTimetableResponse {
    private Long id;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long substituteRoomId;
    private String substituteRoomCode;
    private String substituteRoomName;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String lectureName;
    private String lecturerName;
    private String lecturerEmail;
    private String purpose;
    private String notes;
    private String entryType;
    private Boolean active;
    private Boolean substituteNotified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}