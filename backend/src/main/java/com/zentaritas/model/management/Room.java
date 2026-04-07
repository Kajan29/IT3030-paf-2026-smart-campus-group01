package com.zentaritas.model.management;

import com.zentaritas.model.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(nullable = false)
    private String type;

    @Column(name = "length_meters", nullable = false)
    private Double lengthMeters;

    @Column(name = "width_meters", nullable = false)
    private Double widthMeters;

    @Column(name = "area_sq_meters", nullable = false)
    private Double areaSqMeters;

    @Column(name = "area_sq_feet", nullable = false)
    private Double areaSqFeet;

    @Column(name = "seating_capacity", nullable = false)
    private Integer seatingCapacity;

    @Column(name = "max_occupancy", nullable = false)
    private Integer maxOccupancy;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "room_facilities", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "facility")
    @Builder.Default
    private List<String> facilities = new ArrayList<>();

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String condition;

    @Column(name = "climate_control", nullable = false)
    private String climateControl;

    @Column(name = "smart_classroom_enabled", nullable = false)
    private Boolean smartClassroomEnabled;

    @Column(name = "projector_available", nullable = false)
    private Boolean projectorAvailable;

    @Column(name = "board_type", nullable = false)
    private String boardType;

    @Column(name = "internet_available", nullable = false)
    private Boolean internetAvailable;

    @Column(nullable = false)
    private Integer chairs;

    @Column(nullable = false)
    private Integer tables;

    @Column(name = "lab_equipment_available", nullable = false)
    private Boolean labEquipmentAvailable;

    @Column(name = "power_backup_available", nullable = false)
    private Boolean powerBackupAvailable;

    @Column(name = "accessibility_support", nullable = false)
    private Boolean accessibilitySupport;

    @Column(name = "maintenance_status", nullable = false)
    private String maintenanceStatus;

    @Column(name = "booking_available", nullable = false)
    private Boolean bookingAvailable;

    @Column(name = "closed_on_weekends")
    @Builder.Default
    private Boolean closedOnWeekends = false;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "room_maintenance_history", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "entry", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> maintenanceHistory = new ArrayList<>();

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "image_public_id")
    private String imagePublicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
