import { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Space, Badge, Empty } from 'antd';
import { ApiOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface MCP {
  name: string;
  enabled: boolean;
  description: string;
}

const API_BASE = 'http://localhost:3001/api';

function MCPView() {
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMCPs();
  }, []);

  const fetchMCPs = async () => {
    try {
      const res = await fetch(`${API_BASE}/mcp`);
      const data = await res.json();
      setMcps(data.mcps || []);
    } catch (err) {
      console.error('Failed to fetch MCPs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card loading title="🔧 MCP服务器" />;
  }

  if (mcps.length === 0) {
    return (
      <Card title="🔧 MCP服务器" style={{ marginTop: 24 }}>
        <Empty
          description="未配置 MCP 服务器"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Text type="secondary">
            使用 <code>claude mcp add</code> 添加 MCP 服务器
          </Text>
        </Empty>
      </Card>
    );
  }

  return (
    <Card title="🔧 MCP服务器" style={{ marginTop: 24 }}>
      <List
        dataSource={mcps}
        renderItem={(mcp) => (
          <List.Item
            actions={[
              mcp.enabled ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  已启用
                </Tag>
              ) : (
                <Tag icon={<StopOutlined />} color="default">
                  已禁用
                </Tag>
              )
            ]}
          >
            <List.Item.Meta
              avatar={<ApiOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title={mcp.name}
              description={mcp.description}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}

export default MCPView;