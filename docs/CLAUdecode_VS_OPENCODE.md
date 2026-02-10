# Claude Code vs OpenCode 功能对比分析

**分析时间**: 2025-02-11  
**Claude Code 版本**: 本地安装版  
**OpenCode 版本**: 桌面版 v1.1.53  

---

## 1. 核心功能对比

### 1.1 会话管理

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| 会话创建 | ✅ 自动创建 | ✅ 自动创建 | 两者都支持 |
| 会话标题 | ✅ 可编辑 | ✅ 可编辑 | 两者都支持 |
| 会话列表 | ✅ history.jsonl | ✅ storage/session/ | Claude 用单文件，OpenCode 用目录 |
| 会话恢复 | ✅ `--resume` | ✅ 自动恢复 | 两者都支持 |
| 多会话并行 | ⚠️ 有限支持 | ✅ 完全支持 | OpenCode 支持多窗口/标签页 |
| 会话别名(Slug) | ❌ 无 | ✅ 有 | OpenCode 有可读别名 |
| 会话统计 | ⚠️ 基础 | ✅ 详细 | OpenCode 有 additions/deletions/files |

**Claude Code 数据结构**:
```json
{
  "display": "消息内容",
  "timestamp": 1770726918400,
  "project": "/Users/yyp",
  "sessionId": "fb6c3f92-3600-4155-9f31-80db5ec3aa6c"
}
```

**OpenCode 数据结构**:
```json
{
  "id": "ses_3b7d8d14cffernvzGxNuOIQiP5",
  "slug": "silent-star",
  "title": "Web UI for Claude Code...",
  "summary": {
    "additions": 0,
    "deletions": 0,
    "files": 0
  }
}
```

---

### 1.2 消息系统

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| 消息时间戳 | ✅ 有 | ✅ 有 | 两者都支持 |
| 角色区分 | ✅ user/assistant | ✅ user/assistant | 两者都支持 |
| Token 统计 | ❌ 不显示 | ✅ 详细统计 | OpenCode 有 input/output/cache |
| 父子消息关联 | ❌ 不明显 | ✅ parentID | OpenCode 消息关系清晰 |
| 消息状态 | ⚠️ 简单 | ✅ 完整 | OpenCode 有 finish 状态 |
| 粘贴内容追踪 | ✅ pastedContents | ❌ 无 | Claude 特有 |
| 代码变更摘要 | ❌ 无 | ✅ diffs | OpenCode 特有 |

**Claude Code 消息结构**:
- 存储在 `history.jsonl`（单行 JSON）
- 包含 `display`（显示内容）
- 包含 `pastedContents`（粘贴内容追踪）
- 简单时间戳

**OpenCode 消息结构**:
- 存储在 `storage/message/{session_id}/` 目录
- 每个消息一个 JSON 文件
- 包含完整的 Token 消耗
- 包含模型信息
- 包含工作路径

---

### 1.3 工具执行系统

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| 文件读写 | ✅ Read/Edit | ✅ read/edit | 两者都支持 |
| 命令执行 | ✅ Bash | ✅ bash | 两者都支持 |
| 文件搜索 | ✅ Glob/Grep | ✅ glob/grep | 两者都支持 |
| Web 获取 | ✅ WebFetch | ✅ webfetch | 两者都支持 |
| 工具执行记录 | ⚠️ 命令行显示 | ✅ 完整存储 | OpenCode 有详细存储 |
| 执行状态追踪 | ⚠️ 实时显示 | ✅ 完整记录 | OpenCode 有 pending/running/completed |
| 执行时长统计 | ⚠️ 实时显示 | ✅ 完整记录 | OpenCode 有 start/end 时间 |
| 工具输出存储 | ❌ 不存储 | ✅ storage/part/ | OpenCode 持久化存储 |

**Claude Code 工具执行**:
- 实时显示在终端
- 需要用户确认（权限系统）
- 不持久化存储执行记录

**OpenCode 工具执行**:
- 存储在 `storage/part/{message_id}/`
- 每个工具调用一个 JSON 文件
- 包含完整输入/输出/状态/时间

---

