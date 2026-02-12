import { useState, useEffect } from 'react';
import { List, Tag, Typography, Space, Card, Badge, Collapse } from 'antd';
import { MessageOutlined, RobotOutlined, CopyOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  pastedContents?: Record<string, { type: string; content: string }>;
}

interface SessionDetailProps {
  sessionId: string;
  sessionTitle: string;
}

const API_BASE = 'http://localhost:3001/api';

function SessionDetail({ sessionId, sessionTitle }: SessionDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [sessionId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      const sessionMessages = data.messages?.filter(
        (m: Message) => m.sessionId === sessionId
      ) || [];
      setMessages(sessionMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <Card loading />;
  }

  return (
    <Card title={`会话详情: ${sessionTitle}`} style={{ marginTop: 24 }}>
      <List
        dataSource={messages}
        renderItem={(message, index) => (
          <List.Item
            key={index}
            style={{
              background: message.role === 'user' ? '#f6ffed' : '#f0f5ff',
              padding: '16px',
              marginBottom: '8px',
              borderRadius: '8px',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="center">
                {message.role === 'user' ? (
                  <Badge dot color="green">
                    <MessageOutlined />
                  </Badge>
                ) : (
                  <Badge dot color="blue">
                    <RobotOutlined />
                  </Badge>
                )}
                <Text strong>
                  {message.role === 'user' ? '用户' : 'Claude'}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatTime(message.timestamp)}
                </Text>
                <Tag
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(message.content)}
                  style={{ cursor: 'pointer' }}
                >
                  复制
                </Tag>
              </Space>

              <div style={{ marginLeft: 24 }}>
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Text>
              </div>

              {/* 粘贴内容追踪 */}
              {message.pastedContents && Object.keys(message.pastedContents).length > 0 && (
                <Collapse ghost style={{ marginLeft: 24 }}>
                  <Panel
                    header={<Text type="secondary">粘贴内容 ({Object.keys(message.pastedContents).length} 个)</Text>}
                    key="1"
                  >
                    {Object.entries(message.pastedContents).map(([id, content]) => (
                      <Card
                        key={id}
                        size="small"
                        style={{ marginBottom: 8, background: '#fafafa' }}
                      >
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          粘贴 #{id}
                        </Text>
                        <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                          {content.content}
                        </pre>
                      </Card>
                    ))}
                  </Panel>
                </Collapse>
              )}
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
}

export default SessionDetail;