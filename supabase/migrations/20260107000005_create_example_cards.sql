-- 示例卡片表
CREATE TABLE IF NOT EXISTS public.example_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.example_cards ENABLE ROW LEVEL SECURITY;

-- RLS 策略（所有人可读取）
CREATE POLICY "所有用户可查看启用的示例卡片"
  ON public.example_cards FOR SELECT
  USING (is_active = TRUE);

-- 索引
CREATE INDEX idx_example_cards_sort_order ON public.example_cards(sort_order ASC, created_at DESC);
CREATE INDEX idx_example_cards_is_active ON public.example_cards(is_active);

-- 触发器
CREATE TRIGGER update_example_cards_updated_at
  BEFORE UPDATE ON public.example_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认示例数据
INSERT INTO public.example_cards (title, description, sort_order, is_active)
VALUES
  ('生成简支梁桥', '生成一座100米的简支梁桥', 1, true),
  ('创建连续梁桥', '创建三跨连续梁桥，每跨30米', 2, true),
  ('设计拱桥', '设计一个拱桥，跨径50米', 3, true),
  ('查看桥梁参数', '查看之前设计的桥梁参数', 4, true)
ON CONFLICT (id) DO NOTHING;
