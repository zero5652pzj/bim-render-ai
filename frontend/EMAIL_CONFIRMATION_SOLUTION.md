# 邮箱确认错误解决方案

## 🚨 问题描述
```
Error sending confirmation email
```

这是因为 Supabase 默认启用了邮箱确认功能，需要发送确认邮件。

## ✅ 推荐解决方案

### 方案1：在Supabase Dashboard禁用邮箱确认（最推荐）

1. **访问Supabase Dashboard**
   - 打开：https://supabase.com/dashboard
   - 选择您的项目

2. **进入认证设置**
   - 左侧菜单：Authentication → Settings
   - 或：Settings → Authentication

3. **禁用邮箱确认**
   ```
   User Signups:
   ☑ Enable email confirmations    ← 取消勾选
   ☑ Enable email change confirmations
   ```

4. **保存设置**
   - 点击 "Save" 按钮

### 方案2：使用本地Supabase

如果您使用本地 Supabase 实例（localhost:8000）：

1. **启动Supabase CLI**
   ```bash
   supabase start
   ```

2. **检查配置**
   ```bash
   supabase status
   ```

3. **重置数据库（如需要）**
   ```bash
   supabase db reset
   ```

### 方案3：配置SMTP邮件服务

1. **获取SMTP凭据**
   - Gmail: 使用应用专用密码
   - SendGrid: 使用API密钥
   - Mailgun: 使用域名凭据

2. **在Supabase中配置SMTP**
   ```
   Authentication → Settings → SMTP Settings
   ```

3. **示例配置（Gmail）**
   ```
   Host: smtp.gmail.com
   Port: 587
   User: your-email@gmail.com
   Pass: your-app-password
   ```

## 🔧 临时解决方案

如果您需要立即测试，可以：

1. **尝试直接登录**
   - 注册后，即使收到确认邮件错误
   - 也可以尝试用相同邮箱和密码登录
   - 某些情况下账户可能已经激活

2. **使用测试邮箱**
   - 使用：test@example.com
   - 或：user@localhost
   - 这些邮箱不会触发真实邮件发送

## 📊 验证解决方案

修复后应该看到：
- ✅ 注册成功，无"Error sending confirmation email"错误
- ✅ 用户可以直接登录（无需邮箱确认）
- ✅ 控制台显示："注册成功（开发模式）"

## 🚀 生产环境建议

对于生产环境：
1. **保持邮箱确认功能**（安全性考虑）
2. **配置SMTP服务**（确保邮件发送）
3. **自定义邮件模板**（品牌化）
4. **设置邮件域名**（SPF/DKIM记录）

---

**创建时间**: 2026-01-11
**适用环境**: 开发/测试/生产
