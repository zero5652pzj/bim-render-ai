-- 禁用邮箱确认（临时开发用）
UPDATE auth.config 
SET enable_signup = true, 
    enable_email_confirmations = false,
    enable_sms_confirmations = false,
    enable_phone_confirmations = false;

-- 或者创建新的配置
INSERT INTO auth.config (enable_signup, enable_email_confirmations, enable_sms_confirmations)
VALUES (true, false, false)
ON CONFLICT (id) 
DO UPDATE SET 
  enable_signup = EXCLUDED.enable_signup,
  enable_email_confirmations = EXCLUDED.enable_email_confirmations,
  enable_sms_confirmations = EXCLUDED.enable_sms_confirmations;
