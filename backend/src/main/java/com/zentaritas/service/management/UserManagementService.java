package com.zentaritas.service.management;

import com.zentaritas.dto.management.CreateStaffRequest;
import com.zentaritas.dto.management.StaffCreationResponse;
import com.zentaritas.dto.management.UpdateUserStatusRequest;
import com.zentaritas.dto.management.UserManagementResponse;
import com.zentaritas.exception.ResourceNotFoundException;
import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.service.auth.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public List<UserManagementResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserManagementResponse::from)
                .collect(Collectors.toList());
    }

    public List<UserManagementResponse> getStudents() {
        return userRepository.findByRole(Role.STUDENT)
                .stream()
                .map(UserManagementResponse::from)
                .collect(Collectors.toList());
    }

    public List<UserManagementResponse> getStaff() {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == Role.ACADEMIC_STAFF || user.getRole() == Role.NON_ACADEMIC_STAFF)
                .map(UserManagementResponse::from)
                .collect(Collectors.toList());
    }

    public List<UserManagementResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role)
                .stream()
                .map(UserManagementResponse::from)
                .collect(Collectors.toList());
    }

    public UserManagementResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserManagementResponse.from(user);
    }

    @Transactional
    public StaffCreationResponse createStaffAccount(CreateStaffRequest request) {
        if (request.getRole() != Role.ACADEMIC_STAFF && request.getRole() != Role.NON_ACADEMIC_STAFF) {
            throw new IllegalArgumentException("Only ACADEMIC_STAFF or NON_ACADEMIC_STAFF roles are allowed");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        String rawPassword = generateDefaultPassword(request.getEmail());

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .password(passwordEncoder.encode(rawPassword))
                .isActive(true)
                .isVerified(true)
                .build();

        User savedUser = userRepository.save(user);

        // Send credentials email if requested
        boolean emailSent = false;
        if (Boolean.TRUE.equals(request.getSendEmail())) {
            try {
                String staffName = request.getFirstName() + " " + request.getLastName();
                emailService.sendStaffCredentialsEmail(
                    request.getEmail(),
                    staffName,
                    rawPassword,
                    request.getRole().name()
                );
                emailSent = true;
                log.info("Staff credentials email sent successfully to: {}", request.getEmail());
            } catch (Exception e) {
                log.error("Failed to send staff credentials email to: {}", request.getEmail(), e);
                // Don't fail the creation if email fails - just log it
            }
        }

        return StaffCreationResponse.builder()
                .user(UserManagementResponse.from(savedUser))
                .emailSent(emailSent)
                .message("Staff account created successfully" + (emailSent ? " and credentials email sent" : ""))
                .build();
    }

    @Transactional
    public List<StaffCreationResponse> importStaffFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Excel file is required");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            throw new IllegalArgumentException("Only .xlsx files are supported");
        }

        List<StaffCreationResponse> results = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new IllegalArgumentException("Excel file is empty");
            }

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("Header row is missing in Excel file");
            }

            Map<String, Integer> columns = buildHeaderMap(headerRow, formatter);
            validateRequiredHeaders(columns);

            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row, formatter)) {
                    continue;
                }

                String email = readCell(row, columns.get("email"), formatter);
                String firstName = readCell(row, columns.get("firstname"), formatter);
                String lastName = readCell(row, columns.get("lastname"), formatter);
                String roleValue = readCell(row, columns.get("role"), formatter);

                if (email.isBlank() || firstName.isBlank() || lastName.isBlank() || roleValue.isBlank()) {
                    results.add(StaffCreationResponse.builder()
                            .user(null)
                            .emailSent(false)
                            .message("Skipped row " + (rowIndex + 1) + ": required values are missing")
                            .build());
                    continue;
                }

                Role role;
                try {
                    role = parseStaffRole(roleValue);
                } catch (IllegalArgumentException ex) {
                    results.add(StaffCreationResponse.builder()
                            .user(null)
                            .emailSent(false)
                            .message("Skipped row " + (rowIndex + 1) + ": " + ex.getMessage())
                            .build());
                    continue;
                }

                if (userRepository.existsByEmail(email)) {
                    results.add(StaffCreationResponse.builder()
                            .user(null)
                            .emailSent(false)
                            .message("Skipped row " + (rowIndex + 1) + ": email already registered")
                            .build());
                    continue;
                }

                CreateStaffRequest request = new CreateStaffRequest();
                request.setEmail(email);
                request.setFirstName(firstName);
                request.setLastName(lastName);
                request.setRole(role);
                request.setSendEmail(false);

                StaffCreationResponse created = createStaffAccount(request);
                created.setMessage("Imported row " + (rowIndex + 1) + " successfully");
                results.add(created);
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to read Excel file");
        }

        if (results.isEmpty()) {
            throw new IllegalArgumentException("No importable rows were found in the Excel file");
        }

        return results;
    }

    @Transactional  
    public UserManagementResponse updateUserStatus(Long id, UpdateUserStatusRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsActive(Objects.requireNonNull(request.getIsActive(), "isActive cannot be null"));
        User savedUser = userRepository.save(user);

        return UserManagementResponse.from(savedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be deleted");
        }

        userRepository.delete(user);
    }

    private String generateDefaultPassword(String email) {
        String usernamePart = (email == null ? "" : email).split("@")[0];
        usernamePart = usernamePart.replaceAll("[^A-Za-z0-9]", "").toLowerCase(Locale.ROOT);
        if (usernamePart.isBlank()) {
            usernamePart = "user";
        }
        int currentYear = Year.now().getValue();
        return usernamePart + currentYear;
    }

    private Map<String, Integer> buildHeaderMap(Row headerRow, DataFormatter formatter) {
        Map<String, Integer> columns = new HashMap<>();
        for (Cell cell : headerRow) {
            String header = formatter.formatCellValue(cell).trim().toLowerCase(Locale.ROOT).replace("_", "").replace(" ", "");
            if (!header.isBlank()) {
                columns.put(header, cell.getColumnIndex());
            }
        }
        return columns;
    }

    private void validateRequiredHeaders(Map<String, Integer> columns) {
        if (!columns.containsKey("email")
                || !columns.containsKey("firstname")
                || !columns.containsKey("lastname")
                || !columns.containsKey("role")) {
            throw new IllegalArgumentException("Excel must include headers: email, firstName, lastName, role");
        }
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            if (i < 0) {
                continue;
            }
            if (!formatter.formatCellValue(row.getCell(i)).trim().isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String readCell(Row row, Integer column, DataFormatter formatter) {
        if (column == null) {
            return "";
        }
        return formatter.formatCellValue(row.getCell(column)).trim();
    }

    private Role parseStaffRole(String value) {
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        Role role = Role.valueOf(normalized);
        if (role != Role.ACADEMIC_STAFF && role != Role.NON_ACADEMIC_STAFF) {
            throw new IllegalArgumentException("role must be ACADEMIC_STAFF or NON_ACADEMIC_STAFF");
        }
        return role;
    }
}
