-- ============================================================
-- schema.sql  –  Augenblick database schema
-- Run this in your Supabase SQL editor (or any Postgres client)
-- to set up all tables from scratch.
-- ============================================================

-- Enable the pgcrypto extension for gen_random_uuid() if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ================================================================
-- IdeaLab Database Schema (With Proper Foreign Keys)
-- Run in Supabase SQL Editor
-- ================================================================

-- ── profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
id           TEXT        PRIMARY KEY,
email        TEXT        NOT NULL UNIQUE,
display_name TEXT        DEFAULT '',
bio          TEXT,
role         TEXT        NOT NULL DEFAULT 'user',
created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
owner_id    TEXT        REFERENCES profiles(id) ON DELETE CASCADE,
title       TEXT        NOT NULL,
description TEXT,
category    TEXT        NOT NULL DEFAULT 'product',
is_private  BOOLEAN     NOT NULL DEFAULT false,
status      TEXT        NOT NULL DEFAULT 'active',
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── session_members ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_members (
id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
user_id    TEXT        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
role       TEXT        NOT NULL DEFAULT 'contributor',
joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE(session_id, user_id)
);

-- ── session_invites ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_invites (
id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
session_id  UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
invited_by  TEXT        NOT NULL REFERENCES profiles(id),
email       TEXT,
role        TEXT        NOT NULL DEFAULT 'contributor',
token       TEXT        UNIQUE,
accepted    BOOLEAN     NOT NULL DEFAULT false,
accepted_by TEXT        REFERENCES profiles(id),
expires_at  TIMESTAMPTZ,
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ideas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ideas (
id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
session_id      UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
author_id       TEXT        REFERENCES profiles(id) ON DELETE SET NULL,
title           TEXT        NOT NULL,
description     TEXT,
color           TEXT        DEFAULT 'idea-warm',
status          TEXT        DEFAULT 'open',
is_ai_generated BOOLEAN     DEFAULT false,
position_x      FLOAT,
position_y      FLOAT,
created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── idea_votes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_votes (
id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
idea_id    UUID        NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
user_id    TEXT        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
value      SMALLINT    NOT NULL CHECK (value IN (1,-1)),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (idea_id, user_id)
);

-- ── tags ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
name       TEXT        NOT NULL UNIQUE,
color      TEXT        DEFAULT '#6366f1',
created_by TEXT        REFERENCES profiles(id) ON DELETE SET NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── idea_tags (many-to-many) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_tags (
idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
PRIMARY KEY (idea_id, tag_id)
);

-- ── idea_comments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_comments (
id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
idea_id     UUID        NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
author_id   TEXT        REFERENCES profiles(id) ON DELETE SET NULL,
parent_id   UUID        REFERENCES comments(id) ON DELETE CASCADE,
body        TEXT        NOT NULL,
is_deleted  BOOLEAN     DEFAULT false,
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ai_chats ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chats (
id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
session_id UUID        REFERENCES sessions(id) ON DELETE CASCADE,
user_id    TEXT        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
title      TEXT        DEFAULT 'New Chat',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ai_messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_messages (
id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
chat_id     UUID        NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
role        TEXT        NOT NULL,
content     TEXT        NOT NULL,
tokens_used INTEGER,
model       TEXT,
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
user_id     TEXT        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
type        TEXT        NOT NULL,
title       TEXT        NOT NULL,
body        TEXT,
link        TEXT,
is_read     BOOLEAN     DEFAULT false,
actor_id    TEXT        REFERENCES profiles(id) ON DELETE SET NULL,
entity_id   UUID,
entity_type TEXT,
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── user_settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
user_id                  TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
notify_email             BOOLEAN DEFAULT true,
notify_session_updates   BOOLEAN DEFAULT true,
notify_ai_suggestions    BOOLEAN DEFAULT true,
notify_comments          BOOLEAN DEFAULT true,
notify_votes             BOOLEAN DEFAULT true,
theme                    TEXT DEFAULT 'dark',
default_session_category TEXT DEFAULT 'product',
ai_model_preference      TEXT DEFAULT 'auto',
updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
