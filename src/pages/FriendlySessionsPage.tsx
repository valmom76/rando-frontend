import { useEffect, useState } from 'react';
import { Card, List, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';

export default function FriendlySessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    http.get('/game-sessions/friendly').then(res => setSessions(res.data));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={2} style={{ color: 'var(--primary)' }}>Friendly Games</Typography.Title>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={sessions}
        renderItem={(item: any) => (
          <List.Item>
            <Card
              hoverable
              onClick={() => navigate(`/friendly-sessions/${item.sessionId}`)}
              style={{ backgroundColor: 'var(--surface-2)', borderColor: '#333' }}
            >
              <Typography.Title level={4} style={{ color: '#fff' }}>Games on {item.dateFormatted}</Typography.Title>
              <Typography.Text style={{ color: '#aaa' }}>{item.teamCount} teams</Typography.Text>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}