-- ================================================================
-- IdeaLab — Full Supabase Schema (Fixed Order)
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- HELPERS
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ================================================================
-- 1. PROFILES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            TEXT        PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  display_name  TEXT        NOT NULL DEFAULT '',
  bio           TEXT,
  role          TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: read if authenticated"
  ON public.profiles FOR SELECT USING (clerk_user_id() IS NOT NULL);
CREATE POLICY "profiles: insert own row"
  ON public.profiles FOR INSERT WITH CHECK (id = clerk_user_id());
CREATE POLICY "profiles: update own row"
  ON public.profiles FOR UPDATE
  USING (id = clerk_user_id()) WITH CHECK (id = clerk_user_id());
CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- 2. SESSIONS  (table only — RLS policy referencing session_members added BELOW)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  category      TEXT        CHECK (category IN ('product','design','marketing','engineering','other')),
  is_private    BOOLEAN     NOT NULL DEFAULT FALSE,
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
-- Simple policies that do NOT reference session_members yet
CREATE POLICY "sessions: authenticated users can create"
  ON public.sessions FOR INSERT WITH CHECK (owner_id = clerk_user_id());
CREATE POLICY "sessions: owner can update"
  ON public.sessions FOR UPDATE USING (owner_id = clerk_user_id());
CREATE POLICY "sessions: owner can delete"
  ON public.sessions FOR DELETE USING (owner_id = clerk_user_id());
CREATE OR REPLACE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- 3. SESSION MEMBERS  (must exist before sessions SELECT policy)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.session_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id     TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'contributor'
              CHECK (role IN ('owner','admin','contributor','viewer')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);
ALTER TABLE public.session_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_members: members can read"
  ON public.session_members FOR SELECT
  USING (
    user_id = clerk_user_id()
    OR EXISTS (
      SELECT 1 FROM public.session_members sm
      WHERE sm.session_id = session_id AND sm.user_id = clerk_user_id()
    )
  );
CREATE POLICY "session_members: admins can insert"
  ON public.session_members FOR INSERT
  WITH CHECK (
    user_id = clerk_user_id()
    OR EXISTS (
      SELECT 1 FROM public.session_members sm
      WHERE sm.session_id = session_id
        AND sm.user_id = clerk_user_id()
        AND sm.role IN ('owner','admin')
    )
  );
CREATE POLICY "session_members: admins can delete"
  ON public.session_members FOR DELETE
  USING (
    user_id = clerk_user_id()
    OR EXISTS (
      SELECT 1 FROM public.session_members sm
      WHERE sm.session_id = session_id
        AND sm.user_id = clerk_user_id()
        AND sm.role IN ('owner','admin')
    )
  );
CREATE INDEX IF NOT EXISTS session_members_session_id_idx ON public.session_members(session_id);
CREATE INDEX IF NOT EXISTS session_members_user_id_idx    ON public.session_members(user_id);

-- ================================================================
-- 2b. SESSIONS SELECT POLICY  (added now that session_members exists)
-- ================================================================
CREATE POLICY "sessions: members can read"
  ON public.sessions FOR SELECT
  USING (
    NOT is_private
    OR owner_id = clerk_user_id()
    OR EXISTS (
      SELECT 1 FROM public.session_members sm
      WHERE sm.session_id = id AND sm.user_id = clerk_user_id()
    )
  );

-- ================================================================
-- 4. SESSION INVITES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.session_invites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  invited_by  TEXT        NOT NULL REFERENCES public.profiles(id),
  token       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64'),
  email       TEXT,
  role        TEXT        NOT NULL DEFAULT 'contributor' CHECK (role IN ('admin','contributor','viewer')),
  accepted    BOOLEAN     NOT NULL DEFAULT FALSE,
  accepted_by TEXT        REFERENCES public.profiles(id),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.session_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_invites: creator can read"
  ON public.session_invites FOR SELECT USING (invited_by = clerk_user_id());
CREATE POLICY "session_invites: admins can insert"
  ON public.session_invites FOR INSERT WITH CHECK (invited_by = clerk_user_id());

-- ================================================================
-- 5. IDEAS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ideas (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  author_id        TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  title            TEXT        NOT NULL,
  description      TEXT,
  color            TEXT        DEFAULT 'idea-warm'
                   CHECK (color IN ('idea-warm','idea-teal','idea-rose','idea-sand','idea-mint','idea-coral')),
  is_ai_generated  BOOLEAN     NOT NULL DEFAULT FALSE,
  status           TEXT        NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_review','accepted','rejected')),
  position_x       FLOAT,
  position_y       FLOAT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ideas: session members can read"
  ON public.ideas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.session_members sm
    WHERE sm.session_id = ideas.session_id AND sm.user_id = clerk_user_id()
  ));
CREATE POLICY "ideas: contributors can insert"
  ON public.ideas FOR INSERT
  WITH CHECK (
    author_id = clerk_user_id()
    AND EXISTS (
      SELECT 1 FROM public.session_members sm
      WHERE sm.session_id = ideas.session_id
        AND sm.user_id = clerk_user_id()
        AND sm.role IN ('owner','admin','contributor')
    )
  );
CREATE POLICY "ideas: author or admin can update"
  ON public.ideas FOR UPDATE
  USING (
    author_id = clerk_user_id()
    OR EXISTS (
      SELECT 1 FROM public.session_members sm
      WHERE sm.session_id = ideas.session_id
        AND sm.user_id = clerk_user_id()
        AND sm.role IN ('owner','admin')
    )
  );
