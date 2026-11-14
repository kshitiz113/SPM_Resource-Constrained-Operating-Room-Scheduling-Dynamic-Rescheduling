-- V1__initial_schema.sql
-- Operating Room Scheduling System - Initial Database Schema

-- ============================================================
-- USERS AND ROLES
-- ============================================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(30) NOT NULL,
    UNIQUE (user_id, role)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- ============================================================
-- QUALIFICATIONS
-- ============================================================
CREATE TABLE qualifications (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    VARCHAR(50)  NOT NULL,
    description TEXT
);

CREATE INDEX idx_qualifications_category ON qualifications(category);

-- ============================================================
-- OPERATING ROOMS
-- ============================================================
CREATE TABLE operating_rooms (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    room_type   VARCHAR(50)  NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    capacity    INTEGER      NOT NULL DEFAULT 1,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_status ON operating_rooms(status);

CREATE TABLE room_operating_hours (
    id             BIGSERIAL PRIMARY KEY,
    room_id        BIGINT    NOT NULL REFERENCES operating_rooms(id) ON DELETE CASCADE,
    day_of_week    INTEGER   NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time     TIME      NOT NULL,
    end_time       TIME      NOT NULL,
    effective_from DATE,
    effective_to   DATE,
    is_exception   BOOLEAN   NOT NULL DEFAULT FALSE,
    CHECK (start_time < end_time)
);

CREATE INDEX idx_room_hours_room ON room_operating_hours(room_id);
CREATE INDEX idx_room_hours_day ON room_operating_hours(day_of_week);

-- ============================================================
-- STAFF
-- ============================================================
CREATE TABLE staff (
    id          BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(30)  NOT NULL UNIQUE,
    full_name   VARCHAR(100) NOT NULL,
    staff_type  VARCHAR(30)  NOT NULL,
    email       VARCHAR(100),
    phone       VARCHAR(30),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_type ON staff(staff_type);
CREATE INDEX idx_staff_active ON staff(active);

CREATE TABLE staff_qualifications (
    id               BIGSERIAL PRIMARY KEY,
    staff_id         BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    qualification_id BIGINT NOT NULL REFERENCES qualifications(id) ON DELETE CASCADE,
    certified_date   DATE,
    expiry_date      DATE,
    UNIQUE (staff_id, qualification_id)
);

CREATE INDEX idx_staff_quals_staff ON staff_qualifications(staff_id);
CREATE INDEX idx_staff_quals_qual ON staff_qualifications(qualification_id);

CREATE TABLE staff_shifts (
    id             BIGSERIAL PRIMARY KEY,
    staff_id       BIGINT      NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week    INTEGER     CHECK (day_of_week BETWEEN 1 AND 7),
    start_time     TIME        NOT NULL,
    end_time       TIME        NOT NULL,
    effective_from DATE,
    effective_to   DATE,
    is_recurring   BOOLEAN     NOT NULL DEFAULT TRUE,
    is_leave       BOOLEAN     NOT NULL DEFAULT FALSE,
    leave_reason   VARCHAR(200),
    CHECK (start_time < end_time)
);

CREATE INDEX idx_shifts_staff ON staff_shifts(staff_id);
CREATE INDEX idx_shifts_recurring ON staff_shifts(is_recurring);
CREATE INDEX idx_shifts_dates ON staff_shifts(effective_from, effective_to);

-- ============================================================
-- EQUIPMENT
-- ============================================================
CREATE TABLE equipment (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(50)  NOT NULL,
    serial_number VARCHAR(50)  NOT NULL UNIQUE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    description   TEXT,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_type ON equipment(equipment_type);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_serial ON equipment(serial_number);

CREATE TABLE equipment_availability (
    id               BIGSERIAL PRIMARY KEY,
    equipment_id     BIGINT      NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    unavailable_from TIMESTAMP   NOT NULL,
    unavailable_to   TIMESTAMP   NOT NULL,
    reason           VARCHAR(200),
    CHECK (unavailable_from < unavailable_to)
);

CREATE INDEX idx_equip_avail_equipment ON equipment_availability(equipment_id);
CREATE INDEX idx_equip_avail_dates ON equipment_availability(unavailable_from, unavailable_to);

CREATE TABLE room_equipment (
    id           BIGSERIAL PRIMARY KEY,
    room_id      BIGINT  NOT NULL REFERENCES operating_rooms(id) ON DELETE CASCADE,
    equipment_id BIGINT  NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (room_id, equipment_id)
);

-- ============================================================
-- SURGERY REQUESTS
-- ============================================================
CREATE TABLE surgery_requests (
    id                         BIGSERIAL PRIMARY KEY,
    surgery_code               VARCHAR(30)  NOT NULL UNIQUE,
    procedure_name             VARCHAR(200) NOT NULL,
    priority                   VARCHAR(20)  NOT NULL DEFAULT 'ELECTIVE',
    status                     VARCHAR(20)  NOT NULL DEFAULT 'REQUESTED',
    estimated_duration_minutes INTEGER      NOT NULL CHECK (estimated_duration_minutes > 0),
    preparation_time_minutes   INTEGER      NOT NULL DEFAULT 15 CHECK (preparation_time_minutes >= 0),
    cleaning_time_minutes      INTEGER      NOT NULL DEFAULT 20 CHECK (cleaning_time_minutes >= 0),
    earliest_start             TIMESTAMP,
    scheduling_deadline        TIMESTAMP,
    requested_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
    preferred_room_id          BIGINT       REFERENCES operating_rooms(id),
    preferred_surgeon_id       BIGINT       REFERENCES staff(id),
    notes                      TEXT,
    created_at                 TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surgery_code ON surgery_requests(surgery_code);
CREATE INDEX idx_surgery_priority ON surgery_requests(priority);
CREATE INDEX idx_surgery_status ON surgery_requests(status);
CREATE INDEX idx_surgery_deadline ON surgery_requests(scheduling_deadline);
CREATE INDEX idx_surgery_requested ON surgery_requests(requested_at);

CREATE TABLE surgery_required_staff (
    id                 BIGSERIAL PRIMARY KEY,
    surgery_request_id BIGINT      NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
    staff_role         VARCHAR(30) NOT NULL,
    specific_staff_id  BIGINT      REFERENCES staff(id),
    is_mandatory       BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_surg_staff_request ON surgery_required_staff(surgery_request_id);

CREATE TABLE surgery_required_equipment (
    id                 BIGSERIAL PRIMARY KEY,
    surgery_request_id BIGINT  NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
    equipment_id       BIGINT  NOT NULL REFERENCES equipment(id),
    is_mandatory       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_surg_equip_request ON surgery_required_equipment(surgery_request_id);

CREATE TABLE surgery_required_qualifications (
    id                 BIGSERIAL PRIMARY KEY,
    surgery_request_id BIGINT NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
    qualification_id   BIGINT NOT NULL REFERENCES qualifications(id)
);

CREATE INDEX idx_surg_qual_request ON surgery_required_qualifications(surgery_request_id);

-- ============================================================
-- SCHEDULE VERSIONS AND ENTRIES
-- ============================================================
CREATE TABLE schedule_versions (
    id                  BIGSERIAL PRIMARY KEY,
    version_label       VARCHAR(50)    NOT NULL UNIQUE,
    schedule_date       DATE           NOT NULL,
    status              VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
    created_by          BIGINT         REFERENCES users(id),
    approved_by         BIGINT         REFERENCES users(id),
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    approved_at         TIMESTAMP,
    published_at        TIMESTAMP,
    parent_version_id   BIGINT         REFERENCES schedule_versions(id),
    disruption_id       BIGINT,
    version_number      INTEGER        NOT NULL DEFAULT 1,
    total_score         DECIMAL(10, 2),
    generation_notes    TEXT
);

CREATE INDEX idx_schedule_date_status ON schedule_versions(schedule_date, status);
CREATE INDEX idx_schedule_parent ON schedule_versions(parent_version_id);

CREATE TABLE schedule_entries (
    id                   BIGSERIAL PRIMARY KEY,
    schedule_version_id  BIGINT    NOT NULL REFERENCES schedule_versions(id) ON DELETE CASCADE,
    surgery_request_id   BIGINT    NOT NULL REFERENCES surgery_requests(id),
    operating_room_id    BIGINT    NOT NULL REFERENCES operating_rooms(id),
    planned_start        TIMESTAMP NOT NULL,
    planned_end          TIMESTAMP NOT NULL,
    prep_start           TIMESTAMP NOT NULL,
    cleanup_end          TIMESTAMP NOT NULL,
    entry_status         VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    is_locked            BOOLEAN   NOT NULL DEFAULT FALSE,
    actual_start         TIMESTAMP,
    actual_end           TIMESTAMP,
    notes                TEXT,
    CHECK (prep_start <= planned_start),
    CHECK (planned_start < planned_end),
    CHECK (planned_end <= cleanup_end)
);

CREATE INDEX idx_entry_version ON schedule_entries(schedule_version_id);
CREATE INDEX idx_entry_room_time ON schedule_entries(operating_room_id, planned_start, planned_end);
CREATE INDEX idx_entry_surgery ON schedule_entries(surgery_request_id);
CREATE INDEX idx_entry_status ON schedule_entries(entry_status);

CREATE TABLE schedule_entry_staff (
    id                BIGSERIAL PRIMARY KEY,
    schedule_entry_id BIGINT      NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
    staff_id          BIGINT      NOT NULL REFERENCES staff(id),
    assigned_role     VARCHAR(30) NOT NULL
);

CREATE INDEX idx_entry_staff_entry ON schedule_entry_staff(schedule_entry_id);
CREATE INDEX idx_entry_staff_staff ON schedule_entry_staff(staff_id);

CREATE TABLE schedule_entry_equipment (
    id                BIGSERIAL PRIMARY KEY,
    schedule_entry_id BIGINT NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
    equipment_id      BIGINT NOT NULL REFERENCES equipment(id)
);

CREATE INDEX idx_entry_equip_entry ON schedule_entry_equipment(schedule_entry_id);

-- ============================================================
-- DISRUPTIONS
-- ============================================================
CREATE TABLE disruptions (
    id                           BIGSERIAL PRIMARY KEY,
    disruption_type              VARCHAR(30)  NOT NULL,
    description                  TEXT         NOT NULL,
    occurred_at                  TIMESTAMP    NOT NULL,
    reported_at                  TIMESTAMP    NOT NULL DEFAULT NOW(),
    reported_by                  BIGINT       REFERENCES users(id),
    affected_room_id             BIGINT       REFERENCES operating_rooms(id),
    affected_staff_id            BIGINT       REFERENCES staff(id),
    affected_equipment_id        BIGINT       REFERENCES equipment(id),
    affected_schedule_version_id BIGINT       REFERENCES schedule_versions(id),
    status                       VARCHAR(20)  NOT NULL DEFAULT 'REGISTERED',
    resolution_notes             TEXT,
    resolved_at                  TIMESTAMP
);

CREATE INDEX idx_disruption_type ON disruptions(disruption_type);
CREATE INDEX idx_disruption_schedule ON disruptions(affected_schedule_version_id);
CREATE INDEX idx_disruption_status ON disruptions(status);

-- Add FK from schedule_versions to disruptions now that both tables exist
ALTER TABLE schedule_versions
    ADD CONSTRAINT fk_schedule_disruption
    FOREIGN KEY (disruption_id) REFERENCES disruptions(id);

-- ============================================================
-- UNSCHEDULED CASES
-- ============================================================
CREATE TABLE unscheduled_cases (
    id                  BIGSERIAL PRIMARY KEY,
    schedule_version_id BIGINT NOT NULL REFERENCES schedule_versions(id) ON DELETE CASCADE,
    surgery_request_id  BIGINT NOT NULL REFERENCES surgery_requests(id),
    reason              TEXT   NOT NULL
);

CREATE INDEX idx_unscheduled_version ON unscheduled_cases(schedule_version_id);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      REFERENCES users(id),
    action       VARCHAR(50) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    BIGINT,
    before_value TEXT,
    after_value  TEXT,
    timestamp    TIMESTAMP   NOT NULL DEFAULT NOW(),
    ip_address   VARCHAR(45)
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type     VARCHAR(30)  NOT NULL,
    title                 VARCHAR(200) NOT NULL,
    message               TEXT         NOT NULL,
    is_read               BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    reference_entity_id   BIGINT,
    reference_entity_type VARCHAR(50)
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(user_id, is_read);
