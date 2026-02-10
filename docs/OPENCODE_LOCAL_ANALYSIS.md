# OpenCode 桌面版 - 本地功能分析报告

基于对 `/Users/yyp/.local/share/opencode/` 和 `/Users/yyp/.opencode/` 的实际数据分析。

**分析时间**: 2025-02-10  
**数据来源**: 本地 OpenCode 桌面版安装  

---

## 1. 数据存储结构

### 1.1 主数据目录
```
/Users/yyp/.local/share/opencode/
├── auth.json              # API 认证信息
├── bin/                   # 二进制工具
├── log/                   # 运行日志（11个日志文件）
├── storage/               # 核心数据存储
│   ├── message/           # 会话消息（8个会话，~700条消息）
│   ├── part/              # 消息片段/工具执行（695个parts）
│   ├── project/           # 项目信息
│   ├── session/           # 会话元数据
│   ├── session_diff/      # 会话代码变更
│   └── todo/              # 待办事项（5个会话）
└── tool-output/           # 工具执行输出（5个输出）
```

### 1.2 配置目录
```
/Users/yyp/.opencode/
├── config.json           # 本地配置
├── opencode.json         # 用户配置
├── opencode.jsonc        # 带注释的配置（实际使用中）
├── node_modules/         # 插件依赖
└── skills/               # 已安装 Skills
    └── project-manager/  # 项目管理 Skill
```

### 1.3 桌面应用配置
```
/Users/yyp/Library/Application Support/ai.opencode.desktop/
├── .window-state.json    # 窗口状态（位置、大小）
├── opencode.settings.dat # 应用设置（二进制）
├── opencode.global.dat   # 全局数据（~69KB）
└── opencode.workspace.*  # 工作区数据
```

---

## 2. 核心功能模块

### 2.1 📁 项目管理 (Project)
**数据文件**: `/storage/project/global.json`

```json
{
  "id": "global",
  "worktree": "/",
  "sandboxes": [],
  "time": {
    "created": 1770621599288,
    "updated": 1770736351688
  }
}
```

**功能**:
- ✅ 项目目录管理（worktree）
- ✅ 沙箱环境配置（sandboxes）
- ✅ 创建/更新时间戳
- ⚠️ 当前只有 global 项目，没有多项目支持

---

### 2.2 💬 会话管理 (Session)
**数据目录**: `/storage/session/global/`

```json
{
  "id": "ses_3b7d8d14cffernvzGxNuOIQiP5",
  "slug": "silent-star",           // 会话别名（可读的标识）
  "version": "1.1.53",             // OpenCode 版本
  "projectID": "global",
  "directory": "/",                // 工作目录
  "title": "Web UI for Claude Code...",  // 会话标题（可编辑）
  "time": {
    "created": 1770737053363,
    "updated": 1770738716683
  },
  "summary": {
    "additions": 0,
    "deletions": 0,
    "files": 0
  }
}
```

**功能**:
- ✅ 会话创建（自动生成唯一 ID 和 slug）
- ✅ 会话标题（支持自定义）
- ✅ 关联项目和工作目录
- ✅ 创建/更新时间戳
- ✅ 代码变更统计（additions/deletions/files）
- ✅ 会话列表（本地有 8 个活跃会话）

**已发现的会话**:
1. `ses_3b7d8d14cffernvzGxNuOIQiP5` - "Web UI for Claude Code..."
2. `ses_3bc74b4e8ffegO4PpqtPyP9cA7` - "OpenClaw 安装研究"
3. `ses_3beb40a5affeynXYUJ9pVMn252` - "Agent Team 初始化"
4. 其他 5 个会话...

---

### 2.3 📝 消息系统 (Message)
**数据目录**: `/storage/message/{session_id}/`

#### 用户消息
```json
{
  "id": "msg_c48272ebe001gcSoZAZCLtBEcG",
  "sessionID": "ses_3b7d8d14cffernvzGxNuOIQiP5",
  "role": "user",
  "time": {
    "created": 1770737053405
  },
  "summary": {
    "title": "团队设计：Claude Code Web UI...",
    "diffs": []
  },
  "agent": "build",
  "model": {
    "providerID": "kimi-for-coding",
    "modelID": "k2p5"
  }
}
```

