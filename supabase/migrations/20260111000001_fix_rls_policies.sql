-- 修复 RLS 策略以允许软删除操作

-- 1. 修复 conversations 表的 UPDATE 策略
-- 允许用户更新自己的会话（包括软删除）
DROP POLICY IF EXISTS "用户可更新自己的会话" ON public.conversations;

CREATE POLICY "用户可更新自己的会话"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. 修复 messages 表的 UPDATE 策略
-- 允许用户软删除消息，同时保持灵活性
DROP POLICY IF EXISTS "用户可软删除会话中的消息" ON public.messages;

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
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- 3. 修改 recompute_conversation_stats 函数为 SECURITY DEFINER
-- 这样它可以绕过 RLS 策略来更新统计信息
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

-- 4. 修改 on_message_changed_recompute_conversation 函数为 SECURITY DEFINER
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

-- 5. 授予执行权限
GRANT EXECUTE ON FUNCTION public.recompute_conversation_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.on_message_changed_recompute_conversation() TO authenticated;
