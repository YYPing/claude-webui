import { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Space, Badge } from 'antd';
import { SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface Permission {
  allow: string[];
}

const API_BASE = 'http://localhost:3001/api';

function PermissionsView() {
  const [permissions, setPermissions] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/permissions`);
      const data = await res.json();
      setPermissions(data.permissions);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const categorizePermissions = (perms: string[]) => {
    const categories: Record<string, string[]> = {
      'Bash命令': [],
      '文件操作': [],
      '其他': []
    };

    perms.forEach(perm => {
      if (perm.startsWith('Bash(')) {
        categories['Bash命令'].push(perm);
      } else if (['Read', 'Edit', 'Write', 'Glob', 'Grep'].includes(perm)) {
        categories['文件操作'].push(perm);
      } else {
        categories['其他'].push(perm);
      }
    });

    return categories;
  };

  if (loading) {
    return <Card loading title="🔐 权限配置" />;
  }

  if (!permissions || !permissions.allow || permissions.allow.length === 0) {
    return (
      <Card title="🔐 权限配置">
        <Text type="secondary">暂无权限配置</Text>
      </Card>
    );
  }

  const categories = categorizePermissions(permissions.allow);

  return (
    <Card title="🔐 权限配置" style={{ marginTop: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Badge
          count={permissions.allow.length}
          style={{ backgroundColor: '#52c41a' }}
        >
          <Title level={5}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            已允许的权限
          </Title>
        </Badge>

        {Object.entries(categories).map(([category, perms]) => (
          perms.length > 0 && (
            <Card
              key={category}
              size="small"
              title={category}
              style={{ marginTop: 16 }}
            >
              <List
                size="small"
                dataSource={perms}
                renderItem={(perm) => (
                  <List.Item>
                    <Tag color="success">
                      <SafetyCertificateOutlined /> {perm}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          )
        ))}
      </Space>
    </Card>
  );
}

export default PermissionsView;