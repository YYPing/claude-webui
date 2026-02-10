# Claude Code Web UI - 技术架构

## 项目概述
为 Claude Code 提供可视化 Web 界面，支持历史记录查看和 Skill 技能管理。

---

## 技术栈决策

### 前端 (FE)
| 组件 | 选择 | 理由 |
|------|------|------|
| 框架 | React 18 | 生态成熟，团队熟悉 |
| 构建工具 | Vite 5 | 快速冷启动，现代ESM |
| 语言 | TypeScript 5 | 类型安全，IDE友好 |
| UI库 | Ant Design 5 | 企业级组件，文档完善 |
| 状态管理 | React Query (TanStack) | 服务器状态管理 |
| 路由 | React Router 6 | 官方推荐 |
| 样式 | Tailwind CSS + Ant Design | 快速开发 |

### 后端 (BE)
| 组件 | 选择 | 理由 |
|------|------|------|
| 运行时 | Node.js 20 LTS | 长期支持 |
| 框架 | Express.js 4 | 简单稳定，生态丰富 |
| 语言 | TypeScript 5 | 类型安全 |
| 数据库 | SQLite 3 | 零配置，轻量 |
| ORM | Prisma | 类型安全ORM |
| API格式 | REST JSON | 简单通用 |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dashboard  │  │  History     │  │   Skills     │       │
│  │   Page       │  │  Module      │  │   Module     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend (Express)                      │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  API Routes      │  │  Controllers     │                 │
│  │  /api/history    │  │  HistoryCtrl     │                 │
│  │  /api/skills     │  │  SkillsCtrl      │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Services        │  │  Database        │                 │
│  │  HistoryService  │  │  SQLite + Prisma │                 │
│  │  SkillsService   │  │                  │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  SQLite DB       │  │  File System     │                 │
│  │  (indexed data)  │  │  (raw history)   │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 数据流

### 历史记录查看
```
User → Frontend → GET /api/history?page=1&limit=20 → Backend → SQLite → Response → Render
```

### Skill 查看
```
User → Frontend → GET /api/skills → Backend → File System Scan → Response → Render
```

### 初始数据同步
```
Backend Startup → Scan ~/.claude/history/ → Parse → Store in SQLite → Index
```

---

## API 设计

### History API
```typescript
// GET /api/history
interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  status: 'success' | 'error' | 'running';
  duration: number;
}

// GET /api/history/:id
interface HistoryDetailResponse extends HistoryItem {
  fullOutput: string;
  metadata: Record<string, any>;
}
```

### Skills API
```typescript
// GET /api/skills
interface SkillsListResponse {
  items: Skill[];
  categories: string[];
}

interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  installed: boolean;
}

// GET /api/skills/:id
interface SkillDetailResponse extends Skill {
  content: string;  // SKILL.md content
  examples: string[];
  parameters: Parameter[];
}
```

---

## 数据库 Schema (Prisma)

```prisma
model History {
  id        String   @id @default(uuid())
  timestamp DateTime
  command   String
  output    String
  status    String   // success | error | running
  duration  Int      // milliseconds
  createdAt DateTime @default(now())
  
  @@index([timestamp])
  @@index([status])
}

model Skill {
  id          String   @id @default(uuid())
  name        String   @unique
  description String
  version     String
  category    String
  installed   Boolean  @default(false)
  content     String   // Full SKILL.md
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([installed])
}
```

---

## 目录结构

```
claude-webui/
├── docs/
│   ├── PROJECT_STATUS.md      # 项目状态 (实时更新)
│   ├── MVP_SCOPE.md          # 功能范围
│   ├── ARCHITECTURE.md       # 本文件
│   ├── API_CONTRACT.md       # API契约 (FE维护)
│   ├── API_SPEC.md           # API规范 (BE维护)
│   └── DECISION_LOG.md       # 决策日志
├── frontend/
│   ├── src/
│   │   ├── components/       # UI组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── services/        # API服务
│   │   ├── types/           # TypeScript类型
│   │   └── App.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── models/          # 数据模型
│   │   ├── utils/           # 工具函数
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 开发工作流

### 并行开发策略
1. **FE 和 BE 并行** - 使用 Mock API 解耦
2. **Mock 先行** - FE 使用 MSW 模拟后端
3. **每日同步** - 每晚对齐 API 契约

### 集成步骤
1. FE 完成 Mock 版本 (Day 1)
2. BE 完成基础 API (Day 1)
3. 联调测试 (Day 2)
4. Bug 修复 (Day 2)

---

## 性能考虑

### 前端
- 虚拟滚动处理大量历史记录
- React Query 缓存策略
- 懒加载路由

### 后端
- SQLite 索引优化
- 分页查询 (max 100 items/page)
- 文件系统扫描缓存 (5分钟)

---

## 安全考虑

- CORS 限制为本地开发
- 输入验证 (zod)
- SQL 注入防护 (Prisma ORM)
- 文件系统只读访问

---

## 扩展性

### V2 考虑
- WebSocket 实时更新
- 插件系统
- 多用户支持
- 云端同步

---

**创建时间**: 2025年2月  
**最后更新**: 2025年2月  
**负责人**: PM  
