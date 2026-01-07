-- 模型表
CREATE TABLE IF NOT EXISTS public.models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  model_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  forge_urn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "用户可以查看自己的模型"
  ON public.models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的模型"
  ON public.models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的模型"
  ON public.models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的模型"
  ON public.models FOR DELETE
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_models_user_id ON public.models(user_id);
CREATE INDEX idx_models_conversation_id ON public.models(conversation_id);
CREATE INDEX idx_models_created_at ON public.models(created_at DESC);

-- 触发器
CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