CREATE POLICY "ideas: author or admin can delete"
  ON public.ideas FOR DELETE
  USING (
    author_id = clerk_user_id()
    OR EXISTS (
      SELECT 1 FROM public.session_members sm
      WHERE sm.session_id = ideas.session_id
        AND sm.user_id = clerk_user_id()
        AND sm.role IN ('owner','admin')
    )
  );
CREATE INDEX IF NOT EXISTS ideas_session_id_idx ON public.ideas(session_id);
CREATE INDEX IF NOT EXISTS ideas_author_id_idx  ON public.ideas(author_id);
CREATE INDEX IF NOT EXISTS ideas_fts_idx
  ON public.ideas USING GIN(to_tsvector('english', title || ' ' || COALESCE(description,'')));
CREATE OR REPLACE TRIGGER ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- 6. IDEA VOTES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.idea_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id    UUID        NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value      SMALLINT    NOT NULL CHECK (value IN (1,-1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idea_id, user_id)
);
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_votes: session members can read"
  ON public.idea_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas i
    JOIN public.session_members sm ON sm.session_id = i.session_id
    WHERE i.id = idea_id AND sm.user_id = clerk_user_id()
  ));
CREATE POLICY "idea_votes: users manage own vote"
  ON public.idea_votes FOR ALL
  USING (user_id = clerk_user_id()) WITH CHECK (user_id = clerk_user_id());
CREATE INDEX IF NOT EXISTS idea_votes_idea_id_idx ON public.idea_votes(idea_id);

-- ================================================================
-- 7. TAGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  color      TEXT        DEFAULT '#6366f1',
  created_by TEXT        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags: any authenticated user"
  ON public.tags FOR ALL
  USING (clerk_user_id() IS NOT NULL) WITH CHECK (clerk_user_id() IS NOT NULL);

-- ================================================================
-- 8. IDEA TAGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.idea_tags (
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (idea_id, tag_id)
);
ALTER TABLE public.idea_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_tags: session members can read"
  ON public.idea_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas i
    JOIN public.session_members sm ON sm.session_id = i.session_id
    WHERE i.id = idea_id AND sm.user_id = clerk_user_id()
  ));
CREATE POLICY "idea_tags: contributors can manage"
  ON public.idea_tags FOR ALL
  USING (clerk_user_id() IS NOT NULL) WITH CHECK (clerk_user_id() IS NOT NULL);

-- ================================================================
-- 9. COMMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     UUID        NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  author_id   TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id   UUID        REFERENCES public.comments(id) ON DELETE CASCADE,
  body        TEXT        NOT NULL,
  is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments: session members can read"
  ON public.comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas i
    JOIN public.session_members sm ON sm.session_id = i.session_id
    WHERE i.id = idea_id AND sm.user_id = clerk_user_id()
  ));
CREATE POLICY "comments: contributors can insert"
  ON public.comments FOR INSERT WITH CHECK (author_id = clerk_user_id());
CREATE POLICY "comments: author can update"
  ON public.comments FOR UPDATE USING (author_id = clerk_user_id());
CREATE INDEX IF NOT EXISTS comments_idea_id_idx ON public.comments(idea_id);
CREATE OR REPLACE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- 10. AI CHATS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id     TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT        DEFAULT 'New Chat',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chats: own chats only"
  ON public.ai_chats FOR ALL
  USING (user_id = clerk_user_id()) WITH CHECK (user_id = clerk_user_id());
CREATE OR REPLACE TRIGGER ai_chats_updated_at
  BEFORE UPDATE ON public.ai_chats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- 11. AI MESSAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID        NOT NULL REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user','assistant','system')),
  content     TEXT        NOT NULL,
  tokens_used INTEGER,
  model       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_messages: chat owner only"
  ON public.ai_messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.ai_chats ac
    WHERE ac.id = chat_id AND ac.user_id = clerk_user_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_chats ac
    WHERE ac.id = chat_id AND ac.user_id = clerk_user_id()
  ));
CREATE INDEX IF NOT EXISTS ai_messages_chat_id_idx ON public.ai_messages(chat_id);

-- ================================================================
-- 12. NOTIFICATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL
              CHECK (type IN ('comment','vote','invite','session_update','ai_suggestion','mention')),
  title       TEXT        NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  actor_id    TEXT        REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_id   UUID,
  entity_type TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications: own only"
  ON public.notifications FOR ALL
  USING (user_id = clerk_user_id()) WITH CHECK (user_id = clerk_user_id());
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id, is_read);

-- ================================================================
-- 13. USER SETTINGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id                  TEXT    PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notify_email             BOOLEAN NOT NULL DEFAULT TRUE,
  notify_session_updates   BOOLEAN NOT NULL DEFAULT TRUE,
  notify_ai_suggestions    BOOLEAN NOT NULL DEFAULT TRUE,
  notify_comments          BOOLEAN NOT NULL DEFAULT TRUE,
  notify_votes             BOOLEAN NOT NULL DEFAULT TRUE,
  theme                    TEXT    NOT NULL DEFAULT 'dark' CHECK (theme IN ('light','dark','system')),
  default_session_category TEXT    DEFAULT 'product',
  ai_model_preference      TEXT    DEFAULT 'auto',
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings: own only"
  ON public.user_settings FOR ALL
  USING (user_id = clerk_user_id()) WITH CHECK (user_id = clerk_user_id());

-- ================================================================
-- REALTIME
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_members;

-- ================================================================
-- VERIFY (run this separately after above completes)
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ================================================================
