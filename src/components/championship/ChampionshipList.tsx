import React from "react";
import { Button, Card, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { TrophyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { useChampionships } from "../../hooks/useChampionships";

const { Title, Text } = Typography;

type ChampionshipStatus = "CREATED" | "IN_PROGRESS" | "FINISHED";

type ChampionshipSummary = {
  id: string;
  name: string;
  status: ChampionshipStatus | string;
  teamCount: number;
  groupsCount: number;
};

const statusMap: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  CREATED: {
    label: "Não iniciado",
    className: "created",
  },
  IN_PROGRESS: {
    label: "Em andamento",
    className: "in-progress",
  },
  FINISHED: {
    label: "Finalizado",
    className: "finished",
  },
};

export const ChampionshipList: React.FC = () => {
  const navigate = useNavigate();

  const { useList } = useChampionships();
  const { data, isLoading, error } = useList();

  const championships = (data ?? []) as ChampionshipSummary[];

  const columns: ColumnsType<ChampionshipSummary> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
      width: 240,
      ellipsis: true,
      render: (name: string) => (
        <span className="championship-name">{name}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: string) => {
        const info = statusMap[status] || {
          label: status,
          className: "default",
        };

        return (
          <span className={`championship-status ${info.className}`}>
            {info.label}
          </span>
        );
      },
    },
    {
      title: "Times",
      dataIndex: "teamCount",
      key: "teamCount",
      width: 90,
      align: "center",
      render: (value: number) => (
        <span className="championship-number">{value ?? 0}</span>
      ),
    },
    {
      title: "Grupos",
      dataIndex: "groupsCount",
      key: "groupsCount",
      width: 90,
      align: "center",
      render: (value: number) => (
        <span className="championship-number">{value ?? 0}</span>
      ),
    },
    {
      title: "Ações",
      key: "actions",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Button
          ghost
          type="primary"
          className="championship-details-btn"
          onClick={() => navigate(`/championships/${record.id}`)}
        >
          Detalhes
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <main className="championships-page">
        <div className="championships-loading">Carregando campeonatos...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="championships-page">
        <div className="championships-error">
          Erro ao carregar campeonatos.
        </div>
      </main>
    );
  }

  return (
    <main className="championships-page">
      <header className="championships-header">
        <Title level={2} className="championships-title">
          <TrophyOutlined />
          Campeonatos
        </Title>

        <Text className="championships-subtitle">
          Acompanhe os campeonatos criados, seus status, grupos e quantidade de
          times.
        </Text>
      </header>

      <Card
        className="championships-card"
        title={
          <span className="championships-section-title">
            Lista de Campeonatos
          </span>
        }
      >
        <Table<ChampionshipSummary>
          rowKey="id"
          dataSource={championships}
          columns={columns}
          scroll={{
            x: "max-content",
          }}
          pagination={{
            responsive: true,
            pageSize: 10,
            showSizeChanger: false,
          }}
          locale={{
            emptyText: (
              <div className="championships-empty">
                Nenhum campeonato cadastrado.
              </div>
            ),
          }}
        />
      </Card>
    </main>
  );
};