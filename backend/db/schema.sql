-- Meridian CMS — PostgreSQL schema
-- Run with: psql -U meridian_app -d meridian_cms -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('admin', 'attorney', 'paralegal', 'investigator');
CREATE TYPE case_status AS ENUM ('open', 'under_review', 'closed');

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL,
    email           CITEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,          -- bcrypt hash, never plaintext
    role            user_role NOT NULL DEFAULT 'investigator',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         TEXT NOT NULL UNIQUE,   -- human-readable unique ID, e.g. MRD-2026-00147
    title           TEXT NOT NULL,
    category        TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    status          case_status NOT NULL DEFAULT 'open',
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A case can have more than one assignee; access checks join through this table.
CREATE TABLE IF NOT EXISTS case_assignments (
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (case_id, user_id)
);

CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    storage_path    TEXT NOT NULL,          -- path on disk / object storage key
    sha256_hash     CHAR(64) NOT NULL,      -- integrity fingerprint, checked on every download
    size_bytes      BIGINT NOT NULL,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every lookup/view/upload attempt is logged, granted or not — this is what
-- "Case Lookup" in the UI promises the user.
CREATE TABLE IF NOT EXISTS access_logs (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             UUID REFERENCES users(id),
    case_id_requested   TEXT NOT NULL,
    action              TEXT NOT NULL,      -- 'lookup' | 'view' | 'upload' | 'login' | 'login_failed'
    granted             BOOLEAN NOT NULL,
    ip_address          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_user_id ON case_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_case_id_requested ON access_logs(case_id_requested);
