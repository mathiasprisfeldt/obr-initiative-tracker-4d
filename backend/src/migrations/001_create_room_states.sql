-- Migration 001: Create room_states table for storing multiple keyed states per room
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'room_states')
BEGIN
    CREATE TABLE room_states (
        room_id NVARCHAR(450) NOT NULL,
        [key]   NVARCHAR(450) NOT NULL,
        state   NVARCHAR(MAX) NOT NULL CONSTRAINT DF_room_states_state DEFAULT '{}',
        CONSTRAINT PK_room_states PRIMARY KEY (room_id, [key])
    );
END
