-- 消息表
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "用户可查看会话中的消息"
  ON public.messages FOR SELECT
  USING (
    is_deleted = FALSE
    AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
      AND is_deleted = FALSE
    )
  );

CREATE POLICY "用户可在会话中插入消息"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "用户可软删除会话中的消息"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_deleted = TRUE
    AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.prevent_message_update_except_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'message_update_not_allowed';
  END IF;
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'message_update_not_allowed';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'message_update_not_allowed';
  END IF;
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    RAISE EXCEPTION 'message_update_not_allowed';
  END IF;
  IF NEW.metadata IS DISTINCT FROM OLD.metadata THEN
    RAISE EXCEPTION 'message_update_not_allowed';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'message_update_not_allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_message_update_except_soft_delete
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.prevent_message_update_except_soft_delete();

-- 索引
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at ASC);

-- 触发器：自动更新会话的 message_count 和 last_message_at（仅统计未删除消息）
CREATE OR REPLACE FUNCTION public.recompute_conversation_stats(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.conversations
  SET
    message_count = (
      SELECT COUNT(*)
      FROM public.messages
      WHERE conversation_id = p_conversation_id
      AND is_deleted = FALSE
    ),
    last_message_at = (
      SELECT MAX(created_at)
      FROM public.messages
      WHERE conversation_id = p_conversation_id
      AND is_deleted = FALSE
    ),
    updated_at = NOW()
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.on_message_changed_recompute_conversation()
RETURNS TRIGGER AS $$
DECLARE
  conv_id UUID;
BEGIN
  conv_id = COALESCE(NEW.conversation_id, OLD.conversation_id);
  PERFORM public.recompute_conversation_stats(conv_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_changed_recompute_conversation();

CREATE TRIGGER on_message_soft_deleted
  AFTER UPDATE OF is_deleted ON public.messages
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION public.on_message_changed_recompute_conversation();

CREATE TRIGGER on_message_deleted
  AFTER DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_changed_recompute_conversation();
