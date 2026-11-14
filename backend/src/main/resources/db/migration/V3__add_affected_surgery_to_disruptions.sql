-- ============================================================
-- V3: Add affected_surgery_id to disruptions
-- ============================================================

ALTER TABLE disruptions
    ADD COLUMN affected_surgery_id BIGINT REFERENCES surgery_requests(id);

CREATE INDEX idx_disruption_surgery ON disruptions(affected_surgery_id);