### 1.4 Agent/技能系统

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| Agent 定义 | ✅ settings.json | ❌ 无 | Claude Code 特有 |
| 多 Agent 模式 | ✅ Agent Teams | ❌ 无 | Claude Code 特有 |
| Skill 系统 | ❌ 无 | ✅ .opencode/skills/ | OpenCode 特有 |
| 插件系统 | ❌ 无 | ✅ 内置+外部插件 | OpenCode 特有 |
| MCP 支持 | ✅ `claude mcp` | ❌ 无 | Claude Code 特有 |
| 权限控制 | ✅ 详细权限 | ❌ 基础 | Claude Code 权限更细 |

**Claude Code Agent Teams**:
```json
{
  "agents": {
    "pm": {
      "description": "项目经理",
      "prompt": "你是一位项目经理...",
      "allowedTools": ["Read", "Edit", "Write"]
    },
    "fe": {
      "description": "前端工程师",
      "prompt": "你是一位前端工程师...",
      "allowedTools": ["Read", "Edit", "Write", "Bash"]
    }
  }
}
```

**OpenCode Skills**:
```
~/.opencode/skills/
└── project-manager/
    └── SKILL.md
```

---

### 1.5 项目/工作区管理

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| 工作目录 | ✅ 当前目录 | ✅ worktree | 两者都支持 |
| 项目切换 | ✅ 目录切换 | ✅ 项目切换 | 两者都支持 |
| 多项目支持 | ⚠️ 有限 | ✅ 完整 | OpenCode 有 project 概念 |
| 项目元数据 | ⚠️ 基础 | ✅ 详细 | OpenCode 有创建/更新时间 |
| 沙箱支持 | ❌ 无 | ✅ sandboxes | OpenCode 特有 |

**Claude Code**:
- 基于当前工作目录
- `project` 字段在 history 中
- 简单的项目识别

**OpenCode**:
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

---

### 1.6 待办事项管理

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| 待办列表 | ✅ ~/.claude/todos/ | ✅ storage/todo/ | 两者都支持 |
| 任务状态 | ✅ pending/completed | ✅ pending/in_progress/completed | OpenCode 多一个状态 |
| 优先级 | ❌ 无 | ✅ high/medium/low | OpenCode 特有 |
| 按会话隔离 | ✅ 是 | ✅ 是 | 两者都支持 |
| 任务分配 | ✅ Agent 任务 | ❌ 无 | Claude Code 特有 |

**Claude Code Todos**:
```
~/.claude/todos/
└── {session-id}-agent-{agent-id}.json
```

**OpenCode Todos**:
```
~/.local/share/opencode/storage/todo/
└── {session_id}.json
```

---

### 1.7 配置与设置

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| 全局配置 | ✅ ~/.claude/settings.json | ✅ ~/.opencode/config.json | 两者都支持 |
| 本地配置 | ✅ settings.local.json | ✅ opencode.jsonc | 两者都支持 |
| 环境变量 | ✅ 支持 | ✅ 支持 | 两者都支持 |
| 权限配置 | ✅ 详细 | ⚠️ 基础 | Claude Code 权限更细 |
| 模型配置 | ✅ --model | ✅ 多提供商 | OpenCode 支持更多提供商 |
| LSP 配置 | ❌ 无 | ✅ 35+ 语言 | OpenCode 特有 |

**Claude Code 配置**:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "locale": "zh-CN",
  "teammateMode": "tmux",
  "agents": { ... }
}
```

**OpenCode 配置**:
```json
{
  "provider": {
    "kimi-for-coding": {
      "models": { ... },
      "options": {
        "baseURL": "https://code.mmkg.cloud/v1"
      }
    }
  }
}
```

---

### 1.8 开发者功能

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| LSP 支持 | ❌ 无 | ✅ 35+ 服务器 | OpenCode 特有 |
| Chrome 集成 | ✅ --chrome | ❌ 无 | Claude Code 特有 |
| IDE 集成 | ✅ --ide | ❌ 无 | Claude Code 特有 |
| Debug 模式 | ✅ --debug | ✅ log/ | 两者都支持 |
| 日志记录 | ⚠️ 基础 | ✅ 详细 | OpenCode 日志更详细 |
| 插件系统 | ❌ 无 | ✅ 内置+外部 | OpenCode 特有 |
| MCP 服务器 | ✅ 支持 | ❌ 无 | Claude Code 特有 |

**OpenCode LSP 支持的语言**:
- JavaScript/TypeScript: deno, typescript, eslint
- Python: pyright
- Go: gopls
- Rust: rust
- Java: jdtls
- 等 35+ 种语言

---

### 1.9 认证与提供商

| 功能 | Claude Code | OpenCode | 对比说明 |
|------|-------------|----------|----------|
| Anthropic | ✅ 默认 | ✅ 插件 | 两者都支持 |
| API Key | ✅ 支持 | ✅ 支持 | 两者都支持 |
| GitHub Copilot | ⚠️ 计划中 | ✅ 插件 | OpenCode 已支持 |
| OpenAI | ⚠️ 计划中 | ✅ 插件 | OpenCode 已支持 |
| 多提供商切换 | ⚠️ 有限 | ✅ 完整 | OpenCode 更灵活 |

**Claude Code 认证**:
- 主要通过 Anthropic
- 支持 `setup-token` 设置长期 Token
- 支持 `--model` 切换模型

**OpenCode 认证**:
```json
{
  "kimi-for-coding": {
    "type": "api",
    "key": "sk-..."
  },
  "mmkg": {
    "type": "api",
    "key": "sk-..."
  }
}
```

---

## 2. CLI 命令对比

### Claude Code CLI
```bash
# 基础命令
claude                    # 启动交互式会话
claude --print            # 非交互模式
claude --continue         # 继续最近会话
claude --resume [id]      # 恢复指定会话

