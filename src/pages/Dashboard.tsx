import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Modal,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloseOutlined,
  CrownOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  StarFilled,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { http } from '../api/http';
import { authStore } from '../auth/store';

const { Title, Text } = Typography;

interface InactivePlayer {
  name: string;
  lastParticipation: string | null;
}

interface Championship {
  id: string;
  name: string;
  status: 'CREATED' | 'IN_PROGRESS' | 'FINISHED' | string;
  teamCount: number;
  groupsCount: number;
  createdAt: string;
  sportType?: 'VOLLEYBALL' | 'FOOTBALL';
}

interface CurrentSession {
  sessionId: string;
  dateFormatted?: string;
  courts?: unknown[];
}

interface DashboardStats {
  finishedChampionships: number;
  activePlayers: number;
  inactivePlayers: number;
}

type StatTone = 'primary' | 'warning' | 'danger';

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  tone: StatTone;
  onClick?: () => void;
  tooltip?: string;
}> = ({ icon, title, value, tone, onClick, tooltip }) => (
  <Card
    className={[
      'dashboard-card',
      'dashboard-stat-card',
      `stat-${tone}`,
      onClick ? 'clickable' : '',
    ].join(' ')}
    onClick={onClick}
  >
    <Statistic
      title={
        <span className="dashboard-stat-title">
          {title}

          {tooltip && (
            <Tooltip title={tooltip}>
              <InfoCircleOutlined />
            </Tooltip>
          )}
        </span>
      }
      value={value}
      prefix={icon}
    />
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const auth = authStore.get();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    finishedChampionships: 0,
    activePlayers: 0,
    inactivePlayers: 0,
  });

  const [inactiveList, setInactiveList] = useState<InactivePlayer[]>([]);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);

  const planName = auth.planName || 'Free';
  const features: string[] = auth.features || [];

  const isFreePlan = planName === 'Free';
  const isElitePlan = planName === 'Elite';
  const sportIcon = auth.sportType === 'FOOTBALL' ? '⚽' : '🏐';
  const placeLabel = auth.sportType === 'FOOTBALL' ? 'campo(s)' : 'quadra(s)';

  const planLimits: Record<string, { players: string; championships: string }> = {
    Free: {
      players: '20 jogadores',
      championships: 'Sem campeonatos',
    },
    Pro: {
      players: 'Ilimitados',
      championships: 'Até 2 campeonatos',
    },
    Elite: {
      players: 'Ilimitados',
      championships: 'Ilimitados',
    },
  };

  const statusLabel: Record<string, string> = {
    CREATED: 'Em criação',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Finalizado',
  };

  const limits = planLimits[planName] || planLimits.Free;

  const userInitial = useMemo(() => {
    return auth.userName?.trim()?.charAt(0)?.toUpperCase() || 'U';
  }, [auth.userName]);

  const planClass = useMemo(() => {
    const normalized = planName.toLowerCase();

    if (normalized === 'pro') return 'plan-pro';
    if (normalized === 'elite') return 'plan-elite';

    return 'plan-free';
  }, [planName]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [champsRes, playersRes, inactiveRes, sessionRes] = await Promise.all([
          http.get('/championships'),
          http.get('/players'),
          http.get('/dashboard/inactive-players'),
          http.get('/game-sessions/current').catch(() => ({ data: null })),
        ]);

        const allChampionships: Championship[] = Array.isArray(champsRes.data)
          ? champsRes.data
          : [];

        const players = Array.isArray(playersRes.data) ? playersRes.data : [];

        const inactivePlayers: InactivePlayer[] = Array.isArray(inactiveRes.data)
          ? inactiveRes.data.map((item: any) => ({
              name: item.name,
              lastParticipation: item.lastParticipation,
            }))
          : [];

        const finished = allChampionships.filter(
          (championship) => championship.status === 'FINISHED',
        ).length;

        const sortedChampionships = [...allChampionships].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setStats({
          finishedChampionships: finished,
          activePlayers: players.length,
          inactivePlayers: inactivePlayers.length,
        });

        setInactiveList(inactivePlayers);
        setChampionships(sortedChampionships.slice(0, 5));
        setCurrentSession(sessionRes.data || null);
      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
        messageApi.error('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [messageApi]);

  useEffect(() => {
    const updatePlan = async () => {
      try {
        const { data } = await http.get('/checkout/status');

        if (data?.active && data.planName !== authStore.get().planName) {
          authStore.set({
            ...authStore.get(),
            planName: data.planName,
          });
        }
      } catch {
        // Atualização silenciosa do plano.
      }
    };

    updatePlan();
  }, []);

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca participou';

    const now = new Date();
    const then = new Date(dateStr);

    if (Number.isNaN(then.getTime())) {
      return 'Data inválida';
    }

    const diffDays = Math.floor(
      (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';

    return `${diffDays} dias atrás`;
  };

  const getStatusClass = (status: string) => {
    if (status === 'CREATED') return 'status-created';
    if (status === 'IN_PROGRESS') return 'status-in-progress';
    if (status === 'FINISHED') return 'status-finished';

    return 'status-created';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <main className="dashboard-page">
      {contextHolder}

      <header className="dashboard-header">
        <Avatar className="dashboard-avatar">{userInitial}</Avatar>

        <div className="dashboard-header-content">
          <Title level={2} className="dashboard-title">
            Seja bem-vindo(a), {auth.userName?.toUpperCase()}
          </Title>

          <div className="dashboard-tags">
            <Tag className={`dashboard-tag plan-tag ${planClass}`}>
              <StarFilled />
              Plano {planName}
            </Tag>

            {auth.emailVerified ? (
              <Tag className="dashboard-tag tag-success">E-mail verificado</Tag>
            ) : (
              <Tag className="dashboard-tag tag-warning">
                E-mail não verificado
              </Tag>
            )}
          </div>
        </div>
      </header>

      <Card className={`dashboard-card dashboard-plan-card ${planClass}`}>
        <section className="dashboard-plan-content">
          <div className="dashboard-plan-info">
            <div className="dashboard-plan-title">
              <CrownOutlined />
              <span>
                Plano {planName}
                {isFreePlan ? ' — Recursos Limitados' : ''}
              </span>
            </div>

            <div className="dashboard-plan-limits">
              <span>{sportIcon} {limits.players}</span>
              <span>🏆 {limits.championships}</span>
              <span>✅ {features.length} funcionalidades</span>
            </div>
          </div>

          <div className="dashboard-plan-actions">
            {isFreePlan ? (
              <Button
                type="primary"
                icon={<ArrowUpOutlined />}
                className="dashboard-btn warning"
                onClick={() => navigate('/upgrade')}
              >
                Fazer Upgrade
              </Button>
            ) : (
              <>
                <Button
                  icon={<ArrowDownOutlined />}
                  className="dashboard-btn danger-outline"
                  onClick={() => navigate('/upgrade')}
                >
                  Gerenciar Plano
                </Button>

                {!isElitePlan && (
                  <Button
                    type="primary"
                    icon={<ArrowUpOutlined />}
                    className="dashboard-btn warning"
                    onClick={() => navigate('/upgrade')}
                  >
                    Upgrade p/ Elite
                  </Button>
                )}
              </>
            )}
          </div>
        </section>
      </Card>

      {currentSession && (
        <Card className="dashboard-card dashboard-current-session">
          <section className="dashboard-current-session-content">
            <div>
              <div className="dashboard-current-session-title">
                <PlayCircleOutlined />
                <span>Sessão Atual</span>
              </div>

              <Text className="dashboard-current-session-meta">
                {currentSession.dateFormatted} •{' '}
                {currentSession.courts?.length || 0} {placeLabel}
              </Text>
            </div>

            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              className="dashboard-btn primary"
              onClick={() =>
                navigate(`/friendly-sessions/${currentSession.sessionId}`)
              }
            >
              Iniciar Jogos
            </Button>
          </section>
        </Card>
      )}

      <section className="dashboard-stats-grid">
        <StatCard
          icon={<TrophyOutlined />}
          title="Campeonatos finalizados"
          value={stats.finishedChampionships}
          tone="primary"
        />

        <StatCard
          icon={<UserOutlined />}
          title="Atletas ativos"
          value={stats.activePlayers}
          tone="warning"
          tooltip={limits.players}
        />

        <StatCard
          icon={<WarningOutlined />}
          title="Ausentes >30 dias"
          value={stats.inactivePlayers}
          tone="danger"
          onClick={() => setInactiveModalOpen(true)}
        />
      </section>

      <section className="dashboard-actions-grid">
        {features.includes('campeonatos') && (
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="dashboard-action-btn action-primary"
            onClick={() => navigate('/manual-teams')}
          >
            Criar Campeonato
          </Button>
        )}

        <Button
          size="large"
          icon={<ThunderboltOutlined />}
          className="dashboard-action-btn action-outline-primary"
          onClick={() => navigate('/generator')}
        >
          Times Avulsos
        </Button>

        <Button
          size="large"
          icon={<UserOutlined />}
          className="dashboard-action-btn action-warning"
          onClick={() => navigate('/players')}
        >
          Atletas
        </Button>

        <Button
          size="large"
          icon={<SettingOutlined />}
          className="dashboard-action-btn action-info"
          onClick={() => navigate('/skills')}
        >
          Skills
        </Button>
      </section>

      <Card
        className="dashboard-section-card"
        title={<span className="dashboard-section-title">Últimos campeonatos</span>}
      >
        {championships.length > 0 ? (
          <div className="championship-list">
            {championships.map((championship) => (
              <button
                key={championship.id}
                type="button"
                className="championship-row"
                onClick={() => navigate(`/championships/${championship.id}`)}
              >
                <span className="championship-info">
                  <span className="championship-name">{championship.name}</span>

                  <span className="championship-meta">
                    {championship.teamCount} times · {championship.groupsCount}{' '}
                    grupos
                  </span>

                  <span className="championship-date">
                    {formatDate(championship.createdAt)}
                  </span>
                </span>

                <Tag
                  className={`status-tag ${getStatusClass(championship.status)}`}
                >
                  {statusLabel[championship.status] || championship.status}
                </Tag>
              </button>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-state">Nenhum campeonato</div>
        )}
      </Card>

      <Modal
        title={
          <span className="dashboard-modal-title">
            Jogadores Inativos (mais de 30 dias)
          </span>
        }
        open={inactiveModalOpen}
        onCancel={() => setInactiveModalOpen(false)}
        footer={null}
        width={600}
        className="dashboard-inactive-modal"
        closeIcon={<CloseOutlined className="dashboard-modal-close" />}
      >
        <Table<InactivePlayer>
          dataSource={inactiveList}
          rowKey="name"
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Nome',
              dataIndex: 'name',
            },
            {
              title: 'Última participação',
              dataIndex: 'lastParticipation',
              render: (value: string | null) => (
                <span className={value ? 'inactive-date' : 'inactive-never'}>
                  {formatTimeAgo(value)}
                </span>
              ),
            },
          ]}
          pagination={{
            pageSize: 10,
            responsive: true,
          }}
        />
      </Modal>
    </main>
  );
}
