-- V2__seed_data.sql
-- Seed data for Operating Room Scheduling System

-- ============================================================
-- USERS & ROLES
-- Passwords are all BCrypt hash for "password123":
-- $2a$10$7v.G97E7M5x67N6D1P0KLeO5gH4sA9iN6B5B9kX/U0T.e9s5Yh0Ea
-- ============================================================
INSERT INTO users (id, username, password_hash, full_name, email, active, created_at, updated_at) VALUES
(1, 'admin', '$2a$10$7v.G97E7M5x67N6D1P0KLeO5gH4sA9iN6B5B9kX/U0T.e9s5Yh0Ea', 'System Administrator', 'admin@hospital.demo', true, NOW(), NOW()),
(2, 'ormanager', '$2a$10$7v.G97E7M5x67N6D1P0KLeO5gH4sA9iN6B5B9kX/U0T.e9s5Yh0Ea', 'Dr. Karen Vance (OR Director)', 'karen.vance@hospital.demo', true, NOW(), NOW()),
(3, 'scheduler1', '$2a$10$7v.G97E7M5x67N6D1P0KLeO5gH4sA9iN6B5B9kX/U0T.e9s5Yh0Ea', 'Michael Chang (Lead Scheduler)', 'michael.chang@hospital.demo', true, NOW(), NOW()),
(4, 'dr.alice', '$2a$10$7v.G97E7M5x67N6D1P0KLeO5gH4sA9iN6B5B9kX/U0T.e9s5Yh0Ea', 'Dr. Alice Johnson (Lead Surgeon)', 'alice.johnson@hospital.demo', true, NOW(), NOW());

INSERT INTO user_roles (user_id, role) VALUES
(1, 'ADMIN'),
(2, 'OR_MANAGER'),
(3, 'SCHEDULER'),
(4, 'CLINICAL_STAFF');

-- ============================================================
-- QUALIFICATIONS
-- ============================================================
INSERT INTO qualifications (id, name, category, description) VALUES
(1, 'General Surgery Board Certified', 'SURGICAL_SPECIALTY', 'Board certification in general operative surgical procedures'),
(2, 'Orthopedic Surgery Board Certified', 'SURGICAL_SPECIALTY', 'Board certification in orthopedic and joint replacement procedures'),
(3, 'Cardiothoracic Surgery Certified', 'SURGICAL_SPECIALTY', 'Specialized cardiovascular operative credential'),
(4, 'Neurosurgery Board Certified', 'SURGICAL_SPECIALTY', 'Certified in brain and neurological surgery'),
(5, 'General Anesthesiology Certified', 'ANESTHESIA', 'Certification in general anesthesia and airway management'),
(6, 'Cardiac Anesthesia Fellow', 'ANESTHESIA', 'Subspecialty qualification for bypass and cardiothoracic anesthesia'),
(7, 'Certified Perioperative Nurse (CNOR)', 'NURSING', 'Accredited perioperative nursing credential'),
(8, 'Scrub Nurse Certified', 'NURSING', 'Sterile field instrumentation specialist'),
(9, 'Surgical Technologist Certified (CST)', 'TECHNICAL', 'Certified surgical equipment and technology handling');

-- ============================================================
-- OPERATING ROOMS
-- ============================================================
INSERT INTO operating_rooms (id, name, room_type, status, capacity, description, created_at, updated_at) VALUES
(1, 'OR-1 (General)', 'GENERAL', 'ACTIVE', 1, 'Primary general surgery suite equipped for laparoscopic and open surgery', NOW(), NOW()),
(2, 'OR-2 (Orthopedic)', 'ORTHOPEDIC', 'ACTIVE', 1, 'Orthopedic suite with laminar airflow and lead shielding for fluoroscopy', NOW(), NOW()),
(3, 'OR-3 (Cardiac Hybrid)', 'CARDIOVASCULAR', 'ACTIVE', 1, 'Cardiovascular hybrid operating theater with perfusion hookups', NOW(), NOW()),
(4, 'OR-4 (Neurosurgery)', 'NEUROSURGERY', 'ACTIVE', 1, 'Dedicated neurosurgical suite with Zeiss surgical microscope', NOW(), NOW()),
(5, 'OR-5 (Ambulatory)', 'AMBULATORY', 'ACTIVE', 1, 'Fast-turnaround daycare and minimally invasive procedural room', NOW(), NOW());

