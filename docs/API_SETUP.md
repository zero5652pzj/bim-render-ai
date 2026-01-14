# MCP工具API配置指南

## 概述

本项目集成了四个MCP工具：天气查询、新闻查询、地图查询和汇率查询。为了使用这些功能，您需要配置相应的API密钥。

## 环境变量配置

### 必需的环境变量

在您的环境变量文件中（`.env` 或部署环境）添加以下变量：

```bash
# ========== AI MCP工具API密钥 ==========

# 天气API - OpenWeatherMap
# 注册地址：https://openweathermap.org/api
# 免费版：每月1000次调用
WEATHER_API_KEY=your_openweathermap_api_key_here

# 新闻API - NewsAPI
# 注册地址：https://newsapi.org/
# 免费版：每月100次调用
NEWS_API_KEY=your_newsapi_key_here

# 汇率API - ExchangeRate-API
# 注册地址：https://exchangerate-api.com/
# 免费版：每月1500次调用
EXCHANGE_API_KEY=your_exchange_rate_api_key_here

# ========== 现有AI配置 ==========

# MiniMax AI（主要）
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
MINIMAX_MODEL_NAME=MiniMax-M2.1
MINIMAX_API_KEY=your_minimax_api_key_here

# OpenAI 兼容API (备用)
OPENAI_BASE_URL=https://api.openai.com/v1
AI_MODEL_NAME=gpt-4
OPENAI_API_KEY=your_openai_api_key_here

# 智谱AI (备用)
ZHIPU_API_KEY=your_zhipu_api_key_here

# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## API服务提供商

### 1. 天气查询 - OpenWeatherMap

**注册流程：**
1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
2. 注册免费账户
3. 获取API密钥
4. 免费版限制：每月1000次调用

**支持功能：**
- 当前天气
- 5天天气预报
- 支持中文城市名

### 2. 新闻查询 - NewsAPI

**注册流程：**
1. 访问 [NewsAPI](https://newsapi.org/)
2. 注册免费账户
3. 获取API密钥
4. 免费版限制：每月100次调用

**支持功能：**
- 按分类获取新闻（科技、体育、娱乐、健康、商业）
- 按关键词搜索新闻
- 支持多个国家（美国、英国、中国、法国、德国等）

### 3. 汇率查询 - ExchangeRate-API

**注册流程：**
1. 访问 [ExchangeRate-API](https://exchangerate-api.com/)
2. 注册免费账户
3. 获取API密钥
4. 免费版限制：每月1500次调用

**支持功能：**
- 实时汇率查询
- 支持17种主要货币
- 批量汇率查询

### 4. 地图查询 - OpenStreetMap Nominatim

**无需API密钥**
- 使用免费的OpenStreetMap Nominatim API
- 支持地点搜索、地理编码、路线规划
- 无调用限制，但请遵守API使用政策

## 功能测试

### 测试API密钥

您可以使用以下方式测试API是否正常工作：

#### 1. 测试天气API
```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=YOUR_WEATHER_API_KEY&units=metric&lang=zh_cn"
```

#### 2. 测试新闻API
```bash
curl "https://newsapi.org/v2/top-headlines?country=cn&apiKey=YOUR_NEWS_API_KEY"
```

#### 3. 测试汇率API
```bash
curl "https://v6.exchangerate-api.com/v6/YOUR_EXCHANGE_API_KEY/latest/USD"
```

## 错误处理

如果API密钥未配置或API调用失败，系统会：

1. **返回友好的错误信息**
2. **不影响其他功能使用**
3. **记录错误日志供调试**

### 错误类型

- `API_KEY_MISSING`: API密钥未配置
- `API_ERROR`: API返回错误
- `RATE_LIMIT`: 请求频率超限
- `NETWORK_ERROR`: 网络错误
- `INVALID_PARAMETERS`: 参数无效

## 成本优化建议

### 免费版使用建议

1. **天气API**: 适合低频使用场景
2. **新闻API**: 适合测试和小规模应用
3. **汇率API**: 适合一般商业应用

### 升级选项

如果需要更高频次使用，可以考虑：

1. **OpenWeatherMap**: 升级到付费版（$40/月，100万次调用）
2. **NewsAPI**: 升级到付费版（$449/月，无限制）
3. **ExchangeRate-API**: 升级到付费版（$10/月，10万次调用）

## 安全注意事项

1. **不要将API密钥提交到版本控制**
2. **使用环境变量存储敏感信息**
3. **定期轮换API密钥**
4. **监控API使用量**

## 部署说明

### Vercel部署

在Vercel项目中：

1. 进入项目设置
2. 导航到"Environment Variables"
3. 添加所有必需的API密钥
4. 重新部署项目

### 本地开发

在项目根目录创建 `.env.local` 文件：

```bash
# 复制模板
cp .env.example .env.local

# 编辑文件，添加API密钥
nano .env.local
```

## 支持的查询示例

### 天气查询
- "北京今天天气怎么样？"
- "上海明天会下雨吗？"
- "广州的气温多少度？"

### 新闻查询
- "今天科技新闻有哪些？"
- "给我看看体育新闻"
- "搜索人工智能相关新闻"

### 地图查询
- "从北京到上海的路线"
- "搜索北京的故宫"
- "上海外滩在哪里？"

### 汇率查询
- "美元对人民币汇率"
- "100欧元等于多少人民币？"
- "现在英镑的汇率是多少？"

## 故障排除

### 常见问题

1. **API密钥无效**
   - 检查密钥是否正确复制
   - 确认账户状态正常
   - 验证API使用量未超限

2. **网络连接错误**
   - 检查防火墙设置
   - 确认网络连接正常
   - 查看Vercel部署日志

3. **响应格式错误**
   - 检查API服务状态
   - 验证请求参数格式
   - 查看错误日志

### 联系支持

如果遇到问题，请：

1. 查看错误日志
2. 检查API服务状态页面
3. 联系相关API提供商支持团队