#### AI 回复消息
```json
{
  "id": "msg_c48272ee7001TdJkzT33L2xH80",
  "sessionID": "ses_3b7d8d14cffernvzGxNuOIQiP5",
  "role": "assistant",
  "time": {
    "created": 1770737053415,
    "completed": 1770737056792
  },
  "parentID": "msg_c48272ebe001gcSoZAZCLtBEcG",
  "modelID": "k2p5",
  "providerID": "kimi-for-coding",
  "mode": "build",
  "agent": "build",
  "path": {
    "cwd": "/",
    "root": "/"
  },
  "cost": 0,
  "tokens": {
    "input": 10384,
    "output": 199,
    "reasoning": 0,
    "cache": {
      "read": 0,
      "write": 0
    }
  },
  "finish": "tool-calls"
}
```

**功能**:
- ✅ 消息创建时间戳
- ✅ 消息角色（user/assistant）
- ✅ 父子消息关联（parentID）
- ✅ 模型信息（provider + model）
- ✅ 工作路径（cwd/root）
- ✅ Token 消耗统计（input/output/reasoning/cache）
- ✅ 消息完成状态（finish: tool-calls / stop / etc.）
- ✅ Agent 类型（build/ask模式）
- ✅ 代码变更摘要（diffs）

---

### 2.4 🛠️ 工具执行系统 (Tool Execution)
**数据目录**: `/storage/part/{message_id}/`

#### Part 类型

**1. 文本消息 (type: text)**
```json
{
  "id": "prt_c414bf5b8001LNwpHT2nNl6nj1",
  "sessionID": "ses_3beb40a5affeynXYUJ9pVMn252",
  "messageID": "msg_c414bf5b7001XcQFDQ0ECZzUr7",
  "type": "text",
  "text": "研究一下openclaw，这个电脑是否可以安装"
}
```

**2. 工具调用 (type: tool)**
```json
{
  "id": "prt_c47d67569001DiyS7Tsbd8vjj7",
  "sessionID": "ses_3bc74b4e8ffegO4PpqtPyP9cA7",
  "messageID": "msg_c47d64f110013prFBgWp7qPHcS",
  "type": "tool",
  "callID": "tool_Z5x0f4iqBOTYR9Fmio2vD7Kq",
  "tool": "read",
  "state": {
    "status": "completed",
    "input": {
      "filePath": "/Users/yyp/.openclaw/openclaw.json",
      "limit": 50
    },
    "output": "<file>...文件内容...</file>",
    "title": "Users/yyp/.openclaw/openclaw.json",
    "metadata": {
      "preview": "预览内容...",
      "truncated": true
    },
    "time": {
      "start": 1770731763962,
      "end": 1770731763966
    }
  }
}
```

**3. 步骤完成 (type: step-finish)**
```json
{
  "id": "prt_c47d679f5001tuLcbjOdmzizKY",
  "sessionID": "ses_3bc74b4e8ffegO4PpqtPyP9cA7",
  "messageID": "msg_c47d64f110013prFBgWp7qPHcS",
  "type": "step-finish",
  "reason": "tool-calls",
  "cost": 0,
  "tokens": {
    "input": 103522,
    "output": 173,
    "reasoning": 0,
    "cache": {
      "read": 0,
      "write": 0
    }
  }
}
```

**支持的工具类型**:
- `read` - 读取文件
- `edit` - 编辑文件
- `bash` - 执行命令
- `glob` - 文件搜索
- `grep` - 内容搜索
- `webfetch` - Web 获取
- 其他内部工具...

**工具执行状态**:
- `pending` - 等待执行
- `running` - 执行中
- `completed` - 完成
- `error` - 错误

**功能**:
- ✅ 工具类型识别
- ✅ 输入参数记录
- ✅ 输出结果存储（可能截断）
- ✅ 执行时间统计
- ✅ 执行状态追踪
- ✅ Token 消耗统计

---

### 2.5 ✅ 待办事项 (Todo)
**数据目录**: `/storage/todo/{session_id}.json`

```json
[
  {
    "content": "创建项目基础结构",
    "status": "completed",
    "priority": "high",
    "id": "1"
  },
  {
    "content": "定义技术架构文档",
    "status": "completed",
    "priority": "high",
    "id": "2"
  },
  {
    "content": "FE: 开发前端界面",
    "status": "pending",
    "priority": "high",
    "id": "3"
  }
]
```

**功能**:
- ✅ 任务内容
- ✅ 状态管理（pending/in_progress/completed）
- ✅ 优先级标记（high/medium/low）
- ✅ 唯一 ID
- ✅ 按会话隔离

**当前数据**:
- 5 个会话有待办事项
- 包含项目初始化、开发任务等

---

### 2.6 📊 会话差异追踪 (Session Diff)
**数据目录**: `/storage/session_diff/{session_id}.json`

