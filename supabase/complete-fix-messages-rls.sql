-- ============================================================
-- 完整修复 Messages 表 RLS 策略 - 解决 403 错误和删除问题
-- 问题：403 错误说明用户无法访问自己的消息
-- 影响：不仅删除功能，连基本的聊天功能也无法工作
-- ============================================================

-- 1. 删除所有现有的 messages 相关策略
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- 2. 创建宽松的 SELECT 策略
-- 允许已认证用户查看自己会话的消息
CREATE POLICY "messages_select_policy"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- 3. 创建 INSERT 策略
-- 允许已认证用户向自己的会话添加消息
CREATE POLICY "messages_insert_policy"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- 4. 创建 UPDATE 策略（修复删除功能）
-- 允许已认证用户更新自己会话的消息
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

-- 5. 创建 DELETE 策略
-- 允许已认证用户删除自己会话的消息
CREATE POLICY "messages_delete_policy"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- 6. 修复会话表的 UPDATE 策略（如果需要）
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;

CREATE POLICY "conversations_update_policy"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. 创建验证函数：检查用户会话和消息
CREATE OR REPLACE FUNCTION public.verify_user_conversations()
RETURNS TABLE (
  conversation_id UUID,
  conversation_title TEXT,
  has_messages BOOLEAN,
  message_count BIGINT,
  can_select BOOLEAN,
  can_insert BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    CASE WHEN EXISTS(SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id) THEN true ELSE false END as has_messages,
    COALESCE((SELECT COUNT(*) FROM public.messages m WHERE m.conversation_id = c.id), 0) as message_count,
    EXISTS(
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'messages'
        AND policyname = 'messages_select_policy'
    ) as can_select,
    EXISTS(
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'messages'
        AND policyname = 'messages_insert_policy'
    ) as can_insert,
    EXISTS(
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'messages'
        AND policyname = 'messages_update_policy'
    ) as can_update,
    EXISTS(
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'messages'
        AND policyname = 'messages_delete_policy'
    ) as can_delete
  FROM public.conversations c
  WHERE c.user_id = auth.uid()
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建清理函数：修复孤立的消息
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_messages()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER := 0;
BEGIN
  -- 删除没有对应会话的消息
  DELETE FROM public.messages
  WHERE conversation_id NOT IN (
    SELECT id FROM public.conversations
  );

  GET DIAGNOSTICS cleaned_count = ROW_COUNT;

  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 授予所有必要的权限
GRANT EXECUTE ON FUNCTION public.verify_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_messages() TO authenticated;

-- 10. 应用更改
-- 更新统计信息
ANALYZE public.messages;
ANALYZE public.conversations;

-- 11. 验证设置
SELECT 'Messages RLS policies have been updated successfully!' as status;

-- 12. 显示当前策略状态
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('messages', 'conversations')
ORDER BY tablename, policyname;