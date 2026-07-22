import React, { useState } from "react";
import { Button, Card, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { HistoryOutlined, PlusOutlined, TrophyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { useChampionships } from "../../hooks/useChampionships";
import { http } from "../../api/http";

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
  const [recoveringLatest, setRecoveringLatest] = useState(false);

  const { useList } = useChampionships();
  const { data, isLoading, error } = useList();

  const championships = (data ?? []) as ChampionshipSummary[];

  const handleUseLatestGeneration = async () => {
    setRecoveringLatest(true);
    try {
      const { data: generation } = await http.get<{ sessionId: string }>(
        "/teams/latest-session"
      );
      navigate(
        `/manual-teams?sessionId=${encodeURIComponent(generation.sessionId)}`
      );
    } catch (requestError: unknown) {
      const responseData =
        typeof requestError === "object" &&
        requestError !== null &&
        "response" in requestError
          ? (requestError as { response?: { data?: { message?: string; error?: string } } })
              .response?.data
          : undefined;
      message.error(
        responseData?.message ??
          responseData?.error ??
          "Nenhuma geração de times foi encontrada."
      );
    } finally {
      setRecoveringLatest(false);
    }
  };

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

        <div className="championships-create-actions">
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            loading={recoveringLatest}
            onClick={() => void handleUseLatestGeneration()}
            className="championships-use-generation-btn"
          >
            Usar última geração
          </Button>

          <Button
            icon={<PlusOutlined />}
            onClick={() => navigate("/manual-teams")}
            className="championships-manual-teams-btn"
          >
            Montar times manualmente
          </Button>
        </div>
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
