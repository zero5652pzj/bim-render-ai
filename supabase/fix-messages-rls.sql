-- ============================================================
-- 修复消息表 RLS 策略 - 解决删除聊天记录失败问题
-- 问题：messages_update_policy 的 WITH CHECK 子句过于严格
-- 当前只允许 is_deleted = TRUE 的记录被更新，但我们需要将记录标记为删除
-- ============================================================

-- 删除现有的严格策略
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;

-- 创建新的宽松策略
-- 允许已认证用户更新属于自己会话的消息
CREATE POLICY "messages_update_policy"
  ON public.messages FOR UPDATE
  TO authenticated
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

-- ============================================================
-- 额外的辅助函数：删除指定会话的所有消息
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_conversation_messages(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- 验证会话属于当前用户
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'conversation_not_found_or_access_denied';
  END IF;

  -- 将该会话的所有消息标记为删除
  UPDATE public.messages
  SET is_deleted = TRUE
  WHERE conversation_id = p_conversation_id
    AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION public.delete_conversation_messages(UUID) TO authenticated;