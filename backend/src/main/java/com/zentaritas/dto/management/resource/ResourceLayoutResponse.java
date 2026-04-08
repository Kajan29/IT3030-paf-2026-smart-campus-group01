package com.zentaritas.dto.management.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceLayoutResponse {
    private Long id;
    private Long resourceId;
    private Long roomId;
    private Double x;
    private Double y;
    private Double z;
    private Double rotation;
    private Double scale;
}
