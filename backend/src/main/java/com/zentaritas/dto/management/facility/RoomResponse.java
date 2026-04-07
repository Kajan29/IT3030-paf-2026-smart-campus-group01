package com.zentaritas.dto.management.facility;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private String name;
    private String code;
    private Long buildingId;
    private Long floorId;
    private String type;
    private Double lengthMeters;
    private Double widthMeters;
    private Double areaSqMeters;
    private Double areaSqFeet;
    private Integer seatingCapacity;
    private Integer maxOccupancy;
    private List<String> facilities;
    private String status;
    private String description;
    private String condition;
    private String climateControl;
    private Boolean smartClassroomEnabled;
    private Boolean projectorAvailable;
    private String boardType;
    private Boolean internetAvailable;
    private Integer chairs;
    private Integer tables;
    private Boolean labEquipmentAvailable;
    private Boolean powerBackupAvailable;
    private Boolean accessibilitySupport;
    private String maintenanceStatus;
    private Boolean bookingAvailable;
    private Boolean closedOnWeekends;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private List<String> maintenanceHistory;
    private String imageUrl;
    private UserSummaryResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