**功能**:
- ✅ 追踪会话期间的代码变更
- ✅ 统计 additions/deletions
- ✅ 记录变更文件列表
- ✅ 支持 Diff 对比

---

### 2.7 🎯 Skill 系统
**数据目录**: `/Users/yyp/.opencode/skills/`

```
skills/
└── project-manager/
    └── SKILL.md
```

**SKILL.md 格式**:
```markdown
---
name: project-manager
description: Project Manager role for software development teams...
---

# Project Manager (PM) Skill

You are acting as a Project Manager...
```

**功能**:
- ✅ YAML Frontmatter 元数据
- ✅ Markdown 内容
- ✅ 本地安装管理
- ✅ 版本控制（通过 Git）

**当前安装的 Skills**:
1. `project-manager` - 项目管理助手

---

### 2.8 🔐 认证系统
**数据文件**: `/Users/yyp/.local/share/opencode/auth.json`

```json
{
  "kimi-for-coding": {
    "type": "api",
    "key": "sk-kimi-..."
  },
  "mmkg": {
    "type": "api",
    "key": "sk-..."
  }
}
```

**支持的认证方式**:
- API Key 认证
- OAuth 认证（GitHub Copilot、GitLab 等）

**功能**:
- ✅ 多提供商支持
- ✅ 安全的密钥存储
- ✅ 插件扩展（内部插件 + 外部插件）

**当前配置的提供商**:
1. `kimi-for-coding` - Kimi Coding API
2. `mmkg` - MMKG API

---

### 2.9 🔌 插件系统
**日志中发现**:
```
INFO  loading internal plugin: CodexAuthPlugin
INFO  loading internal plugin: CopilotAuthPlugin
INFO  loading internal plugin: gitlabAuthPlugin
INFO  loading plugin: opencode-anthropic-auth@0.0.13
```

**内置插件**:
1. CodexAuthPlugin - OpenAI Codex 认证
2. CopilotAuthPlugin - GitHub Copilot 认证
3. gitlabAuthPlugin - GitLab 认证

**外部插件**:
- opencode-anthropic-auth@0.0.13 - Anthropic 认证

**功能**:
- ✅ 内部插件（内置）
- ✅ 外部插件（npm 包）
- ✅ 认证提供商扩展
- ✅ 动态加载

---

### 2.10 🖥️ LSP 支持
**日志中发现**:
```
INFO  enabled LSP servers: deno, typescript, vue, eslint, 
      oxlint, biome, gopls, ruby-lsp, pyright, elixir-ls, 
      zls, csharp, fsharp, sourcekit-lsp, rust, clangd, 
      svelte, astro, jdtls, kotlin-ls, yaml-ls, lua-ls, 
      php intelephense, prisma, dart, ocaml-lsp, bash, 
      terraform, texlab, dockerfile, gleam, clojure-lsp, 
      nixd, tinymist, haskell-language-server
```

**支持的 LSP 服务器（35+）**:
- JavaScript/TypeScript: deno, typescript, eslint
- Python: pyright
- Go: gopls
- Rust: rust, clangd
- Java: jdtls
- Kotlin: kotlin-ls
- Ruby: ruby-lsp
- PHP: intelephense
- 等等...

**功能**:
- ✅ 自动检测项目类型
- ✅ 启动对应 LSP
- ✅ 为 LLM 提供代码上下文
- ✅ 实时代码分析

---

### 2.11 📝 日志系统
**数据目录**: `/Users/yyp/.local/share/opencode/log/`

**日志文件（11个）**:
- 2026-02-09T071959.log
- 2026-02-09T072005.log
- ...
- 2026-02-09T164333.log（最大，~9.8MB）

**日志格式**:
```
INFO  2026-02-09T16:43:33 +766ms service=default version=1.1.53 
      args=["serve","--hostname","127.0.0.1","--port","51419"] opencode
```

**功能**:
- ✅ 服务启动日志
- ✅ HTTP 请求日志
- ✅ 插件加载日志
- ✅ LSP 服务日志
- ✅ 错误和警告

---

### 2.12 🖼️ 桌面应用功能
**配置文件**: `/Users/yyp/Library/Application Support/ai.opencode.desktop/`

#### 窗口状态
```json
{
  "main": {
    "width": 1736,
    "height": 1602,
    "x": 1036,
    "y": 50,
    "prev_x": 1034,
    "prev_y": 50,
    "maximized": false,
    "visible": true,
    "decorated": true,
    "fullscreen": false
  }
}
```

**功能**:
- ✅ 窗口位置和大小记忆
- ✅ 最大化/最小化状态
- ✅ 全屏模式
- ✅ 可见性控制

