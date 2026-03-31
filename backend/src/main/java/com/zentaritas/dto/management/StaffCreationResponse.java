package com.zentaritas.dto.management;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StaffCreationResponse {
    private UserManagementResponse user;
    private Boolean emailSent;
    private String message;
}
