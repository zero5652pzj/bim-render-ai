-- 快速设置数据库表结构
-- 在 Supabase Dashboard > SQL Editor 中运行此脚本

-- 1. 创建 profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 conversations 表
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

-- 3. 创建 messages 表
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建 models 表
CREATE TABLE IF NOT EXISTS public.models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  model_data JSONB NOT NULL,
  forge_urn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建 example_cards 表
CREATE TABLE IF NOT EXISTS public.example_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.example_cards ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略

-- profiles 表策略
CREATE POLICY "用户可查看自己的资料"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户可更新自己的资料"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "用户可插入自己的资料"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- conversations 表策略
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

-- messages 表策略
CREATE POLICY "用户可查看自己会话的消息"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
      AND conversations.is_deleted = FALSE
    )
    AND is_deleted = FALSE
  );

CREATE POLICY "用户可创建消息"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可更新自己的消息"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可删除自己的消息"
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- models 表策略
CREATE POLICY "用户可查看自己的模型"
  ON public.models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可创建模型"
  ON public.models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的模型"
  ON public.models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的模型"
  ON public.models FOR DELETE
  USING (auth.uid() = user_id);

-- example_cards 表策略（所有人可读）
CREATE POLICY "所有人可查看示例卡片"
  ON public.example_cards FOR SELECT
  USING (is_active = TRUE);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_models_user_id ON public.models(user_id);

-- 插入示例数据
INSERT INTO public.example_cards (title, description, sort_order) VALUES
('生成一座 100 米的简支梁桥', '创建一个标准跨径的简支梁桥模型', 1),
('创建三跨连续梁桥，每跨 30 米', '设计连续梁桥结构', 2),
('设计一个拱桥，跨径 50 米', '生成拱桥设计方案', 3),
('查看之前设计的桥梁参数', '浏览历史桥梁设计', 4)
ON CONFLICT DO NOTHING;

-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 授予权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 完成提示
SELECT 'Database setup completed successfully! 🎉' as status;
