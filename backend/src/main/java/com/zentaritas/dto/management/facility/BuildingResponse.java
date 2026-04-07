package com.zentaritas.dto.management.facility;

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
public class BuildingResponse {
    private Long id;
    private String name;
    private String code;
    private String type;
    private String campus;
    private String location;
    private Integer totalFloors;
    private String description;
    private String status;
    private String imageUrl;
    private Integer yearEstablished;
    private String manager;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Boolean closedOnWeekends;
    private UserSummaryResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
