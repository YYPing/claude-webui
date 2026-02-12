import { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Typography, Space, Card, Tag, Spin, Alert, Tooltip, Badge } from 'antd';
import { 
  SendOutlined, 
  UserOutlined, 
  RobotOutlined, 
  LoadingOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatWindow.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface ToolCall {
  tool: string;
  params: string;
  status: 'pending' | 'success' | 'error';
  result?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  loading?: boolean;
  error?: boolean;
  toolCalls?: ToolCall[];
}

interface ChatWindowProps {
  sessionId?: string;
}

// 解析工具调用
function parseToolCalls(content: string): { content: string; toolCalls: ToolCall[] } {
  const toolCalls: ToolCall[] = [];
  
  // 匹配工具调用模式
  const toolPatterns = [
    { regex: /(?:🛠️|Tool|Executing)\s*[:：]\s*(\w+)\s*[:：]\s*```?(.*?)```?/gs, nameIndex: 1, paramIndex: 2 },
    { regex: /(\w+)\s*tool\s*[:：]\s*(.*)/gim, nameIndex: 1, paramIndex: 2 },
    { regex: /\$\s*(\w+.*)/gm, nameIndex: 1, paramIndex: 1 },
  ];
  
  let cleanContent = content;
  
  toolPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const toolName = match[pattern.nameIndex]?.trim();
      const params = match[pattern.paramIndex]?.trim();
      
      if (toolName) {
        toolCalls.push({
          tool: toolName,
          params: params || '',
          status: 'success'
        });
      }
    }
  });
  
  return { content: cleanContent, toolCalls };
}

// 代码块组件
function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-language">{language || 'text'}</span>
        <Tooltip title={copied ? '已复制!' : '复制代码'}>
          <Button 
            type="text" 
            size="small" 
            icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            className="copy-button"
          />
        </Tooltip>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '14px',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