# Agent 相关
claude --agent <agent>    # 指定 Agent
claude --agents <json>    # 自定义 Agents

# 工具控制
claude --allowed-tools    # 允许的工具
claude --disallowed-tools # 禁止的工具
claude --tools            # 指定工具列表

# 配置
claude --model            # 选择模型
claude --system-prompt    # 系统提示词
claude --settings         # 设置文件
claude --permission-mode  # 权限模式

# 开发
claude --debug            # 调试模式
claude --chrome           # Chrome 集成
claude --ide              # IDE 集成

# MCP
claude mcp add            # 添加 MCP 服务器
claude mcp list           # 列出 MCP 服务器

# 管理
claude doctor             # 健康检查
claude update             # 更新
claude install            # 安装
```

### OpenCode CLI
```bash
# 基础命令（主要通过桌面应用）
# OpenCode 主要是桌面应用，CLI 功能较少
```

---

## 3. 数据存储对比

### 存储结构

**Claude Code**:
```
~/.claude/
├── CLAUDE.md              # 项目配置
├── settings.json          # 全局设置
├── settings.local.json    # 本地设置
├── history.jsonl          # 历史记录（单行 JSON）
├── cache/                 # 缓存
├── debug/                 # 调试信息
├── plugins/               # 插件
│   └── marketplaces/      # 插件市场
├── projects/              # 项目
├── session-env/           # 会话环境
├── shell-snapshots/       # Shell 快照
├── tasks/                 # 任务
│   ├── feature-dev-team
│   └── project-rescue
├── teams/                 # 团队
│   ├── feature-dev-team
│   └── project-rescue
├── todos/                 # 待办
│   └── {session}-agent-{agent}.json
└── telemetry/             # 遥测数据
```

**OpenCode**:
```
~/.local/share/opencode/
├── auth.json              # API 认证
├── log/                   # 日志文件
│   └── 2026-02-09T*.log
├── storage/
│   ├── message/           # 消息（按会话分目录）
│   ├── part/              # 工具执行记录
│   ├── project/           # 项目信息
│   ├── session/           # 会话元数据
│   ├── session_diff/      # 代码变更
│   └── todo/              # 待办事项
└── tool-output/           # 工具输出

~/.opencode/
├── config.json            # 配置
├── opencode.jsonc         # 带注释的配置
└── skills/                # Skills
    └── project-manager/
