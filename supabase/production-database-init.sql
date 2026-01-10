-- ============================================================
-- AI+BIM聊天记录删除功能 - 生产环境数据库初始化脚本
-- 此脚本包含完整的表结构、RLS策略、索引和权限配置
-- 版本: 1.0.0
-- 日期: 2026-01-10
-- ============================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 创建用户资料表 (profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. 创建会话表 (conversations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '新对话',
  model_id TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. 创建消息表 (messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. 创建索引
-- ============================================================

-- Profiles表索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Conversations表索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_is_deleted ON public.conversations(is_deleted) WHERE is_deleted = FALSE;

-- Messages表索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages(is_deleted) WHERE is_deleted = FALSE;

-- ============================================================
-- 5. 创建触发器函数
-- ============================================================

-- 更新 updated_at 字段的通用函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重新计算会话统计信息的函数
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

-- 消息变更时重新计算会话统计的触发器函数
CREATE OR REPLACE FUNCTION public.on_message_changed_recompute_conversation()
RETURNS TRIGGER AS $$
DECLARE
  conv_id UUID;
BEGIN
  conv_id = COALESCE(NEW.conversation_id, OLD.conversation_id);
  PERFORM public.recompute_conversation_stats(conv_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 防止消息更新（除软删除外）的触发器函数
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

-- ============================================================
-- 6. 创建触发器
-- ============================================================

-- Conversations表触发器
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages表触发器
DROP TRIGGER IF EXISTS prevent_message_update_except_soft_delete ON public.messages;
CREATE TRIGGER prevent_message_update_except_soft_delete
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.prevent_message_update_except_soft_delete();

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_changed_recompute_conversation();

DROP TRIGGER IF EXISTS on_message_soft_deleted ON public.messages;
CREATE TRIGGER on_message_soft_deleted
  AFTER UPDATE OF is_deleted ON public.messages
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION public.on_message_changed_recompute_conversation();

DROP TRIGGER IF EXISTS on_message_deleted ON public.messages;
CREATE TRIGGER on_message_deleted
  AFTER DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_changed_recompute_conversation();

-- ============================================================
-- 7. 创建辅助函数
-- ============================================================

-- 清空当前用户所有历史记录的函数
CREATE OR REPLACE FUNCTION public.clear_current_user_history()
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.messages
  SET is_deleted = TRUE
  WHERE conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  );

  UPDATE public.conversations
  SET is_deleted = TRUE, updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. 启用行级安全 (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. 创建RLS策略 (使用正确的WITH CHECK子句)
-- ============================================================

-- Profiles表RLS策略
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_policy"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Conversations表RLS策略
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

CREATE POLICY "conversations_select_policy"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "conversations_insert_policy"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_update_policy"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_delete_policy"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages表RLS策略
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

CREATE POLICY "messages_select_policy"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    is_deleted = FALSE
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
      AND is_deleted = FALSE
    )
  );

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
    is_deleted = TRUE
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

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

-- ============================================================
-- 10. 授予权限
-- ============================================================

-- 撤销所有公共权限
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.conversations FROM PUBLIC;
REVOKE ALL ON public.messages FROM PUBLIC;

-- 授予已认证用户所有权限
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;

-- 授予匿名用户只读权限（如果需要）
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.conversations TO anon;
GRANT SELECT ON public.messages TO anon;

-- 授予函数执行权限
REVOKE ALL ON FUNCTION public.clear_current_user_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_current_user_history() TO authenticated;

-- 授予序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- 11. 验证设置
-- ============================================================

-- 检查表是否创建成功
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('profiles', 'conversations', 'messages')
ORDER BY tablename;

-- 检查RLS策略是否创建成功
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'conversations', 'messages')
ORDER BY tablename, policyname;

-- 检查索引是否创建成功
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'conversations', 'messages')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 检查触发器是否创建成功
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'conversations', 'messages')
AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================
-- 12. 性能优化提示
-- ============================================================

-- 如果需要，可以添加以下性能优化：
-- 1. 定期运行 VACUUM ANALYZE 优化查询性能
-- 2. 监控慢查询并添加适当索引
-- 3. 考虑对大表进行分区（如果数据量很大）
-- 4. 定期清理软删除的数据（如果需要）

-- 示例清理脚本（可选）：
-- DELETE FROM public.conversations
-- WHERE is_deleted = TRUE
-- AND created_at < NOW() - INTERVAL '30 days';

-- ============================================================
-- 初始化完成！
-- ============================================================
SELECT 'Database initialization completed successfully!' as status;