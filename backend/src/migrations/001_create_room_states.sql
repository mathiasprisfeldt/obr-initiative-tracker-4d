-- Migration 001: Create room_states table for storing multiple keyed states per room
CREATE TABLE IF NOT EXISTS room_states (
    room_id TEXT    NOT NULL,
    key     TEXT    NOT NULL,
    state   JSONB   NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (room_id, key)
);
