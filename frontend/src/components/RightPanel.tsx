import { useState } from 'react';
import { Tabs, Card, Avatar, List, Badge, Tag, Typography, Space, Empty } from 'antd';
import {
  RobotOutlined,
  ApiOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  StopOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import './RightPanel.css';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface Agent {
  id: string;
  name: string;
  mode: 'build' | 'plan';
  icon: string;
  color: string;
}

interface RightPanelProps {
  activeTab: 'agents' | 'mcp' | 'permissions';
  onTabChange: (tab: 'agents' | 'mcp' | 'permissions') => void;
  agents: Agent[];
  activeAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  isDark: boolean;
}

// Mock MCP 数据
const MOCK_MCPS = [
  { name: 'filesystem', description: '文件系统操作', tools: 5, enabled: true },
  { name: 'fetch', description: 'HTTP 请求', tools: 2, enabled: true },
  { name: 'git', description: 'Git 操作', tools: 8, enabled: false },
];

// Mock 权限数据
const MOCK_PERMISSIONS = {
  mode: 'acceptEdits',
  allowed: [
    'Read',
    'Edit',
    'Write',
    'Bash(git:*)',
    'Bash(npm:*)',
    'Bash(ls:*)'
  ],
  denied: [
    'Bash(rm:*)',
    'Bash(sudo:*)'
  ]
};

function RightPanel({
  activeTab,
  onTabChange,
  agents,
  activeAgent,
  onSelectAgent,
  isDark
}: RightPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(activeAgent);

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    onSelectAgent(agent);
  };

  // 获取工具图标
  const getToolIcon = (tool: string) => {
    if (tool.includes('Bash')) return <ThunderboltOutlined />;
    if (tool.includes('Edit') || tool.includes('Write')) return <CodeOutlined />;
    if (tool.includes('Read')) return <FileTextOutlined />;
    return <ThunderboltOutlined />;
  };

  return (
    <div className={`right-panel ${isDark ? 'dark' : 'light'}`}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as any)}
        className="panel-tabs"
        tabBarStyle={{ margin: 0, padding: '0 16px' }}
      >
        {/* Agents Tab */}
        <TabPane
          tab={
            <span className="tab-item">
              <RobotOutlined />
              <span className="tab-text">Agents</span>
            </span>
          }
          key="agents"
        >
          <div className="panel-content">
            <Title level={5} className="section-title">
              <RobotOutlined /> 可用 Agents
            </Title>
            
            <List
              dataSource={agents}
              renderItem={(agent) => (
                <List.Item
                  className={`agent-item ${agent.id === selectedAgent.id ? 'active' : ''}`}
                  onClick={() => handleAgentSelect(agent)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size={40} 
                        style={{ backgroundColor: agent.color }}
                        className="agent-avatar"
                      >
                        {agent.icon}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong className="agent-name">{agent.name}</Text>
                        <Badge 
                          status={agent.mode === 'build' ? 'processing' : 'default'}
                          text={agent.mode === 'build' ? 'Build' : 'Plan'}
                          className="mode-badge"
                        />
                      </Space>
                    }
                    description={
                      <Text type="secondary" className="agent-desc">
                        {agent.mode === 'build' 
                          ? '完整访问权限，可执行文件操作' 
                          : '只读模式，分析建议需确认'}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />

            <div className="agent-info">
              <Card size="small" className="info-card">
                <Space direction="vertical" size={8}>
                  <Text type="secondary">
                    <InfoCircleOutlined /> 提示
                  </Text>
                  <Text className="info-text">
                    Build 模式：Agent 可自动执行文件修改和命令
                  </Text>
                  <Text className="info-text">
                    Plan 模式：Agent 仅提供分析和建议，需手动确认
                  </Text>
                </Space>
              </Card>
            </div>
          </div>
        </TabPane>

        {/* MCP Tab */}
        <TabPane
          tab={
            <span className="tab-item">
              <ApiOutlined />
              <span className="tab-text">MCP</span>
            </span>
          }
          key="mcp"
        >
          <div className="panel-content">
            <Title level={5} className="section-title">
              <ApiOutlined /> MCP 服务器
            </Title>

            {MOCK_MCPS.length === 0 ? (
              <Empty description="暂无 MCP 配置" />
            ) : (
              <List
                dataSource={MOCK_MCPS}
                renderItem={(mcp) => (
                  <List.Item className="mcp-item">
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          size={36}
                          style={{ 
                            background: mcp.enabled 
                              ? 'rgba(82, 196, 26, 0.1)' 
                              : 'rgba(150, 150, 150, 0.1)',
                            color: mcp.enabled ? '#52c41a' : '#999'
                          }}
                        >
                          <ApiOutlined />
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{mcp.name}</Text>
                          {mcp.enabled ? (
                            <Tag color="success">已启用</Tag>
                          ) : (
                            <Tag>已禁用</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" className="mcp-desc">
                            {mcp.description}
                          </Text>
                          <Text type="secondary" className="mcp-tools">
                            {mcp.tools} 个工具
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </TabPane>

        {/* Permissions Tab */}
        <TabPane
          tab={
            <span className="tab-item">
              <SafetyOutlined />
              <span className="tab-text">权限</span>
            </span>
          }
          key="permissions"
        >
          <div className="panel-content">
            <Title level={5} className="section-title">
              <SafetyOutlined /> 权限配置
            </Title>

            <Card size="small" className="permission-mode-card">
              <Space direction="vertical" size={8}>
                <Text type="secondary">当前模式</Text>
                <Tag color="blue" className="mode-tag">
                  {MOCK_PERMISSIONS.mode}
                </Tag>
              </Space>
            </Card>

            <div className="permission-section">
              <Text strong className="permission-title">
                <CheckCircleOutlined className="allowed-icon" /> 允许的工具
              </Text>
              <List
                dataSource={MOCK_PERMISSIONS.allowed}
                renderItem={(tool) => (
                  <List.Item className="permission-item allowed">
                    <Space>
                      {getToolIcon(tool)}
                      <Text>{tool}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>

            {MOCK_PERMISSIONS.denied.length > 0 && (
              <div className="permission-section">
                <Text strong className="permission-title">
                  <StopOutlined className="denied-icon" /> 禁止的工具
                </Text>
                <List
                  dataSource={MOCK_PERMISSIONS.denied}
                  renderItem={(tool) => (
                    <List.Item className="permission-item denied">
                      <Space>
                        {getToolIcon(tool)}
                        <Text>{tool}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default RightPanel;
