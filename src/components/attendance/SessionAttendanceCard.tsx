import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { http } from "../../api/http";

const { Text } = Typography;

type AttendancePlayer = {
  playerId: string;
  playerName: string;
  active: boolean;
  suggestedByGeneration: boolean;
  attended: boolean;
};

type SessionAttendance = {
  sessionId: string;
  sessionDate: string;
  confirmed: boolean;
  confirmedAt?: string | null;
  updatedAt?: string | null;
  players: AttendancePlayer[];
};

type Props = {
  sessionId: string;
  readOnly?: boolean;
  onConfirmationChange?: (confirmed: boolean) => void;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return fallback;
  }
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data !== "object" || data === null) return fallback;
  if ("error" in data && typeof data.error === "string") return data.error;
  if ("message" in data && typeof data.message === "string") return data.message;
  return fallback;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export function SessionAttendanceCard({
  sessionId,
  readOnly = false,
  onConfirmationChange,
}: Props) {
  const [attendance, setAttendance] = useState<SessionAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<SessionAttendance>(
        `/management/attendance/sessions/${sessionId}`
      );
      setAttendance(data);
      onConfirmationChange?.(data.confirmed);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Não foi possível carregar as presenças."));
    } finally {
      setLoading(false);
    }
  }, [onConfirmationChange, sessionId]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedQuery) return attendance?.players ?? [];
    return (attendance?.players ?? []).filter((player) =>
      player.playerName.toLocaleLowerCase("pt-BR").includes(normalizedQuery)
    );
  }, [attendance?.players, query]);

  const openConfirmation = () => {
    if (!attendance) return;
    const initialPlayers = attendance.confirmed
      ? attendance.players.filter((player) => player.attended)
      : attendance.players.filter((player) => player.suggestedByGeneration);
    setSelectedPlayerIds(initialPlayers.map((player) => player.playerId));
    setQuery("");
    setModalOpen(true);
  };

  const togglePlayer = (playerId: string, checked: boolean) => {
    setSelectedPlayerIds((current) =>
      checked
        ? Array.from(new Set([...current, playerId]))
        : current.filter((id) => id !== playerId)
    );
  };

  const saveAttendance = async () => {
    if (selectedPlayerIds.length === 0) {
      message.warning("Selecione ao menos um jogador presente.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await http.put<SessionAttendance>(
        `/management/attendance/sessions/${sessionId}`,
        { playerIds: selectedPlayerIds }
      );
      setAttendance(data);
      onConfirmationChange?.(data.confirmed);
      setModalOpen(false);
      message.success("Presenças confirmadas e incluídas no relatório.");
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Não foi possível salvar as presenças."));
    } finally {
      setSaving(false);
    }
  };

  const removeAttendance = async () => {
    setRemoving(true);
    try {
      await http.delete(`/management/attendance/sessions/${sessionId}`);
      await loadAttendance();
      onConfirmationChange?.(false);
      message.success("A sessão foi retirada do relatório de frequência.");
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Não foi possível desconsiderar a sessão."));
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ marginBottom: 20, textAlign: "center" }}>
        <Spin size="small" />
      </Card>
    );
  }

  if (!attendance) return null;

  const attendedCount = attendance.players.filter((player) => player.attended).length;

  return (
    <>
      <Card
        title={
          <Space>
            <TeamOutlined />
            Controle de presença
          </Space>
        }
        extra={
          attendance.confirmed ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Confirmada
            </Tag>
          ) : (
            <Tag color="warning">Pendente</Tag>
          )
        }
        style={{ marginBottom: 20, background: "var(--surface-2)" }}
      >
        <Alert
          type={attendance.confirmed ? "success" : "warning"}
          showIcon
          message={
            attendance.confirmed
              ? `${attendedCount} jogador${attendedCount === 1 ? "" : "es"} confirmado${attendedCount === 1 ? "" : "s"}`
              : "Esta sessão ainda não entra no relatório de frequência"
          }
          description={
            attendance.confirmed
              ? `Última revisão: ${formatDateTime(attendance.updatedAt ?? attendance.confirmedAt)}`
              : readOnly
                ? "A sessão será liberada quando um administrador confirmar os jogadores presentes."
                : "Confirme quem está presente antes de iniciar a sessão. Os jogadores do sorteio são apenas uma sugestão inicial."
          }
        />

        {!readOnly && (
          <Space wrap style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={attendance.confirmed ? <EditOutlined /> : <CheckCircleOutlined />}
              onClick={openConfirmation}
            >
              {attendance.confirmed ? "Revisar presenças" : "Confirmar presenças"}
            </Button>

            {attendance.confirmed && (
              <Popconfirm
                title="Desconsiderar esta sessão?"
                description="Ela deixará de contar no relatório, mas os placares não serão apagados."
                okText="Desconsiderar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                onConfirm={() => void removeAttendance()}
              >
                <Button danger icon={<DeleteOutlined />} loading={removing}>
                  Retirar do relatório
                </Button>
              </Popconfirm>
            )}
          </Space>
        )}
      </Card>

      <Modal
        title="Confirmar jogadores presentes"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void saveAttendance()}
        okText="Salvar presenças"
        cancelText="Cancelar"
        confirmLoading={saving}
        width={680}
      >
        <Alert
          type="info"
          showIcon
          message="Confirme antes de iniciar a sessão"
          description="Desmarque quem não compareceu e marque qualquer jogador presente, mesmo que não estivesse na geração original."
          style={{ marginBottom: 16 }}
        />

        <Input.Search
          allowClear
          placeholder="Buscar jogador"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ marginBottom: 12 }}
        />

        <Text type="secondary">
          {selectedPlayerIds.length} jogador{selectedPlayerIds.length === 1 ? "" : "es"} selecionado{selectedPlayerIds.length === 1 ? "" : "s"}
        </Text>

        <div
          style={{
            maxHeight: 360,
            overflowY: "auto",
            marginTop: 12,
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          {filteredPlayers.map((player) => (
            <div
              key={player.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 12px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Checkbox
                checked={selectedPlayerIds.includes(player.playerId)}
                onChange={(event) =>
                  togglePlayer(player.playerId, event.target.checked)
                }
              >
                {player.playerName}
              </Checkbox>

              <Space size={4} wrap>
                {player.suggestedByGeneration && <Tag color="blue">No sorteio</Tag>}
                {!player.active && <Tag>Inativo</Tag>}
              </Space>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
