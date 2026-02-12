import { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Typography, Space, Spin, Alert, Tooltip, Badge } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  LoadingOutlined,
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ThunderboltFilled
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatArea.css';

const { TextArea } = Input;
const { Text } = Typography;

interface Agent {
  id: string;
  name: string;
  mode: 'build' | 'plan';
  icon: string;
  color: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  loading?: boolean;
  error?: boolean;
}

interface ChatAreaProps {
  sessionId: string;
  agent: Agent;
  isDark: boolean;
  claudeStatus: 'running' | 'stopped';
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
          fontSize: '13px',
          background: '#1a1a2e'
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

// 消息内容组件
function MessageContent({ message, isDark }: { message: Message; isDark: boolean }) {
  if (message.loading) {
    return (
      <Space>
        <Spin indicator={<LoadingOutlined spin />} size="small" />
        <Text type="secondary">Claude 正在思考...</Text>
      </Space>
    );
  }

  return (
    <div className="message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');

            if (inline) {
              return (
                <code className={`inline-code ${isDark ? 'dark' : 'light'}`} {...props}>
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
            return <table className={`markdown-table ${isDark ? 'dark' : 'light'}`}>{children}</table>;
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
        {message.content}
      </ReactMarkdown>
    </div>
  );
}

function ChatArea({ sessionId, agent, isDark, claudeStatus }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 加载历史消息
  useEffect(() => {
    const loadHistory = async () => {
      if (!sessionId) {
        setMessages([]);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3001/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const historyMessages = data.messages.map((msg: any) => ({
              id: msg.id || `${msg.timestamp}`,
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content || '',
              timestamp: msg.timestamp,
              loading: false,
              error: false
            }));
            setMessages(historyMessages);
          } else {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
        setMessages([]);
      }
    };

    loadHistory();
  }, [sessionId]);

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
            content: '❌ 连接失败，请确保后端服务已启动',
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
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
    <div className={`chat-area ${isDark ? 'dark' : 'light'}`}>
      {/* 顶部工具栏 */}
      <div className="chat-toolbar">
        <div className="toolbar-left">
          <Space>
            <Badge 
              status={agent.mode === 'build' ? 'processing' : 'default'}
              text={agent.mode === 'build' ? 'Build Mode' : 'Plan Mode'}
              className="mode-indicator"
            />
            <Text type="secondary" className="session-id">
              Session: {sessionId.slice(0, 8)}...
            </Text>
          </Space>
        </div>
        <div className="toolbar-right">
          <Space>
            <Tooltip title="复制全部对话">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={copyAllMessages}
                disabled={messages.length === 0}
                className="toolbar-btn"
              />
            </Tooltip>
            <Tooltip title="清空对话">
              <Button
                type="text"
                icon={<ClearOutlined />}
                onClick={clearChat}
                disabled={messages.length === 0}
                className="toolbar-btn"
                danger
              />
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="messages-container">
        {claudeStatus === 'stopped' && messages.length === 0 && (
          <Alert
            className="status-alert"
            message="Claude Code 未运行"
            description={
              <div>
                <p>请在终端中启动 Claude Code：</p>
                <pre className="command-block">$ claude</pre>
              </div>
            }
            type="warning"
            showIcon
          />
        )}

        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="welcome-content">
              <ThunderboltFilled className="welcome-icon" />
              <Text className="welcome-title">开始与 Claude 对话</Text>
              <Text type="secondary" className="welcome-subtitle">
                当前 Agent: {agent.name} ({agent.mode === 'build' ? 'Build' : 'Plan'} 模式)
              </Text>
              <div className="shortcuts">
                <Text type="secondary" className="shortcut-hint">
                  <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 发送
                </Text>
                <Text type="secondary" className="shortcut-hint">
                  <kbd>Shift</kbd> + <kbd>Enter</kbd> 换行
                </Text>
                <Text type="secondary" className="shortcut-hint">
                  <kbd>Esc</kbd> 停止生成
                </Text>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${message.role} ${message.error ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {message.role === 'assistant' ? (
                    <div 
                      className={`avatar assistant ${message.error ? 'error' : ''}`}
                      style={{ background: message.error ? '#ff4d4f' : agent.color }}
                    >
                      <RobotOutlined />
                    </div>
                  ) : (
                    <div className="avatar user">
                      <UserOutlined />
                    </div>
                  )}
                </div>
                <div className="message-body">
                  <div className="message-header">
                    <Text strong className="message-author">
                      {message.role === 'assistant' ? `Claude (${agent.name})` : '你'}
                    </Text>
                    <Text type="secondary" className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </div>
                  <div className={`message-content-wrapper ${message.role}`}>
                    <MessageContent message={message} isDark={isDark} />
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="input-area">
        <div className="input-wrapper">
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={claudeStatus === 'running'
              ? "输入消息... (Ctrl+Enter 发送)"
              : "需要先启动 Claude Code"
            }
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="chat-input"
            disabled={loading || claudeStatus === 'stopped'}
          />
          <div className="input-actions">
            {loading ? (
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={handleStop}
                className="action-btn stop"
              >
                停止
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!inputValue.trim() || claudeStatus === 'stopped'}
                className="action-btn send"
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
    </div>
  );
}

export default ChatArea;