```

### 存储方式对比

| 特性 | Claude Code | OpenCode | 说明 |
|------|-------------|----------|------|
| 历史记录格式 | JSONL | JSON 目录 | Claude 用追加文件，OpenCode 用目录 |
| 消息存储 | 单文件 | 多文件 | Claude 一个文件，OpenCode 按会话分 |
| 工具记录 | 不存储 | 完整存储 | OpenCode 更详细 |
| 日志 | 无 | 有 | OpenCode 有详细日志 |
| 数据规模 | 小 | 大 | OpenCode 存储更多元数据 |

---

## 4. 特色功能对比

### Claude Code 特有功能

1. **Agent Teams**
   - 多 Agent 协作模式
   - 可定义不同角色的 Agent
   - 支持 teammateMode (tmux)

2. **MCP 支持**
   - Model Context Protocol
   - 可添加外部 MCP 服务器
   - 扩展工具能力

3. **权限系统**
   - 细粒度权限控制
   - 允许/禁止特定工具
   - 允许/禁止特定命令

4. **Chrome 集成**
   - `--chrome` 参数
   - 与 Chrome 浏览器交互

5. **IDE 集成**
   - `--ide` 参数
   - 自动连接 IDE

6. **粘贴内容追踪**
   - `pastedContents` 字段
   - 追踪粘贴的历史

### OpenCode 特有功能

1. **桌面应用**
   - 完整的 GUI 界面
   - 窗口状态记忆
   - 多窗口支持

2. **Skill 系统**
   - ~/.opencode/skills/
   - SKILL.md 格式
   - 可安装/启用/禁用

3. **插件系统**
   - 内置插件（Copilot、Codex 等）
   - 外部插件（npm 包）
   - 动态加载

4. **LSP 集成**
   - 35+ 语言服务器
   - 自动检测项目类型
   - 实时代码分析

5. **多提供商支持**
   - 支持 75+ LLM 提供商
   - 可切换不同模型
   - 本地模型支持

6. **详细日志**
   - 完整的运行日志
   - HTTP 请求日志
   - 服务状态日志

7. **代码变更追踪**
   - session_diff
   - 统计 additions/deletions

8. **全局搜索**
   - 跨会话搜索
   - 搜索消息/文件

---

## 5. 适用场景对比

### Claude Code 适合
- ✅ 需要 Agent 团队协作
- ✅ 需要 MCP 扩展
- ✅ 需要细粒度权限控制
- ✅ 主要使用 Claude 模型
- ✅ 习惯命令行操作
- ✅ 需要与 Chrome/IDE 集成
- ✅ 项目抢救模式（Agent Teams）

### OpenCode 适合
- ✅ 需要图形界面
- ✅ 需要多提供商切换
- ✅ 需要 LSP 代码分析
- ✅ 需要详细历史记录
- ✅ 需要 Skill/插件扩展
- ✅ 需要代码变更追踪
- ✅ 需要多窗口工作

---

## 6. 为 Claude Web UI 的功能建议

基于两者的优点，建议 Claude Web UI 实现：

### 必做（融合两者优点）

1. **会话管理**（参考 OpenCode）
   - 会话标题可编辑
   - 会话别名(Slug)
   - 代码变更统计
   - Token 消耗显示

2. **消息展示**（参考两者）
   - 时间线展示
   - 父子消息关联
   - 工具执行记录（参考 OpenCode）
   - 粘贴内容追踪（Claude 特有）

3. **状态检测**（新功能）
   - 检测 Claude Code 进程
   - 显示运行状态
   - 显示工作目录

4. **历史记录**（参考 OpenCode）
   - 完整的消息存储
   - 工具执行详情
   - 搜索功能

5. **Dashboard**（融合设计）
   - Claude Code 状态指示器
   - 会话列表
   - 统计卡片

### 选做

6. **Agent 管理**（Claude 特有）
   - 显示当前 Agent
   - Agent 切换
   - Agent 统计

7. **MCP 管理**（Claude 特有）
   - MCP 服务器列表
   - 启用/禁用 MCP

8. **权限查看**（Claude 特有）
   - 当前权限配置
   - 允许的工具列表

9. **Skill 管理**（OpenCode 特有）
   - 如果有 Skill 系统的话

10. **代码变更 Diff**（OpenCode 特有）
    - 显示会话期间的变更

---

## 7. 总结

**Claude Code** 优势：
- Agent Teams 协作模式
- MCP 扩展能力
- 细粒度权限控制
- Chrome/IDE 集成
- 粘贴内容追踪

**OpenCode** 优势：
- 完整的桌面 GUI
- 详细的数据存储
- 多提供商支持
- LSP 代码分析
- Skill/插件系统
- 代码变更追踪

**建议**：
Claude Web UI 应该以 **OpenCode 的界面设计** 为蓝本，但融入 **Claude Code 的特有功能**（Agent Teams、MCP、权限系统等），打造一个既能查看历史记录，又能管理 Claude Code 特性的 Web 界面。

---

**文档版本**: 1.0  
**最后更新**: 2025-02-11  
