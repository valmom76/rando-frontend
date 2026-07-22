import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  InputNumber,
  Progress,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined, ReloadOutlined, TeamOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { Navigate } from "react-router-dom";

import { http } from "../api/http";
import { authStore } from "../auth/store";
import "./AttendanceReportPage.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type PlayerAttendance = {
  playerId: string;
  playerName: string;
  active: boolean;
  attendances: number;
  eligibleSessions: number;
  absences: number;
  attendanceRate: number;
  lastAttendance?: string | null;
};

type AttendanceReport = {
  from: string;
  to: string;
  confirmedSessions: number;
  playersWithAttendance: number;
  totalAttendances: number;
  averagePlayersPerSession: number;
  players: PlayerAttendance[];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return fallback;
  }
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data !== "object" || data === null) return fallback;
  if ("error" in data && typeof data.error === "string") return data.error;
  return fallback;
};

const escapeCsv = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function AttendanceReportPage() {
  const [period, setPeriod] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(89, "day"),
    dayjs(),
  ]);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [minimumRate, setMinimumRate] = useState(30);
  const [minimumSessions, setMinimumSessions] = useState(3);
  const [onlyBelowMinimum, setOnlyBelowMinimum] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<AttendanceReport>("/management/attendance", {
        params: {
          from: period[0].format("YYYY-MM-DD"),
          to: period[1].format("YYYY-MM-DD"),
        },
      });
      setReport(data);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Não foi possível carregar o relatório."));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const displayedPlayers = useMemo(() => {
    const players = report?.players ?? [];
    if (!onlyBelowMinimum) return players;
    return players.filter(
      (player) =>
        player.active &&
        player.eligibleSessions >= minimumSessions &&
        player.attendanceRate < minimumRate
    );
  }, [minimumRate, minimumSessions, onlyBelowMinimum, report?.players]);

  const columns = useMemo<ColumnsType<PlayerAttendance>>(
    () => [
      {
        title: "#",
        width: 56,
        render: (_value, _record, index) => index + 1,
      },
      {
        title: "Jogador",
        dataIndex: "playerName",
        key: "playerName",
        width: 220,
        sorter: (first, second) =>
          first.playerName.localeCompare(second.playerName, "pt-BR"),
        render: (name: string, player) => (
          <Space>
            <Text strong>{name}</Text>
            {!player.active && <Tag>Inativo</Tag>}
          </Space>
        ),
      },
      {
        title: "Presenças",
        dataIndex: "attendances",
        key: "attendances",
        width: 110,
        align: "center",
        sorter: (first, second) => first.attendances - second.attendances,
      },
      {
        title: "Sessões consideradas",
        dataIndex: "eligibleSessions",
        key: "eligibleSessions",
        width: 160,
        align: "center",
        sorter: (first, second) => first.eligibleSessions - second.eligibleSessions,
      },
      {
        title: "Faltas",
        dataIndex: "absences",
        key: "absences",
        width: 90,
        align: "center",
        sorter: (first, second) => first.absences - second.absences,
      },
      {
        title: "Frequência",
        dataIndex: "attendanceRate",
        key: "attendanceRate",
        width: 210,
        sorter: (first, second) => first.attendanceRate - second.attendanceRate,
        render: (rate: number, player) => (
          player.eligibleSessions === 0 ? (
            <Text type="secondary">Sem base</Text>
          ) : (
            <Progress
              percent={rate}
              size="small"
              status={
                player.active &&
                player.eligibleSessions >= minimumSessions &&
                rate < minimumRate
                  ? "exception"
                  : "normal"
              }
              format={(value) => `${value ?? 0}%`}
            />
          )
        ),
      },
      {
        title: "Última presença",
        dataIndex: "lastAttendance",
        key: "lastAttendance",
        width: 140,
        render: (date?: string | null) =>
          date ? dayjs(date).format("DD/MM/YYYY") : "Nunca",
      },
      {
        title: "Indicador",
        key: "indicator",
        width: 130,
        render: (_value, player) => {
          if (!player.active) return <Tag>Inativo</Tag>;
          if (player.eligibleSessions < minimumSessions) {
            return <Tag color="blue">Amostra insuficiente</Tag>;
          }
          return player.attendanceRate < minimumRate ? (
            <Tag color="error">Abaixo da meta</Tag>
          ) : (
            <Tag color="success">Regular</Tag>
          );
        },
      },
    ],
    [minimumRate, minimumSessions]
  );

  const exportCsv = () => {
    if (!report) return;
    const lines = [
      [
        "Jogador",
        "Status",
        "Presenças",
        "Sessões consideradas",
        "Faltas",
        "Frequência (%)",
        "Última presença",
      ].map(escapeCsv).join(";"),
      ...report.players.map((player) =>
        [
          player.playerName,
          player.active ? "Ativo" : "Inativo",
          player.attendances,
          player.eligibleSessions,
          player.absences,
          player.attendanceRate,
          player.lastAttendance ?? "Nunca",
        ].map(escapeCsv).join(";")
      ),
    ];
    const blob = new Blob(["\uFEFF", lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `frequencia-${report.from}-${report.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (authStore.get().role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="attendance-report-page">
      <Title level={2} className="attendance-report-title">
        <TeamOutlined /> Relatório de frequência
      </Title>

      <Alert
        type="info"
        showIcon
        message="Somente presenças confirmadas entram neste relatório"
        description="Gerações de times e placares, isoladamente, não são tratados como comprovação de comparecimento. O indicador de baixa frequência é apenas apoio à decisão e não exclui jogadores automaticamente."
        className="attendance-report-alert attendance-report-alert-info"
      />

      <Card className="attendance-report-filter-card">
        <Space wrap size="middle" className="attendance-report-filter-actions">
          <RangePicker
            value={period}
            format="DD/MM/YYYY"
            allowClear={false}
            onChange={(dates) => {
              if (dates?.[0] && dates[1]) setPeriod([dates[0], dates[1]]);
            }}
          />

          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void loadReport()}
            className="attendance-report-action"
          >
            Atualizar
          </Button>

          <Button
            icon={<DownloadOutlined />}
            disabled={!report}
            onClick={exportCsv}
            className="attendance-report-action"
          >
            Exportar CSV
          </Button>
        </Space>
      </Card>

      <Row gutter={[12, 12]} className="attendance-report-stats">
        <Col xs={12} md={6}>
          <Card className="attendance-report-stat-card"><Statistic title="Sessões confirmadas" value={report?.confirmedSessions ?? 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="attendance-report-stat-card"><Statistic title="Jogadores presentes" value={report?.playersWithAttendance ?? 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="attendance-report-stat-card"><Statistic title="Presenças registradas" value={report?.totalAttendances ?? 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="attendance-report-stat-card"><Statistic title="Média por sessão" value={report?.averagePlayersPerSession ?? 0} precision={1} /></Card>
        </Col>
      </Row>

      <Card
        className="attendance-report-table-card"
        title="Frequência dos jogadores"
        extra={
          <Space wrap className="attendance-report-controls">
            <Text type="secondary">Meta mínima</Text>
            <InputNumber
              min={0}
              max={100}
              value={minimumRate}
              onChange={(value) => setMinimumRate(Number(value) || 0)}
              addonAfter="%"
              style={{ width: 110 }}
            />
            <Text type="secondary">Mínimo de sessões</Text>
            <InputNumber
              min={1}
              max={100}
              value={minimumSessions}
              onChange={(value) => setMinimumSessions(Math.max(1, Number(value) || 1))}
              style={{ width: 80 }}
            />
            <Switch
              checked={onlyBelowMinimum}
              onChange={setOnlyBelowMinimum}
              checkedChildren="Abaixo"
              unCheckedChildren="Todos"
            />
          </Space>
        }
      >
        {report?.confirmedSessions === 0 && (
          <Alert
            type="warning"
            showIcon
            message="Nenhuma sessão confirmada no período"
            description="Abra os amistosos realizados e confirme os jogadores que realmente compareceram."
            className="attendance-report-alert attendance-report-alert-warning"
          />
        )}

        <Table<PlayerAttendance>
          className="attendance-report-table"
          rowKey="playerId"
          columns={columns}
          dataSource={displayedPlayers}
          loading={loading}
          scroll={{ x: 1150 }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: "Nenhum jogador encontrado para os filtros selecionados." }}
        />
      </Card>
    </main>
  );
}
