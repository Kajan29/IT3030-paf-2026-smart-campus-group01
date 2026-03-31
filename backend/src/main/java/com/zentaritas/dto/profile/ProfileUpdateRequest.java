package com.zentaritas.dto.profile;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    @Size(max = 20)
    private String phoneNumber;

    @Size(max = 120)
    private String department;
}
