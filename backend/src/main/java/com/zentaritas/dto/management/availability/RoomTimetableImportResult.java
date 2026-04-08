package com.zentaritas.dto.management.availability;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomTimetableImportResult {
    private Integer rowNumber;
    private Boolean imported;
    private String roomCode;
    private String staffName;
    private String message;
    private RoomTimetableResponse entry;
}