// 工具调用显示组件
function ToolCallDisplay({ toolCalls }: { toolCalls: ToolCall[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;
  
  const getToolIcon = (tool: string) => {
    const toolLower = tool.toLowerCase();
    if (toolLower.includes('bash') || toolLower.includes('shell')) return <ThunderboltOutlined />;
    if (toolLower.includes('edit') || toolLower.includes('write')) return <CodeOutlined />;
    if (toolLower.includes('read') || toolLower.includes('file')) return <FileTextOutlined />;
    return <ThunderboltOutlined />;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'pending': return 'processing';
      default: return 'default';
    }
  };
  
  return (
    <div className="tool-calls-container">
      {toolCalls.map((tool, index) => (
        <div key={index} className="tool-call-item">
          <Space>
            {getToolIcon(tool.tool)}
            <Text strong>{tool.tool}</Text>
            <Badge status={getStatusColor(tool.status) as any} text={tool.status} />
          </Space>
          {tool.params && (
            <div className="tool-params">
              <CodeBlock language="bash" value={tool.params} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 消息内容组件
function MessageContent({ message }: { message: Message }) {
  if (message.loading) {
    return (
      <Space>
        <Spin indicator={<LoadingOutlined spin />} size="small" />
        <Text type="secondary">Claude 正在思考...</Text>
      </Space>
    );
  }
  
  const { content, toolCalls } = parseToolCalls(message.content);
  
  return (
    <div className="message-content">
      {toolCalls.length > 0 && <ToolCallDisplay toolCalls={toolCalls} />}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');
            
            if (inline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }
            
            return <CodeBlock language={language} value={code} />;
          },
          p({ children }) {
            return <p className="markdown-paragraph">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="markdown-heading-1">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="markdown-heading-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="markdown-heading-3">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="markdown-list">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="markdown-list">{children}</ol>;
          },
          li({ children }) {
            return <li className="markdown-list-item">{children}</li>;
          },
          blockquote({ children }) {
            return <blockquote className="markdown-blockquote">{children}</blockquote>;
          },
          table({ children }) {
            return <table className="markdown-table">{children}</table>;
          },
          a({ children, href }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ChatWindow({ sessionId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<'running' | 'stopped'>('stopped');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 检查 Claude Code 状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/status');
        const data = await res.json();
        setClaudeStatus(data.status);
      } catch (e) {
        setClaudeStatus('stopped');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      loading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    // 创建 AbortController 用于取消请求
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          sessionId
        }),
        signal: controller.signal
      });

      const data = await response.json();

      setMessages(prev => prev.map(msg =>
        msg.loading ? {
          ...msg,
          content: data.response || '抱歉，我无法处理这个请求。',
          loading: false,
          error: !!data.warning
        } : msg
      ));

      if (data.warning) {
        setClaudeStatus('stopped');
      } else {
        setClaudeStatus('running');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages(prev => prev.map(msg =>
          msg.loading ? {
            ...msg,
            content: '⏹️ 已取消生成',
            loading: false,
            error: true
          } : msg
        ));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.loading ? {
            ...msg,
            content: '❌ 连接失败\n\n无法连接到后端服务，请确保：\n1. 后端服务已启动 (npm run dev)\n2. 端口 3001 未被占用',
            loading: false,
            error: true
          } : msg
        ));
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter 发送
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Esc 取消生成
    if (e.key === 'Escape' && loading) {
      handleStop();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyAllMessages = async () => {
    const text = messages
      .filter(m => !m.loading)
      .map(m => `${m.role === 'user' ? '用户' : 'Claude'}: ${m.content}`)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
  };

  return (
    <Card
      className="chat-window"
      title={
        <Space className="chat-header">
          <span className="chat-title">💬 对话窗口</span>
          {claudeStatus === 'running' ? (
            <Tag color="success" icon={<RobotOutlined />}>Claude 运行中</Tag>
          ) : (
            <Tag color="warning" icon={<RobotOutlined />}>Claude 未运行</Tag>
          )}
          <Tooltip title="复制全部对话">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={copyAllMessages}
              disabled={messages.length === 0}
            />
          </Tooltip>
          <Tooltip title="清空对话 (Ctrl+L)">
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={clearChat}
              disabled={messages.length === 0}
              danger
            />
          </Tooltip>
        </Space>
      }
    >
      {/* Claude 状态提示 */}
      {claudeStatus === 'stopped' && (
        <Alert
          className="status-alert"
          message="Claude Code 未在交互模式运行"
          description={
            <div>
              <p>请先启动 Claude Code：</p>
              <pre className="command-block">
                $ claude
              </pre>
              <p className="help-text">
                然后在 Web UI 中发送消息，会续接当前会话。
              </p>
            </div>
          }
          type="warning"
          showIcon
        />
      )}

      {/* 消息列表 */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <RobotOutlined className="empty-icon" />
            <Paragraph type="secondary" className="empty-text">
              开始与 Claude Code 对话
            </Paragraph>
            <Text type="secondary" className="empty-hint">
              提示: 需要先在终端启动 Claude Code
            </Text>
            <div className="shortcuts-hint">
              <Text type="secondary" className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 发送
              </Text>
              <Text type="secondary" className="shortcut-item">
                <kbd>Shift</kbd> + <kbd>Enter</kbd> 换行
              </Text>
              <Text type="secondary" className="shortcut-item">
                <kbd>Esc</kbd> 取消生成
              </Text>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-item ${message.role} ${message.error ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {message.role === 'assistant' ? (
                    <div className={`avatar assistant ${message.error ? 'error' : ''}`}>
                      <RobotOutlined />
                    </div>
                  ) : (
                    <div className="avatar user">
                      <UserOutlined />
                    </div>
                  )}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-header">
                    <Text strong className="message-author">
                      {message.role === 'assistant' ? 'Claude' : '你'}
                    </Text>
                    <Text type="secondary" className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </div>
                  <div className={`message-bubble ${message.role}`}>
                    <MessageContent message={message} />
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="input-container">
        <div className="input-wrapper">
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={claudeStatus === 'running'
              ? "输入消息... (Ctrl+Enter 发送, Shift+Enter 换行)"
              : "需要先启动 Claude Code (在终端运行: claude)"
            }
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="chat-input"
            disabled={loading}
          />
          <div className="input-actions">
            {loading ? (
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={handleStop}
                className="stop-button"
              >
                停止
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="send-button"
              >
                发送
              </Button>
            )}
          </div>
        </div>
        <Text type="secondary" className="input-hint">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 发送 · <kbd>Shift</kbd> + <kbd>Enter</kbd> 换行 · <kbd>Esc</kbd> 停止
        </Text>
      </div>
    </Card>
  );
}

export default ChatWindow;
