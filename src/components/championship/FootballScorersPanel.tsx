import { useCallback, useEffect, useState } from 'react';
import { Card, Empty, Table, Tag, message } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { http } from '../../api/http';

type ScorerStanding = {
  playerId: string;
  playerName: string;
  teamIndex: number;
  teamName: string;
  goals: number;
  ownGoals: number;
};

interface Props {
  championshipId: string;
}

const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
};

export function FootballScorersPanel({ championshipId }: Props) {
  const [loading, setLoading] = useState(false);
  const [scorers, setScorers] = useState<ScorerStanding[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await http.get<ScorerStanding[]>(
        `/championships/${championshipId}/scorers`
      );
      setScorers(response.data);
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao carregar artilharia'));
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card
      title={<span style={{ color: 'var(--primary)' }}><AimOutlined /> Artilharia</span>}
      loading={loading}
    >
      {scorers.length === 0 ? (
        <Empty description="Nenhum gol registrado" />
      ) : (
        <Table
          rowKey={(item) => `${item.playerId}-${item.teamIndex}`}
          pagination={false}
          dataSource={scorers}
          scroll={{ x: 520 }}
          columns={[
            {
              title: '#',
              width: 56,
              render: (_value, _item, index) => index + 1,
            },
            {
              title: 'Jogador',
              dataIndex: 'playerName',
              render: (name: string, item: ScorerStanding) => (
                <span>
                  <strong>{name}</strong>
                  <Tag style={{ marginLeft: 8 }}>{item.teamName}</Tag>
                </span>
              ),
            },
            {
              title: 'Gols',
              dataIndex: 'goals',
              width: 90,
              align: 'center' as const,
              render: (goals: number) => <strong style={{ color: 'var(--primary)' }}>{goals}</strong>,
            },
            {
              title: 'Gols contra',
              dataIndex: 'ownGoals',
              width: 120,
              align: 'center' as const,
            },
          ]}
        />
      )}
    </Card>
  );
}