-- Operating Hours (Monday=1 through Friday=5, 07:00 to 19:00)
INSERT INTO room_operating_hours (room_id, day_of_week, start_time, end_time, is_exception) VALUES
(1, 1, '07:00:00', '19:00:00', false),
(1, 2, '07:00:00', '19:00:00', false),
(1, 3, '07:00:00', '19:00:00', false),
(1, 4, '07:00:00', '19:00:00', false),
(1, 5, '07:00:00', '19:00:00', false),
(2, 1, '07:00:00', '19:00:00', false),
(2, 2, '07:00:00', '19:00:00', false),
(2, 3, '07:00:00', '19:00:00', false),
(2, 4, '07:00:00', '19:00:00', false),
(2, 5, '07:00:00', '19:00:00', false),
(3, 1, '07:00:00', '19:00:00', false),
(3, 2, '07:00:00', '19:00:00', false),
(3, 3, '07:00:00', '19:00:00', false),
(3, 4, '07:00:00', '19:00:00', false),
(3, 5, '07:00:00', '19:00:00', false),
(4, 1, '07:00:00', '19:00:00', false),
(4, 2, '07:00:00', '19:00:00', false),
(4, 3, '07:00:00', '19:00:00', false),
(4, 4, '07:00:00', '19:00:00', false),
(4, 5, '07:00:00', '19:00:00', false),
(5, 1, '07:00:00', '19:00:00', false),
(5, 2, '07:00:00', '19:00:00', false),
(5, 3, '07:00:00', '19:00:00', false),
(5, 4, '07:00:00', '19:00:00', false),
(5, 5, '07:00:00', '19:00:00', false);

-- ============================================================
-- STAFF
-- ============================================================
INSERT INTO staff (id, employee_id, full_name, staff_type, email, phone, active, created_at, updated_at) VALUES
(1, 'SURG-001', 'Dr. Alice Johnson', 'SURGEON', 'alice.johnson@hospital.demo', '555-0101', true, NOW(), NOW()),
(2, 'SURG-002', 'Dr. David Smith', 'SURGEON', 'david.smith@hospital.demo', '555-0102', true, NOW(), NOW()),
(3, 'SURG-003', 'Dr. Elena Rostova', 'SURGEON', 'elena.rostova@hospital.demo', '555-0103', true, NOW(), NOW()),
(4, 'SURG-004', 'Dr. Marcus Brody', 'SURGEON', 'marcus.brody@hospital.demo', '555-0104', true, NOW(), NOW()),
(5, 'ANES-001', 'Dr. Bob Chen', 'ANESTHETIST', 'bob.chen@hospital.demo', '555-0201', true, NOW(), NOW()),
(6, 'ANES-002', 'Dr. Sarah Miller', 'ANESTHETIST', 'sarah.miller@hospital.demo', '555-0202', true, NOW(), NOW()),
(7, 'NURS-001', 'Nurse Emily Clark', 'NURSE', 'emily.clark@hospital.demo', '555-0301', true, NOW(), NOW()),
(8, 'NURS-002', 'Nurse James Wilson', 'NURSE', 'james.wilson@hospital.demo', '555-0302', true, NOW(), NOW()),
(9, 'NURS-003', 'Nurse Chloe Bennett', 'NURSE', 'chloe.bennett@hospital.demo', '555-0303', true, NOW(), NOW()),
(10, 'TECH-001', 'Tech Sam Taylor', 'TECHNICIAN', 'sam.taylor@hospital.demo', '555-0401', true, NOW(), NOW());

-- Staff Qualifications
INSERT INTO staff_qualifications (staff_id, qualification_id, certified_date, expiry_date) VALUES
(1, 1, '2020-01-01', '2030-01-01'),
(2, 2, '2019-06-01', '2029-06-01'),
(3, 3, '2018-03-15', '2028-03-15'),
(4, 4, '2021-08-20', '2031-08-20'),
(5, 5, '2017-05-10', '2027-05-10'),
(5, 6, '2019-09-01', '2029-09-01'),
(6, 5, '2020-11-15', '2030-11-15'),
(7, 7, '2021-02-01', '2031-02-01'),
(7, 8, '2021-02-01', '2031-02-01'),
(8, 7, '2022-04-10', '2032-04-10'),
(8, 8, '2022-04-10', '2032-04-10'),
(9, 7, '2023-01-15', '2033-01-15'),
(10, 9, '2020-07-01', '2030-07-01');

