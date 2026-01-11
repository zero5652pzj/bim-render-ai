# ⚡ 快速修复步骤 - 403 错误

## 🎯 立即执行（2分钟修复）

### 步骤 1：打开 Supabase Dashboard
1. 访问 [supabase.com](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 **SQL Editor**

### 步骤 2：执行修复脚本
复制下面的 SQL 并粘贴到 SQL Editor，然后点击 **Run**：

```sql
-- 修复 Messages 表 403 错误
-- 删除现有策略
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- 创建新的宽松策略
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

SELECT 'Messages RLS policies fixed!' as status;
```

### 步骤 3：测试修复
1. 刷新浏览器页面
2. 登录应用
3. 检查是否还有 403 错误

## ✅ 预期结果
- 403 错误消失
- 消息正常显示
- 删除功能正常

## 🆘 如果仍有问题
检查浏览器控制台是否有其他错误，或重新执行上述脚本。