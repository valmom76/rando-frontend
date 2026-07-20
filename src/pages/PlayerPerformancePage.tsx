import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloseOutlined,
  LineChartOutlined,
  RiseOutlined,
  SearchOutlined,
  StarOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { http } from '../api/http';

const { Title } = Typography;

interface PlayerPerformance {
  id: string;
  name: string;
  sex: string;
  overall: number;
  nivel: string;
  bestSkill: string;
  worstSkill: string;
  skills: Record<string, number>;
  lastUpdate: string;
}

interface PlayerEvolution {
  skillName: string;
  points: {
    date: string;
    rating: number;
  }[];
}

type StatTone = 'primary' | 'info' | 'warning' | 'danger';

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  tone: StatTone;
}> = ({ icon, title, value, tone }) => (
  <Card className={`dashboard-card performance-stat-card stat-${tone}`}>
    <Statistic
      title={<span className="performance-stat-title">{title}</span>}
      value={value}
      prefix={icon}
    />
  </Card>
);

export default function PlayerPerformancePage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<PlayerPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | undefined>();
  const [sortSkill, setSortSkill] = useState<string>('overall');

  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [evolutionModalOpen, setEvolutionModalOpen] = useState(false);
  const [evolutionSkills, setEvolutionSkills] = useState<string[]>([]);
  const [evolutionLoading, setEvolutionLoading] = useState(false);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const res = await http.get('/players/performance');
        setData(Array.isArray(res.data) ? res.data : []);
      } catch {
        messageApi.error('Não foi possível carregar o desempenho dos atletas.');
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [messageApi]);

  const allSkills = useMemo(() => {
    return data.length > 0 ? Object.keys(data[0].skills || {}) : [];
  }, [data]);

  const filtered = useMemo(() => {
    return data
      .filter(
        (player) =>
          player.name.toLowerCase().includes(search.toLowerCase()) &&
          (!levelFilter || player.nivel === levelFilter),
      )
      .sort((a, b) => {
        if (sortSkill === 'overall') return b.overall - a.overall;

        const aVal = a.skills[sortSkill] || 0;
        const bVal = b.skills[sortSkill] || 0;

        return bVal - aVal || b.overall - a.overall;
      });
  }, [data, search, levelFilter, sortSkill]);

  const kpis = useMemo(() => {
    return {
      total: data.length,
      avgOverall: data.length
        ? Math.round(
            (data.reduce((sum, player) => sum + player.overall, 0) / data.length) * 10,
          ) / 10
        : 0,
      elite: data.filter((player) => player.nivel === 'Elite').length,
      developing: data.filter(
        (player) =>
          player.nivel === 'A desenvolver' || player.nivel === 'Iniciante',
      ).length,
    };
  }, [data]);

  const normalizeLevelClass = (level: string) => {
    return level
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  };

  const getOverallClass = (value: number) => {
    if (value >= 4) return 'overall-high';
    if (value >= 3) return 'overall-medium';
    return 'overall-low';
  };

  const handleViewEvolution = async (playerId: string) => {
    setEvolutionLoading(true);

    try {
      const res = await http.get(`/players/${playerId}/evolution`);
      const evolutions = res.data as PlayerEvolution[];

      const dateSet = new Set<string>();
      const skillsSet = new Set<string>();

      evolutions.forEach((skill) => {
        skillsSet.add(skill.skillName);
        skill.points.forEach((point) => dateSet.add(point.date));
      });

      const sortedDates = Array.from(dateSet).sort();
      const skillsArray = Array.from(skillsSet);

      const chartData = sortedDates.map((dateStr) => {
        const point: any = {
          date: new Date(dateStr).toLocaleDateString('pt-BR'),
        };

        evolutions.forEach((skill) => {
          const found = skill.points.find((item) => item.date === dateStr);
          point[skill.skillName] = found ? found.rating : null;
        });

        return point;
      });

      setEvolutionSkills(skillsArray);
      setEvolutionData(chartData);
      setEvolutionModalOpen(true);
    } catch {
      messageApi.error('Não foi possível carregar a evolução do atleta.');
    } finally {
      setEvolutionLoading(false);
    }
  };

  const columns: ColumnsType<PlayerPerformance> = [
    {
      title: '#',
      key: 'rank',
      width: 54,
      render: (_, __, index) => (
        <span className={`performance-rank top-${index + 1}`}>{index + 1}</span>
      ),
    },
    {
      title: 'Atleta',
      dataIndex: 'name',
      key: 'name',
      width: 170,
      ellipsis: true,
      render: (name: string) => (
        <span className="performance-player-name">{name}</span>
      ),
    },
    {
      title: 'Overall',
      dataIndex: 'overall',
      key: 'overall',
      width: 95,
      sorter: (a, b) => a.overall - b.overall,
      render: (value: number) => (
        <Tag className={`overall-tag ${getOverallClass(value)}`}>
          {value.toFixed(1)}
        </Tag>
      ),
    },
    ...allSkills.map((skill) => ({
      title: skill,
      dataIndex: ['skills', skill],
      key: skill,
      width: 82,
      render: (value: number) =>
        value != null ? (
          <span className={`skill-score skill-${value}`}>{value}</span>
        ) : (
          <span className="skill-score skill-empty">—</span>
        ),
    })),
    {
      title: 'Nível',
      dataIndex: 'nivel',
      key: 'nivel',
      width: 130,
      render: (nivel: string) => (
        <span className={`level-tag level-${normalizeLevelClass(nivel)}`}>
          {nivel}
        </span>
      ),
    },
    {
      title: 'Progresso',
      key: 'bar',
      width: 110,
      render: (_, record) => (
        <div className="performance-progress">
          <div
            className="performance-progress-fill"
            style={
              {
                '--progress': `${(record.overall / 5) * 100}%`,
              } as React.CSSProperties
            }
          />
        </div>
      ),
    },
    {
      title: 'Evolução',
      key: 'evolution',
      width: 110,
      render: (_, record) => (
        <Button
          icon={<LineChartOutlined />}
          size="small"
          className="performance-evolution-btn"
          onClick={() => handleViewEvolution(record.id)}
        >
          Evolução
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <main className="performance-page">
      {contextHolder}

      <Title level={2} className="performance-title">
        🏐 Desempenho dos Atletas
      </Title>

      <section className="performance-kpi-grid">
        <StatCard
          icon={<UserOutlined />}
          title="Atletas"
          value={kpis.total}
          tone="primary"
        />

        <StatCard
          icon={<StarOutlined />}
          title="Média geral"
          value={kpis.avgOverall}
          tone="info"
        />

        <StatCard
          icon={<TrophyOutlined />}
          title="Elite"
          value={kpis.elite}
          tone="warning"
        />

        <StatCard
          icon={<RiseOutlined />}
          title="A desenvolver"
          value={kpis.developing}
          tone="danger"
        />
      </section>

      <section className="performance-filters">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar atleta..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="performance-search"
        />

        <Select
          placeholder="Filtrar por nível"
          allowClear
          value={levelFilter}
          onChange={setLevelFilter}
          className="performance-select"
          options={[
            'Elite',
            'Muito alto',
            'Alto',
            'Médio',
            'A desenvolver',
            'Iniciante',
          ].map((level) => ({
            value: level,
            label: level,
          }))}
        />

        <Select
          placeholder="Ordenar por"
          value={sortSkill}
          onChange={setSortSkill}
          className="performance-select"
          options={[
            {
              value: 'overall',
              label: 'Overall',
            },
            ...allSkills.map((skill) => ({
              value: skill,
              label: skill,
            })),
          ]}
        />
      </section>

      <Card
        className="performance-ranking-card"
        title={<span className="performance-section-title">Ranking Geral</span>}
      >
        <Table<PlayerPerformance>
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 15,
            responsive: true,
          }}
          scroll={{
            x: 'max-content',
          }}
        />
      </Card>

      <Modal
        title={
          <span className="performance-modal-title">
            Evolução dos Ratings
          </span>
        }
        open={evolutionModalOpen}
        onCancel={() => setEvolutionModalOpen(false)}
        footer={null}
        width="min(95vw, 900px)"
        closeIcon={<CloseOutlined className="performance-modal-close" />}
      >
        {evolutionLoading ? (
          <Spin />
        ) : evolutionData.length > 0 ? (
          <div className="performance-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evolutionData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="date"
                  stroke="var(--text-2)"
                  tick={{
                    fontSize: 12,
                    fill: 'var(--text-2)',
                  }}
                />

                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  stroke="var(--text-2)"
                  tick={{
                    fill: 'var(--text-2)',
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--text)',
                  }}
                />

                <Legend />

                {evolutionSkills.map((skill, index) => (
                  <Line
                    key={skill}
                    type="monotone"
                    dataKey={skill}
                    stroke={
                      [
                        'var(--info)',
                        'var(--primary)',
                        'var(--warn)',
                        '#a78bfa',
                        'var(--danger)',
                      ][index % 5]
                    }
                    strokeWidth={2}
                    dot={{
                      r: 4,
                    }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="performance-empty-chart">
            Nenhum dado de evolução disponível para este atleta.
          </div>
        )}
      </Modal>
    </main>
  );
}