-- Staff Shifts (Day 1 to 5, 07:00 to 19:30 coverage)
INSERT INTO staff_shifts (staff_id, day_of_week, start_time, end_time, is_recurring, is_leave) VALUES
(1, 1, '07:00:00', '19:00:00', true, false),
(1, 2, '07:00:00', '19:00:00', true, false),
(1, 3, '07:00:00', '19:00:00', true, false),
(1, 4, '07:00:00', '19:00:00', true, false),
(1, 5, '07:00:00', '19:00:00', true, false),
(2, 1, '07:00:00', '19:00:00', true, false),
(2, 2, '07:00:00', '19:00:00', true, false),
(2, 3, '07:00:00', '19:00:00', true, false),
(2, 4, '07:00:00', '19:00:00', true, false),
(2, 5, '07:00:00', '19:00:00', true, false),
(3, 1, '07:00:00', '19:00:00', true, false),
(3, 2, '07:00:00', '19:00:00', true, false),
(3, 3, '07:00:00', '19:00:00', true, false),
(3, 4, '07:00:00', '19:00:00', true, false),
(3, 5, '07:00:00', '19:00:00', true, false),
(4, 1, '07:00:00', '19:00:00', true, false),
(4, 2, '07:00:00', '19:00:00', true, false),
(4, 3, '07:00:00', '19:00:00', true, false),
(4, 4, '07:00:00', '19:00:00', true, false),
(4, 5, '07:00:00', '19:00:00', true, false),
(5, 1, '07:00:00', '19:00:00', true, false),
(5, 2, '07:00:00', '19:00:00', true, false),
(5, 3, '07:00:00', '19:00:00', true, false),
(5, 4, '07:00:00', '19:00:00', true, false),
(5, 5, '07:00:00', '19:00:00', true, false),
(6, 1, '07:00:00', '19:00:00', true, false),
(6, 2, '07:00:00', '19:00:00', true, false),
(6, 3, '07:00:00', '19:00:00', true, false),
(6, 4, '07:00:00', '19:00:00', true, false),
(6, 5, '07:00:00', '19:00:00', true, false),
(7, 1, '07:00:00', '19:00:00', true, false),
(7, 2, '07:00:00', '19:00:00', true, false),
(7, 3, '07:00:00', '19:00:00', true, false),
(7, 4, '07:00:00', '19:00:00', true, false),
(7, 5, '07:00:00', '19:00:00', true, false),
(8, 1, '07:00:00', '19:00:00', true, false),
(8, 2, '07:00:00', '19:00:00', true, false),
(8, 3, '07:00:00', '19:00:00', true, false),
(8, 4, '07:00:00', '19:00:00', true, false),
(8, 5, '07:00:00', '19:00:00', true, false),
(9, 1, '07:00:00', '19:00:00', true, false),
(9, 2, '07:00:00', '19:00:00', true, false),
(9, 3, '07:00:00', '19:00:00', true, false),
(9, 4, '07:00:00', '19:00:00', true, false),
(9, 5, '07:00:00', '19:00:00', true, false),
(10, 1, '07:00:00', '19:00:00', true, false),
(10, 2, '07:00:00', '19:00:00', true, false),
(10, 3, '07:00:00', '19:00:00', true, false),
(10, 4, '07:00:00', '19:00:00', true, false),
(10, 5, '07:00:00', '19:00:00', true, false);

-- ============================================================
-- EQUIPMENT
-- ============================================================
INSERT INTO equipment (id, name, equipment_type, serial_number, status, description, created_at, updated_at) VALUES
(1, 'Laparoscopic Tower Alpha', 'LAPAROSCOPY', 'LAP-SN-1001', 'AVAILABLE', '4K High Definition Karl Storz laparoscopic imaging tower', NOW(), NOW()),
(2, 'Laparoscopic Tower Beta', 'LAPAROSCOPY', 'LAP-SN-1002', 'AVAILABLE', '4K High Definition Karl Storz laparoscopic imaging tower', NOW(), NOW()),
(3, 'C-Arm Fluoroscopy System', 'IMAGING', 'CARM-SN-2001', 'AVAILABLE', 'Siemens Cios Alpha mobile C-arm with flat-panel detector', NOW(), NOW()),
(4, 'Heart-Lung Machine Terumo', 'PERFUSION', 'HLM-SN-3001', 'AVAILABLE', 'Advanced perfusion system for cardiopulmonary bypass support', NOW(), NOW()),
(5, 'Zeiss Kinevo 900 Microscope', 'MICROSCOPE', 'MIC-SN-4001', 'AVAILABLE', 'Robotic visualization system for neurosurgical microsurgery', NOW(), NOW()),
(6, 'Harmonic Scalpel Generator', 'ELECTROSURGICAL', 'HS-SN-5001', 'AVAILABLE', 'Ethicon ultrasonic cutting and coagulating generator', NOW(), NOW()),
(7, 'Anesthesia Workstation 1', 'ANESTHESIA_MACHINE', 'ANES-SN-6001', 'AVAILABLE', 'Dräger Perseus A500 anesthesia workstation', NOW(), NOW()),
(8, 'Anesthesia Workstation 2', 'ANESTHESIA_MACHINE', 'ANES-SN-6002', 'AVAILABLE', 'Dräger Perseus A500 anesthesia workstation', NOW(), NOW());

