package com.zentaritas.config;

import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.management.Building;
import com.zentaritas.model.management.Floor;
import com.zentaritas.model.management.Room;
import com.zentaritas.model.management.RoomResource;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.management.BuildingRepository;
import com.zentaritas.repository.management.FloorRepository;
import com.zentaritas.repository.management.RoomRepository;
import com.zentaritas.repository.management.RoomResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.time.LocalTime;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class FacilitySampleDataInitializer {

    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
        private final RoomResourceRepository roomResourceRepository;
    private final UserRepository userRepository;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Bean
    @Order(2)
    CommandLineRunner initFacilitySampleData() {
        return args -> {
            User seedOwner = resolveSeedOwner();
            if (seedOwner == null) {
                log.warn("Skipping facility sample-data seed: no users available yet.");
                return;
            }

            Map<String, Building> buildingByCode = seedBuildings(seedOwner);
            Map<String, Floor> floorByKey = seedFloors(buildingByCode, seedOwner);
            seedRooms(buildingByCode, floorByKey, seedOwner);
                        seedRoomResources();
        };
    }

    private User resolveSeedOwner() {
        Optional<User> adminByEmail = userRepository.findByEmailIgnoreCase(adminEmail);
        if (adminByEmail.isPresent()) {
            return adminByEmail.get();
        }

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        if (!admins.isEmpty()) {
            return admins.get(0);
        }

        return userRepository.findAll().stream().findFirst().orElse(null);
    }

    private Map<String, Building> seedBuildings(User createdBy) {
        int created = 0;
        Map<String, Building> byCode = new HashMap<>();

        for (BuildingSeedData data : buildingSeedData()) {
            String code = data.code().trim().toUpperCase(Locale.ROOT);
                        Optional<Building> existing = buildingRepository.findByCodeIgnoreCase(code);
                        Building building;
                        if (existing.isPresent()) {
                                building = existing.get();
                                boolean dirty = applyBuildingHoursDefaults(building, code);
                                if (dirty) {
                                        building = buildingRepository.save(building);
                                }
                        } else {
                                Building entity = Building.builder()
                                                .name(data.name())
                                                .code(code)
                                                .type(data.type())
                                                .campus(data.campus())
                                                .location(data.location())
                                                .totalFloors(data.totalFloors())
                                                .description(data.description())
                                                .status(data.status())
                                                .imageUrl(data.imageUrl())
                                                .yearEstablished(data.yearEstablished())
                                                .manager(data.manager())
                                                                                                .openingTime(defaultBuildingOpeningTime(code))
                                                                                                .closingTime(defaultBuildingClosingTime(code))
                                                                                                .closedOnWeekends(defaultBuildingClosedOnWeekends(code))
                                                .createdBy(createdBy)
                                                .build();
                                building = buildingRepository.save(entity);
                created++;
            }

            byCode.put(code, building);
        }

        log.info("Facility sample-data: buildings ready={}, newly created={}", byCode.size(), created);
        return byCode;
    }

    private Map<String, Floor> seedFloors(Map<String, Building> buildingByCode, User createdBy) {
        int created = 0;
        Map<String, Floor> byKey = new HashMap<>();

        for (FloorSeedData data : floorSeedData()) {
            String buildingCode = data.buildingCode().trim().toUpperCase(Locale.ROOT);
            Building building = buildingByCode.get(buildingCode);
            if (building == null) {
                log.warn("Skipping floor seed. Building not found for code={}", buildingCode);
                continue;
            }

                        Optional<Floor> existing = floorRepository.findByBuildingIdAndFloorNumber(building.getId(), data.floorNumber());
                        Floor floor;
                        if (existing.isPresent()) {
                                floor = existing.get();
                        } else {
                                Floor entity = Floor.builder()
                                                .building(building)
                                                .floorNumber(data.floorNumber())
                                                .floorName(data.floorName())
                                                .description(data.description())
                                                .accessibility(data.accessibility())
                                                .mapUrl(data.mapUrl())
                                                .createdBy(createdBy)
                                                .build();
                                floor = floorRepository.save(entity);
                created++;
            }

            byKey.put(floorKey(buildingCode, data.floorNumber()), floor);
        }

        log.info("Facility sample-data: floors ready={}, newly created={}", byKey.size(), created);
        return byKey;
    }

    private void seedRooms(Map<String, Building> buildingByCode, Map<String, Floor> floorByKey, User createdBy) {
        int created = 0;

        for (RoomSeedData data : roomSeedData()) {
            String code = data.code().trim().toUpperCase(Locale.ROOT);
                        Optional<Room> existing = roomRepository.findByCodeIgnoreCase(code);

            String buildingCode = data.buildingCode().trim().toUpperCase(Locale.ROOT);
            Building building = buildingByCode.get(buildingCode);
            if (building == null) {
                log.warn("Skipping room seed. Building not found for code={}", buildingCode);
                continue;
            }

            Floor floor = floorByKey.get(floorKey(buildingCode, data.floorNumber()));
            if (floor == null) {
                log.warn("Skipping room seed. Floor not found for building={} floor={}", buildingCode, data.floorNumber());
                continue;
            }

                        if (existing.isPresent()) {
                                Room room = existing.get();
                                boolean dirty = applyRoomHoursDefaults(room, buildingCode);
                                if (dirty) {
                                        roomRepository.save(room);
                                }
                                continue;
                        }

                        Room room = Room.builder()
                                        .name(data.name())
                                        .code(code)
                                        .building(building)
                                        .floor(floor)
                                        .type(data.type())
                                        .lengthMeters(data.lengthMeters())
                                        .widthMeters(data.widthMeters())
                                        .areaSqMeters(data.areaSqMeters())
                                        .areaSqFeet(data.areaSqFeet())
                                        .seatingCapacity(data.seatingCapacity())
                                        .facilities(data.facilities())
                                        .status(data.status())
                                        .description(data.description())
                                        .condition(data.condition())
                                        .climateControl(data.climateControl())
                                        .smartClassroomEnabled(data.smartClassroomEnabled())
                                        .projectorAvailable(data.projectorAvailable())
                                        .boardType(data.boardType())
                                        .internetAvailable(data.internetAvailable())
                                        .labEquipmentAvailable(data.labEquipmentAvailable())
                                        .powerBackupAvailable(data.powerBackupAvailable())
                                        .accessibilitySupport(data.accessibilitySupport())
                                        .maintenanceStatus(data.maintenanceStatus())
                                        .bookingAvailable(data.bookingAvailable())
                                        .closedOnWeekends(defaultBuildingClosedOnWeekends(buildingCode))
                                        .openingTime(defaultRoomOpeningTime(buildingCode))
                                        .closingTime(defaultRoomClosingTime(buildingCode))
                                        .maintenanceHistory(data.maintenanceHistory())
                                        .imageUrl(data.imageUrl())
                                        .createdBy(createdBy)
                                        .build();

                        roomRepository.save(room);
                        created++;
        }

        log.info("Facility sample-data: rooms newly created={}", created);
    }

        private void seedRoomResources() {
                int created = 0;

                for (Room room : roomRepository.findAll()) {
                        int seatingCapacity = Math.max(1, Optional.ofNullable(room.getSeatingCapacity()).orElse(1));

                        created += seedResourceIfMissing(room, "chairs", "Chairs", seatingCapacity);
                        created += seedResourceIfMissing(room, "tables", "Tables", Math.max(1, (int) Math.ceil(seatingCapacity / 2.0)));

                        if (Boolean.TRUE.equals(room.getProjectorAvailable())) {
                                created += seedResourceIfMissing(room, "projector", "Projector", 1);
                        }

                        String boardType = Optional.ofNullable(room.getBoardType()).orElse("").trim().toLowerCase(Locale.ROOT);
                        if ("whiteboard".equals(boardType) || "both".equals(boardType)) {
                                created += seedResourceIfMissing(room, "whiteboard", "Whiteboard", 1);
                        }
                        if ("smart board".equals(boardType) || "both".equals(boardType)) {
                                created += seedResourceIfMissing(room, "smart_board", "Smart Board", 1);
                        }

                        if (Boolean.TRUE.equals(room.getInternetAvailable())) {
                                created += seedResourceIfMissing(room, "access_point", "Access Point", Math.max(1, (int) Math.ceil(seatingCapacity / 40.0)));
                        }

                        if (Boolean.TRUE.equals(room.getLabEquipmentAvailable())) {
                                created += seedResourceIfMissing(room, "lab_station", "Lab Station", Math.max(1, (int) Math.ceil(seatingCapacity / 2.0)));
                        }

                        if (Boolean.TRUE.equals(room.getPowerBackupAvailable())) {
                                created += seedResourceIfMissing(room, "ups", "UPS Unit", 1);
                        }

                        if (Boolean.TRUE.equals(room.getAccessibilitySupport())) {
                                created += seedResourceIfMissing(room, "accessibility_station", "Accessibility Station", 1);
                        }
                }

                log.info("Facility sample-data: room resources newly created={}", created);
        }

        private int seedResourceIfMissing(Room room, String type, String name, Integer quantity) {
                if (quantity == null || quantity <= 0) {
                        return 0;
                }

                if (roomResourceRepository.existsByRoomIdAndType(room.getId(), type)) {
                        return 0;
                }

                RoomResource resource = RoomResource.builder()
                                .name(name)
                                .type(type)
                                .quantity(quantity)
                                .room(room)
                                .build();

                roomResourceRepository.save(resource);
                return 1;
        }

    private List<BuildingSeedData> buildingSeedData() {
        return List.of(
                new BuildingSeedData(
                        "Main Academic Building",
                        "MAB",
                        "Academic",
                        "Central Campus",
                        "North Quadrant, Main Campus",
                        4,
                        "Core teaching block for lectures, tutorials, and examinations.",
                        "Active",
                        2011,
                        "Dr. Nirmala Perera",
                        image("building-mab")
                ),
                new BuildingSeedData(
                        "Engineering Block",
                        "ENB",
                        "Laboratory",
                        "Tech Campus",
                        "Innovation Avenue, East Wing",
                        5,
                        "Engineering labs, workshops, and project rooms.",
                        "Active",
                        2015,
                        "Eng. Sahan Wijesinghe",
                        image("building-enb")
                ),
                new BuildingSeedData(
                        "Library Building",
                        "LIB",
                        "Library",
                        "Central Campus",
                        "Knowledge Plaza, Central Lawn",
                        3,
                        "Main library, discussion rooms, and digital learning spaces.",
                        "Active",
                        2019,
                        "Ms. Janani Wickramaratne",
                        image("building-lib")
                ),
                new BuildingSeedData(
                        "Administration Building",
                        "ADB",
                        "Administrative",
                        "Central Campus",
                        "University Square, West Gate",
                        3,
                        "Administrative offices, registrar, and finance departments.",
                        "Under Maintenance",
                        2008,
                        "Mr. Harsha Rodrigo",
                        image("building-adb")
                ),
                new BuildingSeedData(
                        "IT Center",
                        "ITC",
                        "Technology",
                        "Innovation Branch",
                        "Digital Park, South Campus",
                        4,
                        "Server room, computer labs, and software engineering suites.",
                        "Active",
                        2021,
                        "Ms. Kavindi Maduranga",
                        image("building-itc")
                ),
                new BuildingSeedData(
                        "Auditorium Complex",
                        "AUD",
                        "Auditorium",
                        "South Branch",
                        "Lakefront Boulevard",
                        2,
                        "Large auditorium and multipurpose halls for academic ceremonies.",
                        "Inactive",
                        2013,
                        "Mr. Dineth Gamage",
                        image("building-aud")
                )
        );
    }

    private List<FloorSeedData> floorSeedData() {
        return List.of(
                new FloorSeedData("MAB", 0, "Ground Floor", "Reception, student help desk, and tutorial rooms.", "Accessible", image("map-mab-0")),
                new FloorSeedData("MAB", 1, "First Floor", "Lecture halls and seminar rooms.", "Accessible", image("map-mab-1")),
                new FloorSeedData("MAB", 2, "Second Floor", "Examination and tutorial spaces.", "Accessible", image("map-mab-2")),
                new FloorSeedData("MAB", 3, "Third Floor", "Department offices and discussion rooms.", "Partial", image("map-mab-3")),

                new FloorSeedData("ENB", 0, "Ground Floor", "Mechanical workshop and storage areas.", "Partial", image("map-enb-0")),
                new FloorSeedData("ENB", 1, "First Floor", "Electrical and electronics laboratories.", "Accessible", image("map-enb-1")),
                new FloorSeedData("ENB", 2, "Second Floor", "Computer engineering labs and tutorial labs.", "Accessible", image("map-enb-2")),
                new FloorSeedData("ENB", 3, "Third Floor", "Research rooms and postgraduate labs.", "Partial", image("map-enb-3")),
                new FloorSeedData("ENB", 4, "Fourth Floor", "Faculty offices and meeting rooms.", "Accessible", image("map-enb-4")),

                new FloorSeedData("LIB", 0, "Ground Floor", "Open reading hall and circulation desk.", "Accessible", image("map-lib-0")),
                new FloorSeedData("LIB", 1, "First Floor", "Digital library and discussion rooms.", "Accessible", image("map-lib-1")),
                new FloorSeedData("LIB", 2, "Second Floor", "Research archives and staff rooms.", "Partial", image("map-lib-2")),

                new FloorSeedData("ADB", 0, "Ground Floor", "Public service counters and registrar office.", "Accessible", image("map-adb-0")),
                new FloorSeedData("ADB", 1, "First Floor", "Finance and administrative offices.", "Accessible", image("map-adb-1")),
                new FloorSeedData("ADB", 2, "Second Floor", "Meeting spaces and records room.", "Not Accessible", image("map-adb-2")),

                new FloorSeedData("ITC", 0, "Ground Floor", "Helpdesk and IT support center.", "Accessible", image("map-itc-0")),
                new FloorSeedData("ITC", 1, "First Floor", "Computer labs and coding rooms.", "Accessible", image("map-itc-1")),
                new FloorSeedData("ITC", 2, "Second Floor", "Server room and network operation center.", "Partial", image("map-itc-2")),
                new FloorSeedData("ITC", 3, "Third Floor", "Research and software project rooms.", "Accessible", image("map-itc-3")),

                new FloorSeedData("AUD", 0, "Ground Floor", "Main auditorium and control room.", "Accessible", image("map-aud-0")),
                new FloorSeedData("AUD", 1, "First Floor", "Multipurpose halls and storage.", "Partial", image("map-aud-1"))
        );
    }

    private List<RoomSeedData> roomSeedData() {
        return List.of(
                new RoomSeedData(
                        "Lecture Hall Alpha", "MAB-101", "MAB", 1, "Lecture Hall",
                        18.0, 12.0, 216.0, 2325.0,
                        160, 180,
                        List.of("Projector", "Smart Podium", "PA System", "Wi-Fi"),
                        "Available",
                        "Large lecture hall used for core first-year courses.",
                        "Excellent", "AC", true, true, "Both", true,
                        170, 30, false, true, true,
                        "Operational", true,
                        List.of("2026-01: Projector lens replacement", "2025-09: HVAC servicing"),
                        image("room-mab-101")
                ),
                new RoomSeedData(
                        "Tutorial Room T-05", "MAB-205", "MAB", 2, "Tutorial Room",
                        8.0, 7.0, 56.0, 603.0,
                        35, 40,
                        List.of("Whiteboard", "Projector", "Wi-Fi"),
                        "Occupied",
                        "Medium-size tutorial room for discussion-based sessions.",
                        "Good", "AC", false, true, "Whiteboard", true,
                        40, 12, false, true, true,
                        "Operational", true,
                        List.of("2025-12: Chair replacements"),
                        image("room-mab-205")
                ),
                new RoomSeedData(
                        "Mechanical Lab 1", "ENB-010", "ENB", 0, "Laboratory",
                        20.0, 14.0, 280.0, 3014.0,
                        48, 55,
                        List.of("Industrial Tools", "Safety Shower", "Ventilation", "Lab Benches"),
                        "Available",
                        "Mechanical engineering practical laboratory.",
                        "Good", "Non-AC", false, false, "Whiteboard", true,
                        50, 20, true, true, false,
                        "Scheduled", false,
                        List.of("2026-02: Power panel audit", "2025-08: Tool calibration"),
                        image("room-enb-010")
                ),
                new RoomSeedData(
                        "Computer Lab C2", "ENB-214", "ENB", 2, "Computer Lab",
                        14.0, 10.0, 140.0, 1507.0,
                        60, 70,
                        List.of("60 Workstations", "Smart Board", "Projector", "UPS", "Wi-Fi"),
                        "Available",
                        "Programming and data science lab with managed endpoints.",
                        "Excellent", "AC", true, true, "Smart Board", true,
                        62, 30, true, true, true,
                        "Operational", true,
                        List.of("2026-03: RAM upgrade", "2025-11: UPS battery replacement"),
                        image("room-enb-214")
                ),
                new RoomSeedData(
                        "Research Room Delta", "ENB-308", "ENB", 3, "Research Room",
                        9.0, 8.0, 72.0, 775.0,
                        14, 16,
                        List.of("Data Wall", "Private Network", "Whiteboard"),
                        "Under Maintenance",
                        "Postgraduate research collaboration space.",
                        "Fair", "AC", false, true, "Whiteboard", true,
                        16, 8, true, true, true,
                        "Critical", false,
                        List.of("2026-03: Fiber link fault under repair", "2025-10: Ceiling panel replacement"),
                        image("room-enb-308")
                ),
                new RoomSeedData(
                        "Main Reading Hall", "LIB-001", "LIB", 0, "Library",
                        22.0, 16.0, 352.0, 3789.0,
                        220, 250,
                        List.of("Reading Pods", "Catalog Kiosks", "Charging Ports", "Wi-Fi"),
                        "Available",
                        "Open reading space with silent and collaborative zones.",
                        "Excellent", "AC", false, false, "None", true,
                        240, 85, false, true, true,
                        "Operational", false,
                        List.of("2026-01: Lighting retrofit"),
                        image("room-lib-001")
                ),
                new RoomSeedData(
                        "Discussion Room L-12", "LIB-112", "LIB", 1, "Discussion Room",
                        7.0, 6.0, 42.0, 452.0,
                        12, 14,
                        List.of("Smart TV", "Whiteboard", "Wi-Fi"),
                        "Occupied",
                        "Bookable small group discussion room.",
                        "Good", "AC", true, false, "Whiteboard", true,
                        12, 2, false, true, true,
                        "Operational", true,
                        List.of("2025-07: Smart TV replacement"),
                        image("room-lib-112")
                ),
                new RoomSeedData(
                        "Registrar Front Office", "ADB-015", "ADB", 0, "Admin Office",
                        10.0, 8.0, 80.0, 861.0,
                        18, 24,
                        List.of("Service Counters", "Queue Display", "Public Seating"),
                        "Available",
                        "Student-facing registrar service office.",
                        "Good", "AC", false, false, "None", true,
                        24, 8, false, true, true,
                        "Scheduled", false,
                        List.of("2026-02: Public display screen servicing"),
                        image("room-adb-015")
                ),
                new RoomSeedData(
                        "Finance Meeting Room", "ADB-114", "ADB", 1, "Meeting Room",
                        8.0, 6.0, 48.0, 517.0,
                        14, 16,
                        List.of("Video Conferencing", "Projector", "Whiteboard"),
                        "Under Maintenance",
                        "Internal finance and audit meeting room.",
                        "Fair", "AC", false, true, "Whiteboard", true,
                        16, 2, false, true, true,
                        "Scheduled", false,
                        List.of("2026-03: Ceiling leak repair in progress"),
                        image("room-adb-114")
                ),
                new RoomSeedData(
                        "Network Operations Center", "ITC-220", "ITC", 2, "Server Room",
                        11.0, 9.0, 99.0, 1066.0,
                        10, 12,
                        List.of("Rack Cabinets", "24x7 Monitoring", "Cooling", "Fire Suppression"),
                        "Available",
                        "Core network and application infrastructure room.",
                        "Excellent", "AC", false, false, "None", true,
                        8, 4, true, true, false,
                        "Operational", false,
                        List.of("2026-01: Generator failover test", "2025-12: Cooling unit overhaul"),
                        image("room-itc-220")
                ),
                new RoomSeedData(
                        "Software Studio 3", "ITC-312", "ITC", 3, "Computer Lab",
                        12.0, 9.0, 108.0, 1162.0,
                        45, 52,
                        List.of("Workstations", "Smart Board", "Cloud Access", "Wi-Fi"),
                        "Occupied",
                        "Capstone project and software development lab.",
                        "Excellent", "AC", true, true, "Smart Board", true,
                        48, 24, true, true, true,
                        "Operational", true,
                        List.of("2026-02: Access point upgrade"),
                        image("room-itc-312")
                ),
                new RoomSeedData(
                        "Grand Auditorium", "AUD-001", "AUD", 0, "Auditorium",
                        32.0, 24.0, 768.0, 8267.0,
                        720, 780,
                        List.of("Main Stage", "Advanced Lighting", "PA System", "Control Booth"),
                        "Inactive",
                        "Large hall used for convocations and major events.",
                        "Needs Repair", "Non-AC", false, true, "None", false,
                        740, 20, false, true, true,
                        "Critical", false,
                        List.of("2026-03: Acoustic panel replacement planned", "2025-10: Stage floor reinforcement"),
                        image("room-aud-001")
                ),
                new RoomSeedData(
                        "Seminar Hall Aurora", "MAB-118", "MAB", 1, "Seminar Hall",
                        13.0, 10.0, 130.0, 1399.0,
                        90, 110,
                        List.of("Projector", "Hybrid Teaching Setup", "Smart Board"),
                        "Available",
                        "Flexible seminar hall for workshops and guest lectures.",
                        "Excellent", "AC", true, true, "Both", true,
                        95, 30, false, true, true,
                        "Operational", true,
                        List.of("2025-06: Audio mixer upgrade"),
                        image("room-mab-118")
                ),
                new RoomSeedData(
                        "Health Support Room", "MAB-G03", "MAB", 0, "Medical Room",
                        7.0, 5.0, 35.0, 377.0,
                        6, 8,
                        List.of("First Aid Station", "Observation Bed", "Storage Cabinet"),
                        "Available",
                        "Primary on-campus first-aid and health support room.",
                        "Good", "AC", false, false, "None", true,
                        6, 2, false, true, true,
                        "Operational", false,
                        List.of("2026-02: Medical inventory refresh"),
                        image("room-mab-g03")
                ),
                new RoomSeedData(
                        "Department Office - Computing", "ENB-412", "ENB", 4, "Department Office",
                        9.0, 7.0, 63.0, 678.0,
                        12, 16,
                        List.of("Workstations", "File Storage", "Meeting Table"),
                        "Available",
                        "Department administration and faculty coordination office.",
                        "Good", "AC", false, false, "Whiteboard", true,
                        14, 8, false, true, true,
                        "Operational", false,
                        List.of("2025-09: Storage expansion"),
                        image("room-enb-412")
                )
        );
    }

    private static String floorKey(String buildingCode, Integer floorNumber) {
        return buildingCode + "#" + floorNumber;
    }

    private static String image(String seed) {
        return "https://picsum.photos/seed/" + seed + "/1200/800";
    }

        private boolean applyBuildingHoursDefaults(Building building, String code) {
                boolean dirty = false;
                if (building.getOpeningTime() == null) {
                        building.setOpeningTime(defaultBuildingOpeningTime(code));
                        dirty = true;
                }
                if (building.getClosingTime() == null) {
                        building.setClosingTime(defaultBuildingClosingTime(code));
                        dirty = true;
                }
                if (building.getClosedOnWeekends() == null) {
                        building.setClosedOnWeekends(defaultBuildingClosedOnWeekends(code));
                        dirty = true;
                }
                return dirty;
        }

        private boolean applyRoomHoursDefaults(Room room, String buildingCode) {
                boolean dirty = false;
                if (room.getOpeningTime() == null) {
                        room.setOpeningTime(defaultRoomOpeningTime(buildingCode));
                        dirty = true;
                }
                if (room.getClosingTime() == null) {
                        room.setClosingTime(defaultRoomClosingTime(buildingCode));
                        dirty = true;
                }
                if (room.getClosedOnWeekends() == null) {
                        room.setClosedOnWeekends(defaultBuildingClosedOnWeekends(buildingCode));
                        dirty = true;
                }
                return dirty;
        }

        private LocalTime defaultBuildingOpeningTime(String code) {
                return switch (code) {
                        case "LIB" -> LocalTime.of(8, 0);
                        case "AUD" -> LocalTime.of(8, 30);
                        case "ITC" -> LocalTime.of(7, 30);
                        case "ADB" -> LocalTime.of(8, 30);
                        default -> LocalTime.of(8, 0);
                };
        }

        private LocalTime defaultBuildingClosingTime(String code) {
                return switch (code) {
                        case "LIB" -> LocalTime.of(20, 0);
                        case "AUD" -> LocalTime.of(22, 0);
                        case "ITC" -> LocalTime.of(21, 0);
                        case "ADB" -> LocalTime.of(17, 30);
                        default -> LocalTime.of(18, 0);
                };
        }

        private boolean defaultBuildingClosedOnWeekends(String code) {
                return switch (code) {
                        case "LIB", "ADB", "AUD" -> true;
                        default -> false;
                };
        }

        private LocalTime defaultRoomOpeningTime(String buildingCode) {
                return defaultBuildingOpeningTime(buildingCode);
        }

        private LocalTime defaultRoomClosingTime(String buildingCode) {
                return defaultBuildingClosingTime(buildingCode);
        }

    private record BuildingSeedData(
            String name,
            String code,
            String type,
            String campus,
            String location,
            Integer totalFloors,
            String description,
            String status,
            Integer yearEstablished,
            String manager,
            String imageUrl
    ) {
    }

    private record FloorSeedData(
            String buildingCode,
            Integer floorNumber,
            String floorName,
            String description,
            String accessibility,
            String mapUrl
    ) {
    }

    private record RoomSeedData(
            String name,
            String code,
            String buildingCode,
            Integer floorNumber,
            String type,
            Double lengthMeters,
            Double widthMeters,
            Double areaSqMeters,
            Double areaSqFeet,
            Integer seatingCapacity,
            Integer maxOccupancy,
            List<String> facilities,
            String status,
            String description,
            String condition,
            String climateControl,
            Boolean smartClassroomEnabled,
            Boolean projectorAvailable,
            String boardType,
            Boolean internetAvailable,
            Integer chairs,
            Integer tables,
            Boolean labEquipmentAvailable,
            Boolean powerBackupAvailable,
            Boolean accessibilitySupport,
            String maintenanceStatus,
            Boolean bookingAvailable,
            List<String> maintenanceHistory,
            String imageUrl
    ) {
    }
}
