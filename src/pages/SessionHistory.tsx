import { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Spin, Tag, Button, Empty } from 'antd';
import { HistoryOutlined, PlayCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';

const { Title, Text } = Typography;

interface SessionSummary {
  sessionId: string;
  createdAt: string;
  mode: string;
  teamCount: number;
  playersPerTeam: number;
  playersCount: number;
  playDate: string | null;
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    http.get('/session-history')
      .then(res => {
        setSessions(res.data);
      })
      .catch((err) => console.error('Erro ao carregar sessões:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filtra apenas sessões com data futura
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    
    // Filtra sessões futuras
    const futureSessions = sessions.filter(session => {
      if (!session.playDate) return false;
      return new Date(session.playDate) > now;
    });

    // Agrupa por data/hora e mantém apenas a mais recente de cada grupo
    const grouped = new Map<string, SessionSummary>();
    
    futureSessions.forEach(session => {
      const key = session.playDate!; // playDate já validado como não nulo
      if (!grouped.has(key) || new Date(session.createdAt) > new Date(grouped.get(key)!.createdAt)) {
        grouped.set(key, session);
      }
    });

    return Array.from(grouped.values());
  }, [sessions]);

  const modeLabel = (mode: string) => mode === 'DB' ? 'Sorteio' : 'Potes';

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2} style={{ color: 'var(--primary)', marginBottom: 24, fontSize: 'clamp(20px, 4vw, 28px)' }}>
        <HistoryOutlined style={{ marginRight: 12 }} />
        Próximos Jogos
      </Title>

      {upcomingSessions.length === 0 ? (
        <Card style={{ backgroundColor: 'var(--surface-2)', border: '1px solid #333', textAlign: 'center', padding: 40 }}>
          <Empty description="Nenhum jogo agendado" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {upcomingSessions.map(session => (
            <Col xs={24} sm={12} md={8} key={session.sessionId}>
              <Card
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
                styles={{ body: { padding: 16 } }}
                hoverable
              >
                <div style={{ marginBottom: 12 }}>
                  <Tag color={session.mode === 'DB' ? 'blue' : 'orange'}>{modeLabel(session.mode)}</Tag>
                  {session.playDate && (
                    <Text style={{ color: 'var(--primary)', fontSize: 12, marginLeft: 8 }}>
                      {new Date(session.playDate).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(session.playDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#ccc', display: 'block' }}>
                    <TeamOutlined /> {session.teamCount} times • {session.playersPerTeam} jogadores/time
                  </Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>
                    {session.playersCount} jogadores
                  </Text>
                </div>

                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  block
                  style={{ fontWeight: 'bold', color: '#000' }}
                  onClick={() => navigate(`/friendly-sessions/${session.sessionId}`)}
                >
                  Ver Detalhes
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}