package com.zentaritas.dto.management.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponse {
    private Long id;
    private String name;
    private String type;
    private Integer quantity;
    private Long roomId;
}
