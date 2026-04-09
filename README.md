# 现代文阅读练习与智能批阅平台


## 🎯 核心功能

### 学生端
- **专题分类练习**：按记叙文、议论文、说明文等专题分类组织阅读题目
- **在线答题**：阅读文章后在线作答，支持文本输入
- **AI 智能批阅**：提交答案后由 DeepSeek AI 进行自动评分和点评
- **成绩追踪**：查看练习历史、成绩统计、错题分析
- **即时反馈**：获得 AI 生成的详细评语和改进建议

### 教师端
- **题库管理**：创建和管理专题、文章、题目、标准答案和评分标准
- **语音录入**：通过语音朗读快速批量添加阅读文章和题目内容
- **数据分析**：可视化展示学生练习数据、专题掌握情况、常见错误类型
- **批量批阅**：对多个学生的答案进行批量 AI 批阅

## 🏗️ 技术栈

### 前端
- **React 19** + **TypeScript**：现代化的 UI 框架
- **Tailwind CSS 4**：极简高效的样式系统
- **Shadcn/UI**：美观的组件库
- **Recharts**：数据可视化图表
- **Wouter**：轻量级路由管理

### 后端
- **Express 4**：高效的 Node.js 服务框架
- **tRPC 11**：端到端类型安全的 API
- **Drizzle ORM**：类型安全的数据库 ORM
- **MySQL/TiDB**：关系型数据库

### AI 集成
- **DeepSeek LLM**：智能批阅和评分引擎
- **Whisper API**：语音转文字功能

### 认证与授权
- **Manus OAuth**：统一身份认证
- **基于角色的访问控制**：支持 admin 和 user 两种角色

## 📊 数据库设计

### 核心表结构

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `topics` | 专题分类 | id, name, description, createdAt |
| `articles` | 阅读文章 | id, topicId, title, content, author |
| `questions` | 题目 | id, articleId, questionText, standardAnswer, maxScore |
| `submissions` | 答题记录 | id, userId, articleId, submittedAt, status |
| `gradings` | AI 批阅结果 | id, submissionId, score, feedback, gradedAt |

## 🚀 快速开始

### 前置要求
- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL 8.0+ 或 TiDB

### 安装依赖
```bash
cd modern-chinese-practice
pnpm install
```

### 环境配置
系统自动注入以下环境变量：
- `DATABASE_URL`：MySQL 连接字符串
- `JWT_SECRET`：会话加密密钥
- `VITE_APP_ID`：Manus OAuth 应用 ID
- `OAUTH_SERVER_URL`：OAuth 服务地址
- `BUILT_IN_FORGE_API_URL`：Manus 内置 API 地址
- `BUILT_IN_FORGE_API_KEY`：API 密钥

### 数据库迁移
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 开发模式
```bash
pnpm dev
```
访问 `http://localhost:3000`

### 生产构建
```bash
pnpm build
pnpm start
```

### 运行测试
```bash
pnpm test
```
当前包含 34 个单元测试，覆盖认证、专题、文章、题目、答题、语音、数据分析等核心功能。

## 📁 项目结构

```
modern-chinese-practice/
├── client/                    # 前端 React 应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   │   ├── Home.tsx       # 首页
│   │   │   ├── Topics.tsx     # 专题列表
│   │   │   ├── TopicDetail.tsx # 专题详情
│   │   │   ├── Practice.tsx   # 答题页
│   │   │   ├── Result.tsx     # 批阅结果
│   │   │   ├── History.tsx    # 练习历史
│   │   │   ├── Admin.tsx      # 管理后台
│   │   │   └── Analytics.tsx  # 数据分析
│   │   ├── components/        # 可复用组件
│   │   │   └── Navbar.tsx     # 导航栏
│   │   ├── lib/               # 工具函数
│   │   ├── index.css          # 全局样式
│   │   └── App.tsx            # 路由配置
│   └── index.html
├── server/                    # 后端 Express 应用
│   ├── routers.ts            # tRPC 路由定义
│   ├── db.ts                 # 数据库查询函数
│   ├── storage.ts            # S3 文件存储
│   ├── api.test.ts           # API 单元测试
│   └── _core/                # 框架核心
│       ├── index.ts          # 服务器入口
│       ├── context.ts        # tRPC 上下文
│       ├── llm.ts            # LLM 调用
│       ├── voiceTranscription.ts # 语音转文字
│       └── ...
├── drizzle/                   # 数据库 ORM
│   ├── schema.ts             # 表定义
│   └── migrations/           # 迁移文件
├── shared/                    # 共享常量和类型
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 设计风格

采用 Apple 官网的极简设计风格：
- **排版**：大标题、清晰的信息层级
- **色彩**：以蓝色（#0071e3）为主色，辅以灰色系
- **间距**：充分的留白，卡片式布局
- **交互**：圆润的按钮、平滑的过渡动画
- **字体**：系统字体栈，优化中文显示

## 🔌 API 端点

### 认证
- `auth.me` - 获取当前用户信息
- `auth.logout` - 登出

### 专题管理
- `topic.list` - 获取专题列表
- `topic.create` - 创建专题（管理员）
- `topic.getById` - 获取专题详情
- `topic.update` - 更新专题（管理员）
- `topic.delete` - 删除专题（管理员）

### 文章管理
- `article.listByTopic` - 获取专题下的文章列表
- `article.getById` - 获取文章详情
- `article.create` - 创建文章（管理员）
- `article.update` - 更新文章（管理员）
- `article.delete` - 删除文章（管理员）

### 题目管理
- `question.listByArticle` - 获取文章下的题目列表
- `question.create` - 创建题目（管理员）
- `question.update` - 更新题目（管理员）
- `question.delete` - 删除题目（管理员）

### 答题与批阅
- `submission.submit` - 提交答案
- `submission.grade` - 对单个答案进行 AI 批阅
- `submission.gradeAll` - 批量 AI 批阅
- `submission.myHistory` - 获取当前用户的答题历史
- `submission.myArticleSubmissions` - 获取用户在某篇文章上的答题记录
- `submission.getGrading` - 获取批阅结果

### 语音转文字
- `voice.transcribe` - 将音频转换为文字（管理员）

### 数据分析
- `analytics.studentStats` - 获取学生个人统计数据
- `analytics.adminDashboard` - 获取管理员数据看板（管理员）

## 🔐 认证与授权

### 用户角色
- **admin**：教师/管理员，可以创建和管理题库、查看数据分析
- **user**：学生，可以练习答题、查看个人成绩

### 受保护的 API
使用 `protectedProcedure` 包装需要认证的 API，使用 `adminProcedure` 包装仅管理员可访问的 API。

## 📝 使用示例

### 学生答题流程
1. 访问首页，点击"开始练习"
2. 选择专题分类
3. 选择文章进行阅读
4. 填写答题表单并提交
5. 等待 AI 批阅，查看评分和反馈

### 教师管理流程
1. 登录管理后台
2. 创建专题分类
3. 添加阅读文章和题目
4. 设置标准答案和评分标准
5. 查看学生练习数据和分析报表

## 🚧 待实现功能

- [ ] 错题本功能
- [ ] 学生对 AI 批阅结果的申诉机制
- [ ] 班级管理和学生分组
- [ ] 练习计划和学习路径推荐
- [ ] 导出成绩报表为 Excel
- [ ] 移动端适配优化

## 🐛 已知问题

- 语音转文字功能依赖 Whisper API，可能存在转写准确率问题
- 大量并发批阅时可能出现 API 限流

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

**开发于 2026 年 4 月**
