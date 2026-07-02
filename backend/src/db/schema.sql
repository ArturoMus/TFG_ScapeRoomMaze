CREATE DATABASE tfg_ldm IF NOT EXISTS tfg_ldm;

USE tfg_ldm;

CREATE TABLE IF NOT EXISTS runs (
    id VARCHAR(36) PRIMARY KEY,

    player_alias VARCHAR(100),
    started_at DATETIME(3) NOT NULL,
    finished_at DATETIME(3),
    duration_ms INT,
    result VARCHAR(30) NOT NULL DEFAULT 'started',

    map_seed VARCHAR(100),
    map_width INT,
    map_height INT,
    room_count INT,
    door_count INT,
    deadend_count INT,
    final_room VARCHAR(100),

    main_path_json LONGTEXT,
    puzzle_distribution_json LONGTEXT,
    map_json LONGTEXT,

    dominant_hand ENUM('R', 'L', 'U') NOT NULL DEFAULT 'U',
    age_range ENUM('<12', '12-15', '16-18', '19-35', '36-50', '>51', '-1') NOT NULL DEFAULT '-1',
    gender_identity ENUM('M', 'F', 'N', 'U') NOT NULL DEFAULT 'U',

    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,

    run_id VARCHAR(36) NOT NULL,
    type VARCHAR(100) NOT NULL,
    timestamp DATETIME(3) NOT NULL,
    elapsed_ms INT,

    room_id VARCHAR(100),
    payload_json LONGTEXT,

    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT fk_events_run
        FOREIGN KEY (run_id)
        REFERENCES runs(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_events_run_id ON events(run_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_room_id ON events(room_id);
CREATE INDEX idx_runs_result ON runs(result);