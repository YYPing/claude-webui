# Claude Web UI - API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`

---

## 健康检查

### GET /health
检查服务健康状态

**Response**:
```json
{
  "status": "ok",
  "timestamp": 1770857441220
}
```

---

## Claude Code 状态

### GET /status
获取 Claude Code 进程状态

**Response**:
```json
{
  "status": "running",
  "pid": "12345",
  "cpu": "2.5%",
  "memory": "1.8%",
  "time": "01:23:45",
  "timestamp": 1770857441220
}
```

---

## 会话管理

### GET /history
获取所有会话列表

**Response**:
```json
{
  "sessions": [
    {
      "id": "session-id",
      "title": "会话标题",
      "project": "/project/path",
      "createdAt": 1770857441220,
      "updatedAt": 1770857441220,
      "messageCount": 10
    }
  ],
  "messages": [...]
}
```

### GET /sessions/:sessionId
获取单个会话详情

**Response**:
```json
{
  "id": "session-id",
  "title": "会话标题",
  "project": "/project/path",
  "createdAt": 1770857441220,
  "updatedAt": 1770857441220,
  "messageCount": 10,
  "messages": [
    {
      "id": "msg-id",
      "role": "user",
      "content": "消息内容",
      "timestamp": 1770857441220,
      "pastedContents": {}
    }
  ]
}
```

### GET /sessions/:sessionId/messages
获取会话消息（支持分页）

**Query Parameters**:
- `limit` (number): 每页数量，默认 100
- `offset` (number): 偏移量，默认 0

**Response**:
```json
{
  "messages": [...],
  "total": 100,
  "limit": 100,
  "offset": 0
}
```

### PATCH /sessions/:sessionId
更新会话标题

**Request Body**:
```json
{
  "title": "新标题"
}
```

**Response**:
```json
{
  "id": "session-id",
  "title": "新标题",
  "updatedAt": 1770857441220
}
```

### DELETE /sessions/:sessionId
删除会话

**Response**:
```json
{
  "success": true,
  "message": "Session deleted"
}
```

---

## 聊天

### POST /chat
发送消息到 Claude Code

**Request Body**:
```json
{
  "message": "你好",
  "sessionId": "session-id"
}
```

**Response**:
```json
{
  "response": "Claude 的回复内容",
  "sessionId": "session-id",
  "timestamp": 1770857441220
}
```

**注意**: 如果 Claude Code 未运行，会返回警告信息

---

## Agent 管理

### GET /agents
获取所有 Agent 配置

**Response**:
```json
{
  "agents": [
    {
      "name": "pm",
      "description": "项目经理",
      "prompt": "system prompt...",
      "allowedTools": ["Read", "Edit", "Write"]
    }
  ]
}
```

---

## MCP 管理

### GET /mcp
获取 MCP 服务器列表

**Response**:
```json
{
  "mcps": [
    {
      "name": "filesystem",
      "enabled": true,
      "description": "文件系统操作"
    }
  ]
}
```

### GET /mcp/:mcpName
获取 MCP 详情

**Response**:
```json
{
  "name": "filesystem",
  "description": "文件系统操作",
  "enabled": true,
  "tools": [
    {
      "name": "read_file",
      "description": "读取文件内容"
    }
  ]
}
```

### POST /mcp/:mcpName/toggle
启用/禁用 MCP

**Request Body**:
```json
{
  "enabled": true
}
```

**Response**:
```json
{
  "name": "filesystem",
  "enabled": true,
  "timestamp": 1770857441220
}
```

---

## 权限管理

### GET /permissions
获取权限配置

**Response**:
```json
{
  "permissions": {
    "allow": ["Read", "Edit", "Write", "Bash(git:*)"],
    "deny": ["Bash(rm:*)", "Bash(sudo:*)"]
  }
}
```

---

## 文件管理

### GET /files/browse
浏览目录

**Query Parameters**:
- `path` (string): 目录路径，默认为当前工作目录

**Response**:
```json
{
  "path": "/project/path",
  "files": [
    {
      "name": "src",
      "type": "directory",
      "size": 0,
      "modifiedAt": 1770857441220
    },
    {
      "name": "package.json",
      "type": "file",
      "size": 1024,
      "modifiedAt": 1770857441220
    }
  ]
}
```

**注意**: 只能访问当前工作目录下的文件

### GET /files/read
读取文件内容

**Query Parameters**:
- `path` (string): 文件路径（必需）

**Response**:
```json
{
  "path": "/project/path/file.txt",
  "content": "文件内容...",
  "size": 1024,
  "modifiedAt": 1770857441220
}
```

**限制**: 文件大小不能超过 1MB

### POST /files/write
写入文件

**Request Body**:
```json
{
  "path": "/project/path/file.txt",
  "content": "文件内容..."
}
```

**Response**:
```json
{
  "success": true,
  "path": "/project/path/file.txt",
  "timestamp": 1770857441220
}
```

### DELETE /files/delete
删除文件或目录

**Request Body**:
```json
{
  "path": "/project/path/file.txt"
}
```

**Response**:
```json
{
  "success": true,
  "path": "/project/path/file.txt",
  "timestamp": 1770857441220
}
```

---

## Todos

### GET /todos
获取所有待办事项

**Response**:
```json
{
  "todos": [
    {
      "id": "todo-id",
      "content": "待办内容",
      "completed": false,
      "sessionId": "session-id"
    }
  ]
}
```

---

## 命令执行

### POST /execute
执行 Claude Code 命令

**Request Body**:
```json
{
  "command": "mcp",
  "args": ["list"]
}
```

**Response**:
```json
{
  "success": true,
  "output": "命令输出...",
  "timestamp": 1770857441220
}
```

---

## 错误处理

所有 API 在出错时会返回以下格式：

```json
{
  "error": "错误描述",
  "details": "详细错误信息（可选）"
}
```

### 常见错误码

- `400` - 请求参数错误
- `403` - 访问被拒绝（文件访问超出工作目录）
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 更新日志

### 2026-02-12
- 新增会话管理 API（获取详情、更新、删除、分页消息）
- 新增 MCP 管理 API（列表、详情、启用/禁用）
- 新增文件管理 API（浏览、读取、写入、删除）
