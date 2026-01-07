-- 会话表
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

-- 启用 RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "用户可查看自己的会话"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "用户可创建会话"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的会话"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的会话"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

-- 触发器
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

REVOKE ALL ON FUNCTION public.clear_current_user_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_current_user_history() TO authenticated;
