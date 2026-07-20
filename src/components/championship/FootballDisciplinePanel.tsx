import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { AuditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { http } from '../../api/http';

const { Text, Title } = Typography;

type Suspension = {
  id: string;
  playerId: string;
  playerName: string;
  teamIndex: number;
  teamName: string;
  reason: string;
  totalMatches: number;
  remainingMatches: number;
  status: string;
  sourceMatchId: string;
  appealId?: string | null;
  appealStatus?: string | null;
  appealReason?: string | null;
  decisionNotes?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
};

interface Props {
  championshipId: string;
}

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativa',
  SERVED: 'Cumprida',
  REVOKED_BY_APPEAL: 'Revogada por recurso',
};

const reasonLabel: Record<string, string> = {
  YELLOW_ACCUMULATION: 'Acúmulo de amarelos',
  SECOND_YELLOW: 'Segundo amarelo',
  DIRECT_RED: 'Vermelho direto',
};

const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
};

export function FootballDisciplinePanel({ championshipId }: Props) {
  const [loading, setLoading] = useState(false);
  const [suspensions, setSuspensions] = useState<Suspension[]>([]);
  const [selected, setSelected] = useState<Suspension>();
  const [appealVisible, setAppealVisible] = useState(false);
  const [decisionVisible, setDecisionVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionAccepted, setDecisionAccepted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await http.get<{ suspensions: Suspension[] }>(
        `/championships/${championshipId}/discipline`
      );
      setSuspensions(response.data.suspensions);
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao carregar disciplina'));
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitAppeal = async () => {
    if (!selected || !appealReason.trim()) return;
    try {
      await http.post(
        `/championships/${championshipId}/suspensions/${selected.id}/appeals`,
        { reason: appealReason.trim() }
      );
      message.success('Recurso registrado');
      setAppealVisible(false);
      setAppealReason('');
      await load();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao registrar recurso'));
    }
  };

  const submitDecision = async () => {
    if (!selected?.appealId || !decisionNotes.trim()) return;
    try {
      await http.put(
        `/championships/${championshipId}/appeals/${selected.appealId}/decision`,
        { accepted: decisionAccepted, notes: decisionNotes.trim() }
      );
      message.success(decisionAccepted ? 'Recurso aceito e suspensão revogada' : 'Recurso rejeitado');
      setDecisionVisible(false);
      setDecisionNotes('');
      await load();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao julgar recurso'));
    }
  };

  return (
    <Card
      title={<span style={{ color: 'var(--primary)' }}><AuditOutlined /> Disciplina e Recursos</span>}
      loading={loading}
    >
      <Alert
        type="info"
        showIcon
        message="Histórico auditável"
        description="Recursos aceitos revogam a suspensão, mas preservam o cartão, a justificativa e a decisão da comissão."
        style={{ marginBottom: 16 }}
      />

      {suspensions.length === 0 ? (
        <Empty description="Nenhuma suspensão registrada" />
      ) : (
        <List
          dataSource={suspensions}
          renderItem={(suspension) => (
            <List.Item
              actions={[
                !suspension.appealStatus && suspension.status === 'ACTIVE' ? (
                  <Button key="appeal" onClick={() => {
                    setSelected(suspension);
                    setAppealVisible(true);
                  }}>
                    Registrar recurso
                  </Button>
                ) : suspension.appealStatus === 'PENDING' ? (
                  <Space key="decision">
                    <Button type="primary" icon={<CheckOutlined />} onClick={() => {
                      setSelected(suspension);
                      setDecisionAccepted(true);
                      setDecisionVisible(true);
                    }}>
                      Aceitar
                    </Button>
                    <Button danger icon={<CloseOutlined />} onClick={() => {
                      setSelected(suspension);
                      setDecisionAccepted(false);
                      setDecisionVisible(true);
                    }}>
                      Rejeitar
                    </Button>
                  </Space>
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <Space wrap>
                    <Text strong>{suspension.playerName}</Text>
                    <Tag>{suspension.teamName}</Tag>
                    <Tag color={
                      suspension.status === 'ACTIVE'
                        ? 'red'
                        : suspension.status === 'REVOKED_BY_APPEAL'
                          ? 'green'
                          : 'default'
                    }>
                      {statusLabel[suspension.status] ?? suspension.status}
                    </Tag>
                  </Space>
                }
                description={
                  <Space orientation="vertical" size={2}>
                    <Text>{reasonLabel[suspension.reason] ?? suspension.reason}</Text>
                    <Text type="secondary">
                      {suspension.remainingMatches} de {suspension.totalMatches} partida(s) restante(s)
                    </Text>
                    {suspension.appealStatus && (
                      <Text type="secondary">
                        Recurso: {suspension.appealStatus} · {suspension.appealReason}
                      </Text>
                    )}
                    {suspension.decisionNotes && (
                      <Text type="secondary">
                        Decisão: {suspension.decisionNotes} · {suspension.decidedBy}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title="Registrar recurso"
        open={appealVisible}
        onCancel={() => setAppealVisible(false)}
        onOk={submitAppeal}
        okText="Protocolar recurso"
      >
        <Title level={5}>{selected?.playerName}</Title>
        <Input.TextArea
          rows={5}
          value={appealReason}
          onChange={(event) => setAppealReason(event.target.value)}
          placeholder="Fundamentação apresentada à comissão organizadora"
        />
      </Modal>

      <Modal
        title={decisionAccepted ? 'Aceitar recurso' : 'Rejeitar recurso'}
        open={decisionVisible}
        onCancel={() => setDecisionVisible(false)}
        onOk={submitDecision}
        okText="Registrar decisão"
        okButtonProps={{ danger: !decisionAccepted }}
      >
        <Text>{selected?.appealReason}</Text>
        <Input.TextArea
          rows={5}
          value={decisionNotes}
          onChange={(event) => setDecisionNotes(event.target.value)}
          placeholder="Fundamentação da decisão da comissão"
          style={{ marginTop: 16 }}
        />
      </Modal>
    </Card>
  );
}
