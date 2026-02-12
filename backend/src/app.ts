import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Claude Code 配置路径
const CLAUDE_DIR = path.join(process.env.HOME || '', '.claude');

// 1. Claude Code 状态检测
app.get('/api/status', async (req, res) => {
  try {
    const { stdout } = await execAsync('ps aux | grep -i "claude" | grep -v grep');
    const lines = stdout.trim().split('\n');
    const isRunning = lines.length > 0;
    
    if (isRunning) {
      const process = lines[0];
      const parts = process.split(/\s+/);
      const cpu = parts[2];
      const mem = parts[3];
      const time = parts[9];
      
      res.json({
        status: 'running',
        pid: parts[1],
        cpu: `${cpu}%`,
        memory: `${mem}%`,
        time: time,
        timestamp: Date.now()
      });
    } else {
      res.json({
        status: 'stopped',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    res.json({
      status: 'stopped',
      timestamp: Date.now()
    });
  }
});

// 2. 获取历史记录
app.get('/api/history', async (req, res) => {
  try {
    const historyPath = path.join(CLAUDE_DIR, 'history.jsonl');
    
    if (!fs.existsSync(historyPath)) {
      return res.json({ sessions: [], messages: [] });
    }
    
    const data = fs.readFileSync(historyPath, 'utf-8');
    const lines = data.trim().split('\n').filter(line => line);
    
    const messages = lines.map(line => JSON.parse(line));
    
    // 按 sessionId 分组
    const sessionsMap = new Map();
    messages.forEach(msg => {
      const sessionId = msg.sessionId || 'unknown';
      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          id: sessionId,
          title: msg.display?.substring(0, 50) || '未命名会话',
          project: msg.project,
          createdAt: msg.timestamp,
          updatedAt: msg.timestamp,
          messageCount: 0
        });
      }
      const session = sessionsMap.get(sessionId);
      session.messageCount++;
      session.updatedAt = Math.max(session.updatedAt, msg.timestamp);
    });
    
    const sessions = Array.from(sessionsMap.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    res.json({ sessions, messages });
  } catch (error) {
    console.error('Error reading history:', error);
    res.status(500).json({ error: 'Failed to read history' });
  }
});

// 2.1 获取单个会话详情
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const historyPath = path.join(CLAUDE_DIR, 'history.jsonl');
    
    if (!fs.existsSync(historyPath)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const data = fs.readFileSync(historyPath, 'utf-8');
    const lines = data.trim().split('\n').filter(line => line);
    const messages = lines.map(line => JSON.parse(line));
    
    // 过滤特定会话的消息
    const sessionMessages = messages.filter(msg => msg.sessionId === sessionId);
    
    if (sessionMessages.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 构建会话对象
    const session = {
      id: sessionId,
      title: sessionMessages[0].display?.substring(0, 50) || '未命名会话',
      project: sessionMessages[0].project,
      createdAt: sessionMessages[0].timestamp,
      updatedAt: sessionMessages[sessionMessages.length - 1].timestamp,
      messageCount: sessionMessages.length,
      messages: sessionMessages.map((msg) => ({
        id: `${msg.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.display || msg.content || '',
        timestamp: msg.timestamp,
        pastedContents: msg.pastedContents || {}
      }))
    };
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// 2.2 更新会话标题
app.patch('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // 在实际应用中，应该将会话标题存储在数据库中
    // 这里我们返回成功，前端会更新本地状态
    res.json({
      id: sessionId,
      title,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// 2.3 删除会话
app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const historyPath = path.join(CLAUDE_DIR, 'history.jsonl');
    
    if (!fs.existsSync(historyPath)) {
      return res.status(404).json({ error: 'History file not found' });
    }
    
    // 读取历史记录
    const data = fs.readFileSync(historyPath, 'utf-8');
    const lines = data.trim().split('\n').filter(line => line);
    const messages = lines.map(line => JSON.parse(line));
    
    // 过滤掉要删除的会话消息
    const filteredMessages = messages.filter(msg => msg.sessionId !== sessionId);
    
    // 写回文件
    const newContent = filteredMessages.map(msg => JSON.stringify(msg)).join('\n');
    fs.writeFileSync(historyPath, newContent + (newContent ? '\n' : ''));
    
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// 2.4 获取会话消息
app.get('/api/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const historyPath = path.join(CLAUDE_DIR, 'history.jsonl');
    
    if (!fs.existsSync(historyPath)) {
      return res.json({ messages: [], total: 0 });
    }
    
    const data = fs.readFileSync(historyPath, 'utf-8');
    const lines = data.trim().split('\n').filter(line => line);
    const messages = lines.map(line => JSON.parse(line));
    
    // 过滤特定会话的消息
    const sessionMessages = messages
      .filter(msg => msg.sessionId === sessionId)
      .map(msg => ({
        id: `${msg.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role || 'user',
        content: msg.display || '',
        timestamp: msg.timestamp,
        pastedContents: msg.pastedContents || {}
      }));
    
    // 分页
    const total = sessionMessages.length;
    const paginatedMessages = sessionMessages
      .reverse() // 最新的在前面
      .slice(Number(offset), Number(offset) + Number(limit));
    
    res.json({
      messages: paginatedMessages,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 3. 获取 Agent 配置
app.get('/api/agents', async (req, res) => {
  try {
    const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
    
    if (!fs.existsSync(settingsPath)) {
      return res.json({ agents: [] });
    }
    
    const data = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    
    const agents = settings.agents ? Object.entries(settings.agents).map(([name, config]: [string, any]) => ({
      name,
      description: config.description || '',
      prompt: config.prompt || '',
      allowedTools: config.allowedTools || []
    })) : [];
    
    res.json({ agents });
  } catch (error) {
    console.error('Error reading agents:', error);
    res.status(500).json({ error: 'Failed to read agents' });
  }
});

// 4. 获取权限配置
app.get('/api/permissions', async (req, res) => {
  try {
    const settingsPath = path.join(CLAUDE_DIR, 'settings.local.json');
    
    if (!fs.existsSync(settingsPath)) {
      return res.json({ permissions: { allow: [] } });
    }
    
    const data = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    
    res.json({ permissions: settings.permissions || { allow: [] } });
  } catch (error) {
    console.error('Error reading permissions:', error);
    res.status(500).json({ error: 'Failed to read permissions' });
  }
});

// 5. MCP 管理
// 5.1 获取 MCP 列表
app.get('/api/mcp', async (req, res) => {
  try {
    const { stdout } = await execAsync('claude mcp list');
    // 解析 claude mcp list 输出
    const lines = stdout.trim().split('\n');
    const mcps = lines
      .filter(line => line.trim() && !line.includes('No MCP'))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0] || 'unknown',
          enabled: !line.includes('disabled'),
          description: line
        };
      });
    
    res.json({ mcps });
  } catch (error) {
    // MCP 可能未配置
    res.json({ mcps: [] });
  }
});

// 5.2 获取 MCP 详情
app.get('/api/mcp/:mcpName', async (req, res) => {
  try {
    const { mcpName } = req.params;
    
    // 尝试获取 MCP 详情
    try {
      const { stdout } = await execAsync(`claude mcp get ${mcpName}`);
      res.json({
        name: mcpName,
        details: stdout,
        timestamp: Date.now()
      });
    } catch (e) {
      // 如果命令失败，返回模拟数据
      res.json({
        name: mcpName,
        description: 'MCP Server',
        enabled: true,
        tools: [
          { name: 'tool1', description: 'Tool 1 description' },
          { name: 'tool2', description: 'Tool 2 description' }
        ],
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error fetching MCP:', error);
    res.status(500).json({ error: 'Failed to fetch MCP' });
  }
});

// 5.3 启用/禁用 MCP
app.post('/api/mcp/:mcpName/toggle', async (req, res) => {
  try {
    const { mcpName } = req.params;
    const { enabled } = req.body;
    
    // 执行 claude mcp enable/disable 命令
    const command = enabled ? 'enable' : 'disable';
    try {
      await execAsync(`claude mcp ${command} ${mcpName}`);
    } catch (e) {
      // 命令可能不存在，仅返回状态
      console.log(`MCP toggle command not available for ${mcpName}`);
    }
    
    res.json({
      name: mcpName,
      enabled,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error toggling MCP:', error);
    res.status(500).json({ error: 'Failed to toggle MCP' });
  }
});

// 6. 获取 Todos
app.get('/api/todos', async (req, res) => {
  try {
    const todosDir = path.join(CLAUDE_DIR, 'todos');
    
    if (!fs.existsSync(todosDir)) {
      return res.json({ todos: [] });
    }
    
    const files = fs.readdirSync(todosDir).filter(f => f.endsWith('.json'));
    const allTodos = [];
    
    for (const file of files) {
      const filePath = path.join(todosDir, file);
      const data = fs.readFileSync(filePath, 'utf-8');
      const todos = JSON.parse(data);
      allTodos.push(...todos.map((todo: any) => ({
        ...todo,
        sessionId: file.replace('.json', '')
      })));
    }
    
    res.json({ todos: allTodos });
  } catch (error) {
    console.error('Error reading todos:', error);
    res.json({ todos: [] });
  }
});

// 6.1 文件管理 API
// 6.1.1 浏览目录
app.get('/api/files/browse', async (req, res) => {
  try {
    const { path: dirPath = process.cwd() } = req.query;
    const targetPath = path.resolve(dirPath as string);
    
    // 安全检查：确保路径在当前工作目录下
    const cwd = process.cwd();
    if (!targetPath.startsWith(cwd)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      size: entry.isFile() ? fs.statSync(path.join(targetPath, entry.name)).size : 0,
      modifiedAt: fs.statSync(path.join(targetPath, entry.name)).mtime.getTime()
    }));
    
    res.json({
      path: targetPath,
      files: files.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      })
    });
  } catch (error: any) {
    console.error('Error browsing directory:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6.1.2 读取文件内容
app.get('/api/files/read', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const targetPath = path.resolve(filePath as string);
    const cwd = process.cwd();
    
    // 安全检查
    if (!targetPath.startsWith(cwd)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory' });
    }
    
    // 限制文件大小 (1MB)
    if (stats.size > 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (>1MB)' });
    }
    
    const content = fs.readFileSync(targetPath, 'utf-8');
    
    res.json({
      path: targetPath,
      content,
      size: stats.size,
      modifiedAt: stats.mtime.getTime()
    });
  } catch (error: any) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6.1.3 写入文件
app.post('/api/files/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'Path and content are required' });
    }
    
    const targetPath = path.resolve(filePath);
    const cwd = process.cwd();
    
    // 安全检查
    if (!targetPath.startsWith(cwd)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // 确保目录存在
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, content, 'utf-8');
    
    res.json({
      success: true,
      path: targetPath,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6.1.4 删除文件
app.delete('/api/files/delete', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const targetPath = path.resolve(filePath);
    const cwd = process.cwd();
    
    // 安全检查
    if (!targetPath.startsWith(cwd)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    
    res.json({
      success: true,
      path: targetPath,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. 聊天接口 - 发送消息到 Claude Code
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 首先检查 Claude Code 是否在运行
    let isClaudeRunning = false;
    try {
      const { stdout } = await execAsync('ps aux | grep -i "claude" | grep -v grep');
      isClaudeRunning = stdout.trim().split('\n').length > 0;
    } catch (e) {
      isClaudeRunning = false;
    }

    // 保存用户消息到历史记录
    const historyPath = path.join(CLAUDE_DIR, 'history.jsonl');
    const newSessionId = sessionId || `web-${Date.now()}`;

    const userEntry = {
      display: message,
      pastedContents: {},
      timestamp: Date.now(),
      project: process.cwd(),
      sessionId: newSessionId
    };

    fs.appendFileSync(historyPath, JSON.stringify(userEntry) + '\n');

    // 如果 Claude 没有在交互模式运行，提示用户
    if (!isClaudeRunning) {
      const assistantEntry = {
        display: '⚠️ Claude Code 未在交互模式运行。\n\n请先启动 Claude Code：\n  $ claude\n\n然后在 Web UI 中继续对话。',
        pastedContents: {},
        timestamp: Date.now(),
        project: process.cwd(),
        sessionId: newSessionId,
        role: 'assistant'
      };
      fs.appendFileSync(historyPath, JSON.stringify(assistantEntry) + '\n');

      return res.json({
        response: assistantEntry.display,
        sessionId: newSessionId,
        timestamp: Date.now(),
        warning: 'Claude Code not running in interactive mode'
      });
    }

    // 使用 claude -c -p 继续当前会话并获取响应
    let response = '';
    try {
      const { stdout, stderr } = await execAsync(
        `claude -c -p ${JSON.stringify(message)}`,
        {
          timeout: 60000, // 60秒超时
          maxBuffer: 5 * 1024 * 1024, // 5MB buffer
          cwd: process.cwd()
        }
      );
      response = stdout.trim() || stderr.trim() || '无响应';
    } catch (execError: any) {
      console.error('Claude execution error:', execError);

      if (execError.killed) {
        response = '⏱️ 命令执行超时（60秒）。Claude Code 可能正在处理复杂任务。\n\n建议:\n1. 简化您的问题\n2. 在终端中直接与 Claude Code 交互\n3. 查看历史记录了解执行情况';
      } else if (execError.stdout || execError.stderr) {
        response = execError.stdout?.trim() || execError.stderr?.trim() || '执行出错，但有部分输出';
      } else {
        response = `❌ 与 Claude Code 通信失败\n\n错误信息：${execError.message}\n\n可能原因：\n1. Claude Code 未安装或未登录\n2. 网络连接问题\n3. Claude Code 正在执行其他任务`;
      }
    }

    // 保存 Claude 回复到历史记录
    const assistantEntry = {
      display: response,
      pastedContents: {},
      timestamp: Date.now(),
      project: process.cwd(),
      sessionId: newSessionId,
      role: 'assistant'
    };

    fs.appendFileSync(historyPath, JSON.stringify(assistantEntry) + '\n');

    res.json({
      response: response,
      sessionId: newSessionId,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

// 8. 快捷命令执行
app.post('/api/execute', async (req, res) => {
  try {
    const { command, args = [] } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // 构建完整命令
    const fullCommand = `claude ${command} ${args.join(' ')}`;
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: 30000,
      cwd: process.cwd()
    });

    res.json({
      success: true,
      output: stdout || stderr,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});