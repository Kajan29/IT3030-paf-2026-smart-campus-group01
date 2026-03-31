package com.zentaritas.dto.management.facility;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorResponse {
    private Long id;
    private Long buildingId;
    private Integer floorNumber;
    private String floorName;
    private String description;
    private String accessibility;
    private String mapUrl;
    private UserSummaryResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
