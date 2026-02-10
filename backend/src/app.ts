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

// 5. 获取 MCP 列表
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

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});