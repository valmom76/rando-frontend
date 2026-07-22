import { useEffect, useState } from 'react';
import { Card, List, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';

export default function FriendlySessionsPage() {
  const [sessions, setSessions] = useState<Array<{
    sessionId: string;
    dateFormatted: string;
    teamCount: number;
    attendanceConfirmed: boolean;
  }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    http.get('/game-sessions/friendly').then(res => setSessions(res.data));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={2} style={{ color: 'var(--primary)' }}>Jogos amistosos</Typography.Title>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={sessions}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              onClick={() => navigate(`/friendly-sessions/${item.sessionId}`)}
              style={{ backgroundColor: 'var(--surface-2)', borderColor: '#333' }}
            >
              <Typography.Title level={4} style={{ color: '#fff' }}>Jogos de {item.dateFormatted}</Typography.Title>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <Typography.Text style={{ color: '#aaa' }}>{item.teamCount} times</Typography.Text>
                <Tag color={item.attendanceConfirmed ? 'success' : 'warning'}>
                  {item.attendanceConfirmed ? 'Presença confirmada' : 'Presença pendente'}
                </Tag>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
