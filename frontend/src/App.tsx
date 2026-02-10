import { useState, useEffect } from 'react';
import { Layout, Card, Statistic, Row, Col, List, Tag, Spin, Alert, Typography, Space, Tabs } from 'antd';
import { 
  CodeOutlined, 
  MessageOutlined, 
  FolderOutlined, 
  RobotOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
  ApiOutlined
} from '@ant-design/icons';
import SessionDetail from './components/SessionDetail';
import PermissionsView from './components/PermissionsView';
import MCPView from './components/MCPView';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ClaudeStatus {
  status: 'running' | 'stopped';
  pid?: string;
  cpu?: string;
  memory?: string;
  time?: string;
  timestamp: number;
}

interface Session {
  id: string;
  title: string;
  project: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

interface Agent {
  name: string;
  description: string;
  allowedTools: string[];
}

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusRes, historyRes, agentsRes] = await Promise.all([
        fetch(`${API_BASE}/status`),
        fetch(`${API_BASE}/history`),
        fetch(`${API_BASE}/agents`)
      ]);

      const statusData = await statusRes.json();
      const historyData = await historyRes.json();
      const agentsData = await agentsRes.json();

      setStatus(statusData);
      setSessions(historyData.sessions?.slice(0, 10) || []);
      setAgents(agentsData.agents || []);
    } catch (err) {
      setError('无法连接到后端服务，请确保后端已启动 (http://localhost:3001)');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setActiveTab('session');
  };

  if (loading && !status) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <CodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Claude Code Web UI</Title>
        </Space>
        <Space>
          {status?.status === 'running' ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Claude 运行中
            </Tag>
          ) : (
            <Tag icon={<StopOutlined />} color="error">
              Claude 未运行
            </Tag>
          )}
        </Space>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        {error && (
          <Alert
            message="连接错误"
            description={error}
            type="error"
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab="📊 Dashboard" key="dashboard">
            {/* Claude Code 状态卡片 */}
            <Card style={{ marginBottom: 24 }}>
              {status?.status === 'running' ? (
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="运行状态"
                      value="运行中"
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="PID"
                      value={status.pid || '-'}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="CPU 占用"
                      value={status.cpu || '-'}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="内存占用"
                      value={status.memory || '-'}
                    />
                  </Col>
                </Row>
              ) : (
                <Alert
                  message="Claude Code 未运行"
                  description="检测到 Claude Code 进程未启动，请在终端中运行 `claude` 命令启动"
                  type="warning"
                  showIcon
                />
              )}
            </Card>

            {/* 统计卡片 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总会话数"
                    value={sessions.length}
                    prefix={<MessageOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="当前 Agent"
                    value={agents.length > 0 ? agents[0].name.toUpperCase() : '默认'}
                    prefix={<RobotOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="工作目录"
                    value={sessions[0]?.project || '-'}
                    prefix={<FolderOutlined />}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Agent 信息 */}
            {agents.length > 0 && (
              <Card title="🤖 Agents" style={{ marginBottom: 24 }}>
                <List
                  dataSource={agents}
                  renderItem={(agent) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{agent.name.toUpperCase()}</Text>
                            <Tag color="blue">{agent.allowedTools.length} 个工具</Tag>
                          </Space>
                        }
                        description={agent.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* 最近会话 */}
            <Card title="💬 最近会话">
              <List
                dataSource={sessions}
                renderItem={(session) => (
                  <List.Item
                    actions={[<Tag>{session.messageCount} 条消息</Tag>]}
                    onClick={() => handleSessionClick(session)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      title={session.title}
                      description={
                        <Space>
                          <Text type="secondary">{session.project}</Text>
                          <Text type="secondary">·</Text>
                          <Text type="secondary">{formatTime(session.updatedAt)}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          <TabPane 
            tab={selectedSession ? `💬 ${selectedSession.title.substring(0, 20)}...` : "💬 会话详情"} 
            key="session"
            disabled={!selectedSession}
          >
            {selectedSession && (
              <SessionDetail 
                sessionId={selectedSession.id} 
                sessionTitle={selectedSession.title}
              />
            )}
          </TabPane>

          <TabPane tab={<span><SafetyCertificateOutlined /> 权限</span>} key="permissions">
            <PermissionsView />
          </TabPane>

          <TabPane tab={<span><ApiOutlined /> MCP</span>} key="mcp">
            <MCPView />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
}

export default App;