#### 应用设置
- 二进制格式存储
- 用户偏好设置
- 主题配置

#### 全局数据
- 约 69KB 二进制数据
- 包含跨会话的配置

---

## 3. API 接口

**从日志中发现的 API 端点**:

### 健康检查
- `GET /global/health` - 服务健康状态

### 全局配置
- `GET /global/config` - 获取全局配置
- `GET /global/event` - 全局事件流（WebSocket）

### 项目管理
- `GET /project` - 项目列表
- `GET /path` - 路径信息

### 提供商管理
- `GET /provider` - 提供商列表
- `GET /provider/auth` - 认证信息

### 会话管理
- `GET /session` - 会话列表
- WebSocket 实时更新（session.updated, message.updated）

---

## 4. 统计概览

### 数据规模
- **会话数**: 8 个活跃会话
- **消息数**: ~700 条（分布在8个会话中）
- **Parts**: 695 个消息片段
- **工具执行**: 5 个工具输出记录
- **Skills**: 1 个已安装（project-manager）
- **Todo**: 5 个会话有 todo 列表
- **日志文件**: 11 个，总大小 ~11MB
- **LSP 服务器**: 35+ 种语言支持

### 存储占用
- `storage/message/`: 最多 324 个文件/会话
- `storage/part/`: 695 个 parts
- `log/`: ~11MB 日志
- 总计: ~20-30MB

---

## 5. 功能总结

### 已实现功能 ✅

**核心对话**:
- [x] 多会话管理
- [x] 消息时间线
- [x] 父子消息关联
- [x] Token 消耗统计

**工具系统**:
- [x] 文件读写 (read/edit)
- [x] 命令执行 (bash)
- [x] 文件搜索 (glob/grep)
- [x] Web 获取 (webfetch)
- [x] 工具执行状态追踪
- [x] 执行时间统计

**开发辅助**:
- [x] LSP 集成（35+ 语言）
- [x] 代码变更追踪
- [x] Session Diff
- [x] 待办事项管理

**扩展性**:
- [x] Skill 系统
- [x] 插件系统（内部 + 外部）
- [x] 多提供商认证

**桌面应用**:
- [x] 窗口状态记忆
- [x] 本地数据存储
- [x] 实时事件流（WebSocket）
- [x] 日志系统

### 未发现/未确认功能 ❓

- [ ] 全局搜索（可能存在但未在数据中发现）
- [ ] 主题切换（Light/Dark）
- [ ] 导出功能
- [ ] 统计图表
- [ ] 多窗口支持
- [ ] 云端同步
- [ ] 用户认证界面

---

## 6. 数据结构总结

### 核心实体关系
```
Project (1) ───────< (N) Session
                         │
                         │
                    (1) ─┴─ (N) Message
                              │
                              │
                         (1) ─┴─ (N) Part
                                   │
                                   ├── type: text
                                   ├── type: tool
                                   └── type: step-finish
```

### 关键 ID 格式
- **Session ID**: `ses_{timestamp}{random}` (e.g., `ses_3b7d8d14cffernvzGxNuOIQiP5`)
- **Message ID**: `msg_{timestamp}{random}` (e.g., `msg_c48272ebe001gcSoZAZCLtBEcG`)
- **Part ID**: `prt_{timestamp}{random}` (e.g., `prt_c414bf5b8001LNwpHT2nNl6nj1`)
- **Tool Call ID**: `tool_{random}` (e.g., `tool_Z5x0f4iqBOTYR9Fmio2vD7Kq`)

---

## 7. 为 Claude Web UI 的功能建议

基于 OpenCode 桌面版的实际功能，建议 Claude Web UI 优先实现：

### 🔴 P0（核心功能）
1. **会话管理** - 参考 Session 数据结构
2. **消息展示** - 支持多种 Part 类型
3. **工具执行记录** - 详细展示 tool calls
4. **Token 统计** - input/output/cache
5. **Todo 管理** - 简单的任务列表

### 🟡 P1（增强功能）
6. **代码变更 Diff** - session_diff 展示
7. **LSP 状态显示** - 显示当前启用的 LSP
8. **日志查看器** - 实时日志展示
9. **多提供商切换** - 认证管理

### 🟢 P2（高级功能）
10. **Skill 管理界面** - 安装/启用/配置
11. **插件管理** - 浏览和安装插件
12. **全局搜索** - 跨会话搜索
13. **统计面板** - 使用数据分析

---

**文档版本**: 1.0  
**数据来源**: OpenCode Desktop v1.1.53  
**最后更新**: 2025-02-10  
