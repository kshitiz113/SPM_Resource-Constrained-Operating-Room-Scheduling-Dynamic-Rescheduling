package com.orscheduler.config;

import com.orscheduler.entity.*;
import com.orscheduler.enums.*;
import com.orscheduler.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OperatingRoomRepository roomRepository;
    private final RoomOperatingHoursRepository hoursRepository;
    private final StaffRepository staffRepository;
    private final QualificationRepository qualificationRepository;
    private final StaffShiftRepository shiftRepository;
    private final EquipmentRepository equipmentRepository;
    private final SurgeryRequestRepository surgeryRequestRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded with {} users. Skipping initial seed.", userRepository.count());
            return;
        }

        log.info("Seeding initial hospital operational data...");

        // 1. Seed Users
        String encodedPass = passwordEncoder.encode("password123");

        User admin = User.builder()
                .username("admin")
                .passwordHash(encodedPass)
                .fullName("System Administrator")
                .email("admin@hospital.org")
                .active(true)
                .build();
        admin.getRoles().add(UserRoleEntity.builder().user(admin).role(UserRole.ADMIN).build());
        admin.getRoles().add(UserRoleEntity.builder().user(admin).role(UserRole.OR_MANAGER).build());
        userRepository.save(admin);

        User manager = User.builder()
                .username("ormanager")
                .passwordHash(encodedPass)
                .fullName("Dr. Robert Sterling")
                .email("robert.sterling@hospital.org")
                .active(true)
                .build();
        manager.getRoles().add(UserRoleEntity.builder().user(manager).role(UserRole.OR_MANAGER).build());
        userRepository.save(manager);

        User scheduler = User.builder()
                .username("scheduler1")
                .passwordHash(encodedPass)
                .fullName("Sarah Jenkins")
                .email("sarah.jenkins@hospital.org")
                .active(true)
                .build();
        scheduler.getRoles().add(UserRoleEntity.builder().user(scheduler).role(UserRole.SCHEDULER).build());
        userRepository.save(scheduler);

        User clinical = User.builder()
                .username("dr.alice")
                .passwordHash(encodedPass)
                .fullName("Dr. Alice Smith")
                .email("alice.smith@hospital.org")
                .active(true)
                .build();
        clinical.getRoles().add(UserRoleEntity.builder().user(clinical).role(UserRole.CLINICAL_STAFF).build());
        userRepository.save(clinical);

        // 2. Seed Qualifications
        Qualification generalSurg = qualificationRepository.save(Qualification.builder().name("General Surgery Certified").category(QualificationCategory.SURGICAL_SPECIALTY).build());
        Qualification orthoCert = qualificationRepository.save(Qualification.builder().name("Orthopedic Trauma Certified").category(QualificationCategory.SURGICAL_SPECIALTY).build());
        Qualification cardioCert = qualificationRepository.save(Qualification.builder().name("Cardiovascular Board Certified").category(QualificationCategory.SURGICAL_SPECIALTY).build());
        Qualification neuroCert = qualificationRepository.save(Qualification.builder().name("Neurosurgical Specialist").category(QualificationCategory.SURGICAL_SPECIALTY).build());
        Qualification pedsAnesth = qualificationRepository.save(Qualification.builder().name("Pediatric Anesthesiology").category(QualificationCategory.ANESTHESIA).build());
        Qualification roboticCert = qualificationRepository.save(Qualification.builder().name("Robotic Surgery Console Operator").category(QualificationCategory.TECHNICAL).build());

        // 3. Seed Operating Rooms
        OperatingRoom or1 = roomRepository.save(OperatingRoom.builder().name("OR-1 (General)").roomType("GENERAL").capacity(1).status(RoomStatus.ACTIVE).description("Wing A, Floor 2").build());
        OperatingRoom or2 = roomRepository.save(OperatingRoom.builder().name("OR-2 (Orthopedic)").roomType("ORTHOPEDIC").capacity(1).status(RoomStatus.ACTIVE).description("Wing A, Floor 2").build());
        OperatingRoom or3 = roomRepository.save(OperatingRoom.builder().name("OR-3 (Cardiac)").roomType("CARDIAC").capacity(1).status(RoomStatus.ACTIVE).description("Wing B, Floor 2").build());
        OperatingRoom or4 = roomRepository.save(OperatingRoom.builder().name("OR-4 (Neuro)").roomType("NEURO").capacity(1).status(RoomStatus.ACTIVE).description("Wing B, Floor 2").build());
        OperatingRoom or5 = roomRepository.save(OperatingRoom.builder().name("OR-5 (Hybrid Robotic)").roomType("HYBRID_ROBOTIC").capacity(1).status(RoomStatus.ACTIVE).description("Wing C, Floor 3").build());

        // Seed Operating Hours (Mon-Fri 07:00 - 19:00 for each room)
        List<OperatingRoom> allRooms = List.of(or1, or2, or3, or4, or5);
        for (OperatingRoom r : allRooms) {
            for (int day = 1; day <= 5; day++) {
                hoursRepository.save(RoomOperatingHours.builder()
                        .room(r)
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(7, 0))
                        .endTime(LocalTime.of(19, 0))
                        .isException(false)
                        .build());
            }
        }

        // 4. Seed Staff
        Staff s1 = staffRepository.save(Staff.builder().fullName("Dr. James Wilson").employeeId("EMP-SURG-01").staffType(StaffType.SURGEON).phone("555-0101").email("jwilson@hospital.org").active(true).build());
        Staff s2 = staffRepository.save(Staff.builder().fullName("Dr. Eleanor Vance").employeeId("EMP-SURG-02").staffType(StaffType.SURGEON).phone("555-0102").email("evance@hospital.org").active(true).build());
        Staff s3 = staffRepository.save(Staff.builder().fullName("Dr. Marcus Chen").employeeId("EMP-SURG-03").staffType(StaffType.SURGEON).phone("555-0103").email("mchen@hospital.org").active(true).build());
        Staff s4 = staffRepository.save(Staff.builder().fullName("Dr. Aisha Al-Mansoor").employeeId("EMP-ANES-01").staffType(StaffType.ANESTHETIST).phone("555-0201").email("aalmansoor@hospital.org").active(true).build());
        Staff s5 = staffRepository.save(Staff.builder().fullName("Dr. Thomas Becker").employeeId("EMP-ANES-02").staffType(StaffType.ANESTHETIST).phone("555-0202").email("tbecker@hospital.org").active(true).build());
        Staff s6 = staffRepository.save(Staff.builder().fullName("Nurse Karen Miller").employeeId("EMP-NURS-01").staffType(StaffType.NURSE).phone("555-0301").email("kmiller@hospital.org").active(true).build());
        Staff s7 = staffRepository.save(Staff.builder().fullName("Nurse David Ross").employeeId("EMP-NURS-02").staffType(StaffType.NURSE).phone("555-0302").email("dross@hospital.org").active(true).build());
        Staff s8 = staffRepository.save(Staff.builder().fullName("Tech Liam O'Connor").employeeId("EMP-TECH-01").staffType(StaffType.TECHNICIAN).phone("555-0401").email("loconnor@hospital.org").active(true).build());

        // Assign Staff Qualifications
        s1.getQualifications().add(StaffQualification.builder().staff(s1).qualification(generalSurg).build());
        s1.getQualifications().add(StaffQualification.builder().staff(s1).qualification(roboticCert).build());
        staffRepository.save(s1);

        s2.getQualifications().add(StaffQualification.builder().staff(s2).qualification(orthoCert).build());
        staffRepository.save(s2);

        s3.getQualifications().add(StaffQualification.builder().staff(s3).qualification(cardioCert).build());
        staffRepository.save(s3);

        s4.getQualifications().add(StaffQualification.builder().staff(s4).qualification(pedsAnesth).build());
        staffRepository.save(s4);

        // Seed Staff Shifts (Mon-Fri 07:00 - 19:00 for each staff)
        List<Staff> staffList = List.of(s1, s2, s3, s4, s5, s6, s7, s8);
        for (Staff st : staffList) {
            for (int day = 1; day <= 5; day++) {
                shiftRepository.save(StaffShift.builder()
                        .staff(st)
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(7, 0))
                        .endTime(LocalTime.of(19, 0))
                        .isRecurring(true)
                        .isLeave(false)
                        .build());
            }
        }

        // 5. Seed Equipment
        Equipment eq1 = equipmentRepository.save(Equipment.builder().name("Mobile C-Arm Fluoroscope A").equipmentType("IMAGING").serialNumber("FL-CARM-001").status(EquipmentStatus.AVAILABLE).description("Full digital flat-panel fluoroscopy system").build());
        Equipment eq2 = equipmentRepository.save(Equipment.builder().name("Mobile C-Arm Fluoroscope B").equipmentType("IMAGING").serialNumber("FL-CARM-002").status(EquipmentStatus.AVAILABLE).description("High-definition surgical imaging unit").build());
        Equipment eq3 = equipmentRepository.save(Equipment.builder().name("DaVinci Xi Surgical Robot").equipmentType("ROBOTIC").serialNumber("DV-XI-9001").status(EquipmentStatus.AVAILABLE).description("Multi-quadrant robotic surgery console & patient cart").build());
        Equipment eq4 = equipmentRepository.save(Equipment.builder().name("Cardiopulmonary Bypass Pump").equipmentType("PERFUSION").serialNumber("CPB-HEART-01").status(EquipmentStatus.AVAILABLE).description("Dual-roller heart-lung machine").build());
        Equipment eq5 = equipmentRepository.save(Equipment.builder().name("Harmonic Scalpel Generator").equipmentType("ELECTROSURGICAL").serialNumber("HS-GEN-301").status(EquipmentStatus.AVAILABLE).description("Ultrasonic tissue dissection generator").build());
        Equipment eq6 = equipmentRepository.save(Equipment.builder().name("Cell Saver Autotransfusion System").equipmentType("HEMATOLOGY").serialNumber("CS-AUTO-101").status(EquipmentStatus.AVAILABLE).description("Intraoperative blood recovery system").build());

        // 6. Seed Sample Surgery Requests for demonstration
        LocalDate today = LocalDate.now();
        while (today.getDayOfWeek().getValue() > 5) {
            today = today.plusDays(1); // operating rooms run Mon-Fri
        }

        SurgeryRequest req1 = SurgeryRequest.builder()
                .surgeryCode("SURG-101")
                .procedureName("Laparoscopic Cholecystectomy")
                .priority(Priority.ELECTIVE)
                .status(SurgeryStatus.REQUESTED)
                .estimatedDurationMinutes(90)
                .preparationTimeMinutes(20)
                .cleaningTimeMinutes(20)
                .preferredRoom(or1)
                .earliestStart(today.atTime(8, 0))
                .schedulingDeadline(today.atTime(18, 0))
                .notes("Patient: Arthur Pendelton (PT-90812). Routine symptomatic gallstones. Low surgical complexity.")
                .requiredStaff(new ArrayList<>())
                .requiredEquipment(new ArrayList<>())
                .requiredQualifications(new ArrayList<>())
                .build();
        req1.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req1).staffRole(StaffType.SURGEON).specificStaff(s1).isMandatory(true).build());
        req1.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req1).staffRole(StaffType.ANESTHETIST).specificStaff(s4).isMandatory(true).build());
        req1.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req1).staffRole(StaffType.NURSE).isMandatory(true).build());
        req1.getRequiredEquipment().add(SurgeryRequiredEquipment.builder().surgeryRequest(req1).equipment(eq5).isMandatory(true).build());
        req1.getRequiredQualifications().add(SurgeryRequiredQualification.builder().surgeryRequest(req1).qualification(generalSurg).build());
        surgeryRequestRepository.save(req1);

        SurgeryRequest req2 = SurgeryRequest.builder()
                .surgeryCode("SURG-102")
                .procedureName("Total Knee Arthroplasty (Right)")
                .priority(Priority.URGENT)
                .status(SurgeryStatus.REQUESTED)
                .estimatedDurationMinutes(120)
                .preparationTimeMinutes(30)
                .cleaningTimeMinutes(30)
                .preferredRoom(or2)
                .earliestStart(today.atTime(8, 0))
                .schedulingDeadline(today.atTime(18, 0))
                .notes("Patient: Maria Gonzalez (PT-78210). Severe tricompartmental osteoarthritis. Needs C-Arm imaging.")
                .requiredStaff(new ArrayList<>())
                .requiredEquipment(new ArrayList<>())
                .requiredQualifications(new ArrayList<>())
                .build();
        req2.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req2).staffRole(StaffType.SURGEON).specificStaff(s2).isMandatory(true).build());
        req2.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req2).staffRole(StaffType.ANESTHETIST).specificStaff(s5).isMandatory(true).build());
        req2.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req2).staffRole(StaffType.NURSE).isMandatory(true).build());
        req2.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req2).staffRole(StaffType.TECHNICIAN).isMandatory(false).build());
        req2.getRequiredEquipment().add(SurgeryRequiredEquipment.builder().surgeryRequest(req2).equipment(eq1).isMandatory(true).build());
        req2.getRequiredQualifications().add(SurgeryRequiredQualification.builder().surgeryRequest(req2).qualification(orthoCert).build());
        surgeryRequestRepository.save(req2);

        SurgeryRequest req3 = SurgeryRequest.builder()
                .surgeryCode("SURG-103")
                .procedureName("Coronary Artery Bypass Graft (CABG x3)")
                .priority(Priority.EMERGENCY)
                .status(SurgeryStatus.REQUESTED)
                .estimatedDurationMinutes(240)
                .preparationTimeMinutes(40)
                .cleaningTimeMinutes(40)
                .preferredRoom(or3)
                .earliestStart(today.atTime(7, 30))
                .schedulingDeadline(today.atTime(19, 0))
                .notes("Patient: Jonathan Hayes (PT-45199). Critical three-vessel disease. Perfusionist & CPB required.")
                .requiredStaff(new ArrayList<>())
                .requiredEquipment(new ArrayList<>())
                .requiredQualifications(new ArrayList<>())
                .build();
        req3.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req3).staffRole(StaffType.SURGEON).specificStaff(s3).isMandatory(true).build());
        req3.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req3).staffRole(StaffType.ANESTHETIST).specificStaff(s4).isMandatory(true).build());
        req3.getRequiredStaff().add(SurgeryRequiredStaff.builder().surgeryRequest(req3).staffRole(StaffType.NURSE).isMandatory(true).build());
        req3.getRequiredEquipment().add(SurgeryRequiredEquipment.builder().surgeryRequest(req3).equipment(eq4).isMandatory(true).build());
        req3.getRequiredEquipment().add(SurgeryRequiredEquipment.builder().surgeryRequest(req3).equipment(eq6).isMandatory(true).build());
        req3.getRequiredQualifications().add(SurgeryRequiredQualification.builder().surgeryRequest(req3).qualification(cardioCert).build());
        surgeryRequestRepository.save(req3);

        log.info("Hospital operational dataset seeded successfully (4 users, 5 OR rooms, 8 staff, 6 equipment units, 3 active surgery requests).");
    }
}
