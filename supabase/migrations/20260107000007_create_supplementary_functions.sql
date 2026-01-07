-- 补充辅助函数

-- 清理用户所有数据（用于账号注销）
CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- 按顺序删除相关数据（外键约束会自动处理级联删除）
  DELETE FROM public.models WHERE user_id = auth.uid();
  DELETE FROM public.messages WHERE conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  );
  DELETE FROM public.conversations WHERE user_id = auth.uid();
  DELETE FROM public.profiles WHERE id = auth.uid();

  -- 最后删除认证用户
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.delete_user_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_data() TO authenticated;

-- 获取用户统计信息
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT json_build_object(
    'conversation_count', (
      SELECT COUNT(*) FROM public.conversations
      WHERE user_id = auth.uid() AND is_deleted = FALSE
    ),
    'message_count', (
      SELECT COUNT(*) FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE c.user_id = auth.uid() AND m.is_deleted = FALSE
    ),
    'model_count', (
      SELECT COUNT(*) FROM public.models
      WHERE user_id = auth.uid()
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.get_user_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;

-- 批量软删除消息
CREATE OR REPLACE FUNCTION public.soft_delete_messages(message_ids UUID[])
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.messages
  SET is_deleted = TRUE
  WHERE id = ANY(message_ids)
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.soft_delete_messages(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_messages(UUID[]) TO authenticated;

-- 创建性能优化视图
CREATE OR REPLACE VIEW public.user_stats_view AS
SELECT
  c.user_id,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT m.id) FILTER (WHERE m.is_deleted = FALSE) as active_message_count,
  COUNT(DISTINCT mo.id) as model_count,
  MAX(m.created_at) as last_message_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN models mo ON mo.conversation_id = c.id
WHERE c.is_deleted = FALSE
GROUP BY c.user_id;

-- 为视图启用 RLS
ALTER VIEW public.user_stats_view SET (security_invoker = true);

-- 注释
COMMENT ON FUNCTION public.handle_new_user() IS '当新用户注册时自动创建 profile 记录';
COMMENT ON FUNCTION public.update_updated_at_column() IS '自动更新 updated_at 字段';
COMMENT ON FUNCTION public.delete_user_data() IS '删除当前用户的所有数据（用于账号注销）';
COMMENT ON FUNCTION public.get_user_stats() IS '获取当前用户的统计信息';
COMMENT ON FUNCTION public.soft_delete_messages(UUID[]) IS '批量软删除消息';
