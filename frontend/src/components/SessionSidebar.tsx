import { useState } from 'react';
import { Input, Button, List, Badge, Typography, Space, Tooltip, Empty, Divider } from 'antd';
import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './SessionSidebar.css';

const { Text } = Typography;
const { Search } = Input;

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  unread?: number;
  isActive?: boolean;
}

interface SessionSidebarProps {
  sessions: Session[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  isDark: boolean;
}

function SessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  isDark
}: SessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  // 过滤会话
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 按时间分组
  const groupSessionsByTime = (sessions: Session[]) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 24 * 60 * 60 * 1000;
    const lastWeek = today - 7 * 24 * 60 * 60 * 1000;

    const groups: { [key: string]: Session[] } = {
      '今天': [],
      '昨天': [],
      '最近7天': [],
      '更早': []
    };

    sessions.forEach(session => {
      if (session.timestamp >= today) {
        groups['今天'].push(session);
      } else if (session.timestamp >= yesterday) {
        groups['昨天'].push(session);
      } else if (session.timestamp >= lastWeek) {
        groups['最近7天'].push(session);
      } else {
        groups['更早'].push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByTime(filteredSessions);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={`session-sidebar ${isDark ? 'dark' : 'light'}`}>
      {/* 头部 */}
      <div className="sidebar-header">
        <div className="header-title">
          <MessageOutlined className="title-icon" />
          <Text strong className="title-text">会话历史</Text>
        </div>
        <Tooltip title="新建会话">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={onCreateSession}
            className="new-chat-btn"
          />
        </Tooltip>
      </div>

      {/* 搜索框 */}
      <div className="search-container">
        <Search
          placeholder="搜索会话..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          className="session-search"
        />
      </div>

      {/* 会话列表 */}
      <div className="sessions-list">
        {filteredSessions.length === 0 ? (
          <Empty
            description="暂无会话"
            className="empty-state"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
            groupSessions.length > 0 && (
              <div key={groupName} className="session-group">
                <div className="group-header">
                  <ClockCircleOutlined className="group-icon" />
                  <Text type="secondary" className="group-title">{groupName}</Text>
                </div>
                <List
                  dataSource={groupSessions}
                  renderItem={(session) => (
                    <List.Item
                      className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
                      onClick={() => onSelectSession(session.id)}
                      onMouseEnter={() => setHoveredSession(session.id)}
                      onMouseLeave={() => setHoveredSession(null)}
                    >
                      <div className="session-content">
                        <div className="session-title-row">
                          <Text 
                            strong 
                            className="session-title"
                            ellipsis={{ tooltip: session.title }}
                          >
                            {session.title}
                          </Text>
                          <Text className="session-time" type="secondary">
                            {formatTime(session.timestamp)}
                          </Text>
                        </div>
                        <div className="session-preview-row">
                          <Text 
                            className="session-preview"
                            type="secondary"
                            ellipsis
                          >
                            {session.lastMessage || '暂无消息'}
                          </Text>
                          {session.unread && session.unread > 0 && (
                            <Badge 
                              count={session.unread} 
                              size="small"
                              className="unread-badge"
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* 悬停操作 */}
                      {hoveredSession === session.id && (
                        <div className="session-actions">
                          <Tooltip title="重命名">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              className="action-btn"
                            />
                          </Tooltip>
                          <Tooltip title="删除">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              className="action-btn delete"
                            />
                          </Tooltip>
                        </div>
                      )}
                    </List.Item>
                  )}
                />
              </div>
            )
          ))
        )}
      </div>

      {/* 底部信息 */}
      <div className="sidebar-footer">
        <Divider className="footer-divider" />
        <Space direction="vertical" size={4} className="footer-info">
          <Text type="secondary" className="footer-text">
            共 {sessions.length} 个会话
          </Text>
        </Space>
      </div>
    </div>
  );
}

export default SessionSidebar;