-- Permanent equipment associations
INSERT INTO room_equipment (room_id, equipment_id, is_permanent) VALUES
(1, 1, true),
(2, 3, true),
(3, 4, true),
(4, 5, true);

-- ============================================================
-- SURGERY REQUESTS (Initial Demonstration Requests)
-- ============================================================
INSERT INTO surgery_requests (id, surgery_code, procedure_name, priority, status, estimated_duration_minutes, preparation_time_minutes, cleaning_time_minutes, earliest_start, scheduling_deadline, requested_at, preferred_room_id, preferred_surgeon_id, notes, created_at, updated_at) VALUES
(1, 'SURG-2026-0001', 'Laparoscopic Cholecystectomy', 'URGENT', 'REQUESTED', 90, 15, 20, '2026-10-20 07:00:00', '2026-10-20 18:00:00', '2026-10-19 08:30:00', 1, 1, 'Symptomatic cholelithiasis, standard laparoscopic approach', NOW(), NOW()),
(2, 'SURG-2026-0002', 'Total Knee Arthroplasty (Right)', 'ELECTIVE', 'REQUESTED', 120, 20, 20, '2026-10-20 07:00:00', '2026-10-20 18:00:00', '2026-10-19 09:15:00', 2, 2, 'Severe osteoarthritis, uncemented joint replacement', NOW(), NOW()),
(3, 'SURG-2026-0003', 'Coronary Artery Bypass Graft (CABG x3)', 'URGENT', 'REQUESTED', 240, 30, 30, '2026-10-20 07:00:00', '2026-10-20 18:00:00', '2026-10-19 10:00:00', 3, 3, 'Triple vessel coronary disease, full sternotomy with bypass', NOW(), NOW()),
(4, 'SURG-2026-0004', 'Inguinal Hernia Mesh Repair', 'ELECTIVE', 'REQUESTED', 60, 15, 15, '2026-10-20 07:00:00', '2026-10-20 18:00:00', '2026-10-19 11:30:00', 1, 1, 'Unilateral primary direct hernia repair', NOW(), NOW()),
(5, 'SURG-2026-0005', 'Craniotomy for Tumor Resection', 'URGENT', 'REQUESTED', 180, 25, 25, '2026-10-20 07:00:00', '2026-10-20 18:00:00', '2026-10-19 12:00:00', 4, 4, 'Left frontal parietal glioma resection under microscope', NOW(), NOW());

-- Surgery Staff Requirements
INSERT INTO surgery_required_staff (surgery_request_id, staff_role, specific_staff_id, is_mandatory) VALUES
(1, 'SURGEON', 1, true),
(1, 'ANESTHETIST', 5, true),
(1, 'NURSE', 7, true),
(2, 'SURGEON', 2, true),
(2, 'ANESTHETIST', 6, true),
(2, 'NURSE', 8, true),
(3, 'SURGEON', 3, true),
(3, 'ANESTHETIST', 5, true),
(3, 'NURSE', 9, true),
(3, 'TECHNICIAN', 10, true),
(4, 'SURGEON', 1, true),
(4, 'ANESTHETIST', 6, true),
(4, 'NURSE', 7, true),
(5, 'SURGEON', 4, true),
(5, 'ANESTHETIST', 5, true),
(5, 'NURSE', 8, true);

-- Surgery Equipment Requirements
INSERT INTO surgery_required_equipment (surgery_request_id, equipment_id, is_mandatory) VALUES
(1, 1, true),
(1, 6, false),
(2, 3, true),
(3, 4, true),
(5, 5, true);

-- Surgery Qualification Requirements
INSERT INTO surgery_required_qualifications (surgery_request_id, qualification_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1),
(5, 4);

-- Reset sequence IDs
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('qualifications_id_seq', (SELECT MAX(id) FROM qualifications));
SELECT setval('operating_rooms_id_seq', (SELECT MAX(id) FROM operating_rooms));
SELECT setval('room_operating_hours_id_seq', (SELECT MAX(id) FROM room_operating_hours));
SELECT setval('staff_id_seq', (SELECT MAX(id) FROM staff));
SELECT setval('staff_qualifications_id_seq', (SELECT MAX(id) FROM staff_qualifications));
SELECT setval('staff_shifts_id_seq', (SELECT MAX(id) FROM staff_shifts));
SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));
SELECT setval('surgery_requests_id_seq', (SELECT MAX(id) FROM surgery_requests));
SELECT setval('surgery_required_staff_id_seq', (SELECT MAX(id) FROM surgery_required_staff));
SELECT setval('surgery_required_equipment_id_seq', (SELECT MAX(id) FROM surgery_required_equipment));
SELECT setval('surgery_required_qualifications_id_seq', (SELECT MAX(id) FROM surgery_required_qualifications));
