# Claude Code Web UI - Agent Team 配置

## 项目概览
**项目名称**: Claude Code Web UI  
**目标**: 为 Claude Code 开发可视化 Web 界面，支持历史记录查看和技能管理  
**项目类型**: 新项目 (Green Field)  
**预估周期**: 48小时 MVP  

---

## Agent Team 配置

### 🤖 PM (Project Manager) - 项目指挥官
**角色**: @pm

**核心职责**:
- 定义 MVP 范围和优先级
- 技术选型决策
- 进度协调和风险管理
- 跨Agent问题裁决

**关键交付**:
- `docs/PROJECT_STATUS.md` - 项目实时状态
- `docs/MVP_SCOPE.md` - MVP 功能范围定义
- `docs/ARCHITECTURE.md` - 架构设计文档

**决策权限**:
- 有权削减功能需求
- 有权否决技术方案
- 设定 24小时/48小时交付里程碑

---

### 🎨 FE (Frontend Engineer) - 前端攻坚手
**角色**: @fe

**核心职责**:
- Web UI 界面开发
- 响应式布局实现
- 历史记录可视化展示
- Skill 技能查看界面
- Mock 数据搭建（独立运行）

**技术栈建议**:
- React + TypeScript
- Tailwind CSS / Ant Design
- React Query (数据获取)
- MSW (Mock Service Worker)

**关键交付**:
- 可运行的前端界面
- UI 组件库
- Mock API 契约
- `docs/API_CONTRACT.md`

**禁止**:
- ❌ 等待后端就绪才开始
- ✅ Mock 先行，独立运行

---

### ⚙️ BE (Backend Engineer) - 后端抢险员
**角色**: @be

**核心职责**:
- API 服务开发
- 历史记录存储/查询
- Skill 数据管理接口
- 数据持久化层
- Claude Code CLI 集成

**技术栈建议**:
- Node.js + Express / Fastify
- SQLite / PostgreSQL (轻量)
- REST API / tRPC
- 文件系统读取历史记录

**关键交付**:
- 运行的后端服务
- API 端点实现
- 数据库 Schema
- `docs/API_SPEC.md`

**原则**:
- 先让路通再修桥
- Hard Code 允许，必须标记 `// TODO: HARDCODED`

---

### 🧪 QA (Quality Assurance) - 质量守门员
**角色**: @qa

**核心职责**:
- 需求分析和测试设计
- 探索性测试（找崩点）
- 测试用例编写
- 回归测试执行
- 测试数据工厂

**关键交付**:
- `docs/TEST_PLAN.md` - 测试计划
- `docs/EXPLOIT_REPORT.md` - 问题清单
- 测试数据集
- E2E 测试脚本

**工作模式**:
1. 前期: 破坏性探索测试
2. 中期: 功能验证测试
3. 后期: 回归守护测试

---

## 协作流程

### 阶段 1: 启动 (0-2小时)
```
PM: 输出 MVP_SCOPE.md
QA: 分析需求，输出测试要点
FE/BE: 技术选型确认
```

### 阶段 2: 开发 (2-40小时)
```
FE: 搭建前端框架 + Mock API
BE: 搭建后端服务 + 基础API
并行开发，每日同步
```

### 阶段 3: 联调 (40-46小时)
```
FE: 对接真实 API
BE: 修复接口问题
QA: 功能验证测试
```

### 阶段 4: 交付 (46-48小时)
```
QA: 回归测试
PM: 验收确认
全体: Bug 修复
```

---

## 沟通规则

### 信息同步
- 每 2 小时在项目中同步进展
- 发现问题立即 @ 相关角色
- 禁止 "我以为你知道"

### 决策机制
- 技术争议 PM 5 分钟内拍板
- 功能争议 PM 有权直接裁剪
- 紧急问题可越过 PM 直接决策（事后同步）

### 文档规范
- 所有 *.md 文件随代码提交
- 过时文档必须更新或删除
- Mock 数据必须标记 `// TODO: HARDCODED`

---

## 技术栈决策 (建议)

### 前端
- **框架**: React 18 + Vite
- **语言**: TypeScript
- **UI库**: Ant Design 5.x
- **状态管理**: React Query / Zustand
- **路由**: React Router 6

### 后端
- **运行时**: Node.js 20+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: SQLite (轻量，零配置)
- **API**: RESTful

### 集成
- **历史记录**: 读取 Claude Code 本地存储文件
- **Skill**: 解析技能定义文件
- **实时**: 可选 WebSocket (V2考虑)

---

## MVP 功能范围

### P0 (必须有)
- [ ] 首页 Dashboard
- [ ] 历史记录列表展示
- [ ] 历史记录详情查看
- [ ] Skill 技能列表
- [ ] Skill 技能详情

### P1 (应该有)
- [ ] 历史记录搜索/筛选
- [ ] Skill 分类展示
- [ ] 命令快速执行

### P2 (可以有)
- [ ] 历史记录导出
- [ ] 收藏常用命令
- [ ] 主题切换

### P3 (未来)
- [ ] 实时对话界面
- [ ] 多会话管理
- [ ] 插件系统

---

## 快速开始命令

```bash
# PM 启动项目
/pm 初始化项目，创建 MVP_SCOPE.md

# FE 开始前端开发
/fe 搭建 React + TypeScript 项目框架

# BE 开始后端开发
/be 搭建 Express + SQLite 后端服务

# QA 开始测试准备
/qa 分析需求，创建 TEST_PLAN.md
```

---

## 项目文件结构

```
claude-webui/
├── docs/                      # 文档目录
│   ├── PROJECT_STATUS.md      # 项目状态 (PM维护)
│   ├── MVP_SCOPE.md          # 功能范围 (PM维护)
│   ├── ARCHITECTURE.md       # 架构设计 (PM维护)
│   ├── API_CONTRACT.md       # API契约 (FE维护)
│   ├── API_SPEC.md           # API规范 (BE维护)
│   ├── TEST_PLAN.md          # 测试计划 (QA维护)
│   └── EXPLOIT_REPORT.md     # 问题清单 (QA维护)
├── frontend/                  # 前端代码
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                   # 后端代码
│   ├── src/
│   ├── database/
│   └── package.json
└── README.md
```

---

## 成功标准

✅ **48小时后交付**:
1. 前端可独立运行 (Mock数据)
2. 后端服务可启动
3. 基础 API 可调用
4. P0 功能可用
5. 无阻断性 Bug

---

**创建时间**: 2025年2月  
**团队模式**: Project Rescue / Green Field  
**紧急程度**: 🔥 48小时冲刺  
