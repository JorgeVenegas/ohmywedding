-- AI Platform Tables
-- Adds the full AI infrastructure: conversations, messages, wedding snapshots,
-- embeddings (for RAG), interaction logs, and ai_role on collaborator_permissions.

-- ─── collaborator_permissions: add ai_role ───────────────────────────────────

ALTER TABLE public.collaborator_permissions
  ADD COLUMN IF NOT EXISTS ai_role TEXT
    CHECK (ai_role IN ('partner', 'planner', 'planner_staff'));

COMMENT ON COLUMN public.collaborator_permissions.ai_role IS
  'AI platform role: partner = second person in couple, planner = wedding planner, planner_staff = staff under planner. NULL = read-only viewer.';

-- ─── ai_conversations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    UUID REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role          TEXT NOT NULL CHECK (role IN ('guest', 'couple', 'partner', 'planner', 'planner_staff', 'superadmin')),
  channel       TEXT NOT NULL CHECK (channel IN ('whatsapp', 'planner_dashboard', 'couple_dashboard', 'staff_dashboard')),
  context       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_wedding_id ON public.ai_conversations(wedding_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wedding members can access their ai_conversations"
  ON public.ai_conversations FOR SELECT TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings
      WHERE owner_id = auth.uid()
        OR (auth.jwt()->>'email') = ANY(collaborator_emails)
    )
    OR user_id = auth.uid()
  );

GRANT SELECT ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;

-- ─── ai_messages ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'system')),
  content           TEXT,
  tool_calls        JSONB,
  tool_results      JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wedding members can access their ai_messages"
  ON public.ai_messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE wedding_id IN (
        SELECT id FROM public.weddings
        WHERE owner_id = auth.uid()
          OR (auth.jwt()->>'email') = ANY(collaborator_emails)
      )
      OR user_id = auth.uid()
    )
  );

GRANT SELECT ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;

-- ─── ai_wedding_snapshots ────────────────────────────────────────────────────
-- Persistent denormalized cache. Rebuilt lazily after invalidated_at is set.

CREATE TABLE IF NOT EXISTS public.ai_wedding_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id       UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE UNIQUE,
  snapshot         JSONB NOT NULL DEFAULT '{}',
  snapshot_version INT NOT NULL DEFAULT 1,
  invalidated_at   TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_wedding_snapshots_wedding_id ON public.ai_wedding_snapshots(wedding_id);

ALTER TABLE public.ai_wedding_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wedding owners and collaborators can read their snapshot"
  ON public.ai_wedding_snapshots FOR SELECT TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings
      WHERE owner_id = auth.uid()
        OR (auth.jwt()->>'email') = ANY(collaborator_emails)
    )
  );

GRANT SELECT ON public.ai_wedding_snapshots TO authenticated;
GRANT ALL ON public.ai_wedding_snapshots TO service_role;

-- Snapshot invalidation triggers:
-- When key data changes, mark the snapshot stale so it's rebuilt on next AI request.

CREATE OR REPLACE FUNCTION public.invalidate_ai_wedding_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wedding_id UUID;
BEGIN
  -- Determine wedding_id from the changed row
  v_wedding_id := COALESCE(NEW.wedding_id, OLD.wedding_id);

  IF v_wedding_id IS NOT NULL THEN
    INSERT INTO public.ai_wedding_snapshots (wedding_id, snapshot, invalidated_at)
      VALUES (v_wedding_id, '{}', NOW())
      ON CONFLICT (wedding_id) DO UPDATE
        SET invalidated_at = NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to tables that affect the snapshot
CREATE OR REPLACE TRIGGER trg_invalidate_snapshot_on_guest_change
  AFTER INSERT OR UPDATE OR DELETE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.invalidate_ai_wedding_snapshot();

CREATE OR REPLACE TRIGGER trg_invalidate_snapshot_on_itinerary_change
  AFTER INSERT OR UPDATE OR DELETE ON public.itinerary_events
  FOR EACH ROW EXECUTE FUNCTION public.invalidate_ai_wedding_snapshot();

-- ─── ai_embeddings ───────────────────────────────────────────────────────────
-- Used in Phase 3 for RAG. Created now so the schema is complete.
-- Requires the pgvector extension (already enabled in Supabase).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.ai_embeddings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id     UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  document_type  TEXT NOT NULL CHECK (document_type IN ('planner_note', 'contract', 'vendor_pdf', 'venue_guide', 'faq')),
  source_id      UUID,
  chunk_index    INT NOT NULL DEFAULT 0,
  content        TEXT NOT NULL,
  embedding      VECTOR(1536),
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_wedding_id ON public.ai_embeddings(wedding_id);

-- IVFFlat index for fast ANN search (created when embeddings exist)
-- CREATE INDEX ON public.ai_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.ai_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wedding members can access their embeddings"
  ON public.ai_embeddings FOR SELECT TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings
      WHERE owner_id = auth.uid()
        OR (auth.jwt()->>'email') = ANY(collaborator_emails)
    )
  );

GRANT SELECT ON public.ai_embeddings TO authenticated;
GRANT ALL ON public.ai_embeddings TO service_role;

-- RPC for vector similarity search (Phase 3)
CREATE OR REPLACE FUNCTION public.match_ai_embeddings(
  query_embedding VECTOR(1536),
  p_wedding_id    UUID,
  match_threshold FLOAT  DEFAULT 0.7,
  match_count     INT    DEFAULT 5
)
RETURNS TABLE (
  id            UUID,
  content       TEXT,
  metadata      JSONB,
  document_type TEXT,
  similarity    FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    e.document_type,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.ai_embeddings e
  WHERE e.wedding_id = p_wedding_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── ai_interaction_logs ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wedding_id        UUID REFERENCES public.weddings(id) ON DELETE SET NULL,
  conversation_id   UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  model             TEXT,
  prompt_tokens     INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens      INT DEFAULT 0,
  estimated_cost    NUMERIC(10, 6) DEFAULT 0,
  tools_called      TEXT[] DEFAULT '{}',
  duration_ms       INT,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_wedding_id ON public.ai_interaction_logs(wedding_id);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_created_at ON public.ai_interaction_logs(created_at DESC);

ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.ai_interaction_logs TO service_role;
