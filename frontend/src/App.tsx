import { useState, useEffect, createContext } from 'react';
import { Layout, Button, Tooltip, Badge, Avatar, Dropdown, Space, Typography, Divider } from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  CodeOutlined
} from '@ant-design/icons';
import ChatArea from './components/ChatArea';
import SessionSidebar from './components/SessionSidebar';
import RightPanel from './components/RightPanel';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// 主题上下文
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {}
});

// 会话类型
interface Session {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  unread?: number;
  isActive?: boolean;
}

// Agent 类型
interface Agent {
  id: string;
  name: string;
  mode: 'build' | 'plan';
  icon: string;
  color: string;
}

const AGENTS: Agent[] = [
  { id: 'pm', name: 'PM', mode: 'build', icon: '🎯', color: '#1890ff' },
  { id: 'fe', name: 'FE', mode: 'build', icon: '🎨', color: '#52c41a' },
  { id: 'be', name: 'BE', mode: 'build', icon: '⚙️', color: '#722ed1' },
  { id: 'qa', name: 'QA', mode: 'plan', icon: '🧪', color: '#fa8c16' },
];

function App() {
  // 状态管理
  const [isDark, setIsDark] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS[0]);
  const [activeTab, setActiveTab] = useState<'agents' | 'mcp' | 'permissions'>('agents');
  const [claudeStatus, setClaudeStatus] = useState<'running' | 'stopped'>('stopped');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // 切换主题
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.classList.toggle('dark-theme', !isDark);
  };

  // 获取状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/status');
        const data = await res.json();
        setClaudeStatus(data.status);
      } catch (e) {
        setClaudeStatus('stopped');
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 获取会话列表
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/history');
        const data = await res.json();
        const sessionList = data.sessions?.map((s: any) => ({
          id: s.id,
          title: s.title,
          lastMessage: '',
          timestamp: s.updatedAt,
          isActive: s.id === currentSessionId
        })) || [];
        setSessions(sessionList);
        if (sessionList.length > 0 && !currentSessionId) {
          setCurrentSessionId(sessionList[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch sessions:', e);
      }
    };
    fetchSessions();
  }, [currentSessionId]);

  // 创建新会话
  const createNewSession = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: '新会话',
      lastMessage: '',
      timestamp: Date.now(),
      isActive: true
    };
    setSessions(prev => [newSession, ...prev.map(s => ({ ...s, isActive: false }))]);
    setCurrentSessionId(newSession.id);
  };

  // 选择会话
  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSessions(prev => prev.map(s => ({
      ...s,
      isActive: s.id === sessionId
    })));
  };

  // Agent 菜单项
  const agentMenuItems = AGENTS.map(agent => ({
    key: agent.id,
    label: (
      <Space>
        <Avatar size="small" style={{ backgroundColor: agent.color }}>
          {agent.icon}
        </Avatar>
        <span>{agent.name}</span>
        <Badge 
          status={agent.mode === 'build' ? 'processing' : 'default'} 
          text={agent.mode === 'build' ? 'Build' : 'Plan'}
        />
      </Space>
    ),
    onClick: () => setActiveAgent(agent)
  }));

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <ThunderboltFilled spin style={{ fontSize: 48, color: '#1890ff' }} />
          <Text style={{ marginTop: 16 }}>正在启动 Claude Web UI...</Text>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <Layout className={`app-layout ${isDark ? 'dark' : 'light'}`}>
        {/* 顶部 Header */}
        <Header className="app-header">
          <div className="header-left">
            <div className="logo">
              <CodeOutlined className="logo-icon" />
              <span className="logo-text">Claude Web UI</span>
            </div>
            
            <Divider type="vertical" className="header-divider" />
            
            {/* Agent 选择器 */}
            <Dropdown menu={{ items: agentMenuItems }} placement="bottomLeft">
              <Button className="agent-selector">
                <Avatar size="small" style={{ backgroundColor: activeAgent.color }}>
                  {activeAgent.icon}
                </Avatar>
                <span className="agent-name">{activeAgent.name}</span>
                <Badge 
                  status={activeAgent.mode === 'build' ? 'processing' : 'default'} 
                  text={activeAgent.mode === 'build' ? 'Build' : 'Plan'}
                  className="agent-mode"
                />
              </Button>
            </Dropdown>
          </div>

          <div className="header-center">
            {/* Claude 状态指示 */}
            <div className={`status-indicator ${claudeStatus}`}>
              {claudeStatus === 'running' ? (
                <>
                  <CheckCircleFilled className="status-icon" />
                  <span>Claude 运行中</span>
                </>
              ) : (
                <>
                  <Badge status="error" />
                  <span>Claude 未启动</span>
                </>
              )}
            </div>
          </div>

          <div className="header-right">
            <Space size="middle">
              {/* 主题切换 */}
              <Tooltip title={isDark ? '切换明亮主题' : '切换暗黑主题'}>
                <Button
                  type="text"
                  icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                  onClick={toggleTheme}
                  className="header-btn"
                />
              </Tooltip>

              {/* 设置 */}
              <Tooltip title="设置">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  className="header-btn"
                />
              </Tooltip>

              {/* 用户信息 */}
              <Avatar className="user-avatar" icon={<RobotOutlined />} />
            </Space>
          </div>
        </Header>

        <Layout className="app-body">
          {/* 左侧边栏 - 会话列表 */}
          <Sider
            collapsed={leftCollapsed}
            onCollapse={setLeftCollapsed}
            collapsible
            trigger={null}
            width={280}
            collapsedWidth={0}
            className="left-sidebar"
          >
            <SessionSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelectSession={selectSession}
              onCreateSession={createNewSession}
              isDark={isDark}
            />
          </Sider>

          {/* 左侧折叠按钮 */}
          <div 
            className="sidebar-trigger left"
            onClick={() => setLeftCollapsed(!leftCollapsed)}
          >
            {leftCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          {/* 中间主内容区 */}
          <Content className="main-content">
            <ChatArea
              sessionId={currentSessionId}
              agent={activeAgent}
              isDark={isDark}
              claudeStatus={claudeStatus}
            />
          </Content>

          {/* 右侧折叠按钮 */}
          <div 
            className="sidebar-trigger right"
            onClick={() => setRightCollapsed(!rightCollapsed)}
          >
            {rightCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          {/* 右侧边栏 - 工具面板 */}
          <Sider
            collapsed={rightCollapsed}
            onCollapse={setRightCollapsed}
            collapsible
            trigger={null}
            width={320}
            collapsedWidth={0}
            className="right-sidebar"
          >
            <RightPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              agents={AGENTS}
              activeAgent={activeAgent}
              onSelectAgent={setActiveAgent}
              isDark={isDark}
            />
          </Sider>
        </Layout>
      </Layout>
    </ThemeContext.Provider>
  );
}

export default App;
