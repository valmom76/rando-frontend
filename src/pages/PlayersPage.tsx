import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CloseOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import {
  createPlayer,
  deletePlayer,
  listPlayersWithRatings,
  updatePlayer,
} from "../api/players";
import type { Player } from "../api/players";
import { http } from "../api/http";
import AppButton from "../components/AppButton";
import PlayerRatingsModal from "../components/PlayerRatingsModal";

const { Title, Text } = Typography;

const formatPhone = (digits: string) => {
  if (!digits) return "";

  const onlyDigits = digits.replace(/\D/g, "").slice(0, 11);

  if (onlyDigits.length <= 2) {
    return `(${onlyDigits}`;
  }

  if (onlyDigits.length <= 7) {
    return `(${onlyDigits.slice(0, 2)}) ${onlyDigits.slice(2)}`;
  }

  return `(${onlyDigits.slice(0, 2)}) ${onlyDigits.slice(
    2,
    7
  )}-${onlyDigits.slice(7)}`;
};

interface Position {
  id: string;
  name: string;
  active: boolean;
}

interface PlayerPositionPayload {
  positionId: string;
  priority: number;
}

export default function Players() {
  const [messageApi, contextHolder] = message.useMessage();

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [items, setItems] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [ratingsPlayerId, setRatingsPlayerId] = useState<string | null>(null);
  const [ratingsPlayerName, setRatingsPlayerName] = useState<string | undefined>();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [rawPhone, setRawPhone] = useState("");
  const [editRawPhone, setEditRawPhone] = useState("");

  const [positionsList, setPositionsList] = useState<Position[]>([]);
  const [newPlayerPositions, setNewPlayerPositions] = useState<
    PlayerPositionPayload[]
  >([]);
  const [editPlayerPositions, setEditPlayerPositions] = useState<
    PlayerPositionPayload[]
  >([]);

  const positionOptions = useMemo(() => {
    return positionsList.map((position) => ({
      value: position.id,
      label: position.name,
    }));
  }, [positionsList]);

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const { data } = await http.get<Position[]>("/positions");
        setPositionsList(Array.isArray(data) ? data : []);
      } catch {
        messageApi.error("Erro ao carregar posições");
      }
    };

    loadPositions();
  }, [messageApi]);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const list = await listPlayersWithRatings();
      setItems(Array.isArray(list) ? list : []);
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message ?? "Erro ao listar jogadores"
      );
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    setRawPhone(digits);
  };

  const handleEditPhoneChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    setEditRawPhone(digits);
  };

  const handleCreate = async (values: any) => {
    setCreating(true);

    try {
      const birthDate = values.birthDate
        ? (values.birthDate as Dayjs).format("YYYY-MM-DD")
        : undefined;

      await createPlayer({
        name: values.name,
        sex: values.sex,
        email: values.email || undefined,
        phone: rawPhone || undefined,
        birthDate,
        positions: newPlayerPositions,
      });

      messageApi.success("Jogador criado com sucesso.");

      createForm.resetFields();
      setRawPhone("");
      setNewPlayerPositions([]);

      await refresh();
    } catch (error: any) {
      const status = error?.response?.status;
        const errorMessage =
          error?.response?.data?.error ||  
          error?.response?.data?.message ||
          'Erro ao criar jogador';

        if (status === 402) {
          messageApi.warning({
            content: errorMessage,
            duration: 8,
          });
        } else {
          messageApi.error(errorMessage);
        }
    } finally {
      setCreating(false);
    }
  };

  const openRatings = (player: Player) => {
    setRatingsPlayerId(player.id);
    setRatingsPlayerName(player.name);
    setRatingsOpen(true);
  };

  const closeRatings = () => {
    setRatingsOpen(false);
    setRatingsPlayerId(null);
    setRatingsPlayerName(undefined);
  };

  const openEdit = (player: Player) => {
    setEditingPlayer(player);

    editForm.setFieldsValue({
      name: player.name,
      sex: player.sex,
      email: player.email ?? "",
      birthDate: player.birthDate ? dayjs(player.birthDate) : null,
    });

    setEditRawPhone(player.phone?.replace(/\D/g, "") ?? "");

    const existingPositions = (player.positions || []).map((position: any) => ({
      positionId: position.positionId,
      priority: position.priority,
    }));

    setEditPlayerPositions(existingPositions);
    setEditModalOpen(true);
  };

  const closeEdit = () => {
    setEditModalOpen(false);
    setEditingPlayer(null);
    setEditRawPhone("");
    setEditPlayerPositions([]);
    editForm.resetFields();
  };

  const handleUpdate = async () => {
    if (!editingPlayer) return;

    setUpdating(true);

    try {
      const values = await editForm.validateFields();

      const birthDate = values.birthDate
        ? (values.birthDate as Dayjs).format("YYYY-MM-DD")
        : undefined;

      await updatePlayer(editingPlayer.id, {
        name: values.name,
        sex: values.sex,
        email: values.email || undefined,
        phone: editRawPhone || undefined,
        birthDate,
        positions: editPlayerPositions,
      });

      messageApi.success("Jogador atualizado com sucesso.");

      closeEdit();
      await refresh();
    } catch (error: any) {
      if (error?.errorFields) return;

      messageApi.error(
        error?.response?.data?.message ?? "Erro ao atualizar jogador"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlayer(id);

      messageApi.success("Jogador excluído com sucesso.");
      await refresh();
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message ?? "Erro ao excluir jogador"
      );
    }
  };

  const handleCreatePositionChange = (selectedIds: string[]) => {
    const updated = selectedIds.map((id, index) => {
      const existing = newPlayerPositions.find(
        (position) => position.positionId === id
      );

      return {
        positionId: id,
        priority: existing ? existing.priority : index + 1,
      };
    });

    setNewPlayerPositions(updated);
  };

  const handleEditPositionChange = (selectedIds: string[]) => {
    const updated = selectedIds.map((id, index) => {
      const existing = editPlayerPositions.find(
        (position) => position.positionId === id
      );

      return {
        positionId: id,
        priority: existing ? existing.priority : index + 1,
      };
    });

    setEditPlayerPositions(updated);
  };

  const updateCreatePositionPriority = (positionId: string, priority: number) => {
    setNewPlayerPositions((prev) =>
      prev.map((position) =>
        position.positionId === positionId
          ? {
              ...position,
              priority,
            }
          : position
      )
    );
  };

  const updateEditPositionPriority = (positionId: string, priority: number) => {
    setEditPlayerPositions((prev) =>
      prev.map((position) =>
        position.positionId === positionId
          ? {
              ...position,
              priority,
            }
          : position
      )
    );
  };

  const getPositionName = (positionId: string) => {
    return (
      positionsList.find((position) => position.id === positionId)?.name ||
      positionId
    );
  };

  const getAverageClass = (overall?: number | null) => {
    if (overall == null) return "empty";
    if (overall >= 4) return "high";
    if (overall >= 3) return "medium";
    return "low";
  };

  const columns: ColumnsType<Player> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
      width: 180,
      ellipsis: true,
      render: (name: string) => <span className="player-name">{name}</span>,
    },
    {
      title: "Sexo",
      dataIndex: "sex",
      key: "sex",
      width: 80,
      align: "center",
      render: (sex: string) => (
        <span className={`player-sex-tag ${sex === "F" ? "female" : "male"}`}>
          {sex}
        </span>
      ),
    },
    {
      title: "Posição",
      key: "position",
      width: 150,
      align: "center",
      render: (_, player) => {
        const positions = [...((player.positions || []) as any[])];

        if (!positions.length) {
          return <span className="player-position-empty">—</span>;
        }

        const main = positions.sort((a, b) => a.priority - b.priority)[0];

        return <span className="player-position-tag">{main.name}</span>;
      },
    },
    {
      title: "Média",
      key: "avg",
      width: 100,
      align: "center",
      render: (_, player) => (
        <span className={`player-average ${getAverageClass(player.overall)}`}>
          {player.overall == null ? "—" : player.overall.toFixed(1)}
        </span>
      ),
    },
    {
      title: "Ações",
      key: "actions",
      width: 240,
      align: "center",
      render: (_, player) => (
        <div className="players-actions">
          <AppButton
            tone="copy"
            className="players-table-action"
            onClick={() => openRatings(player)}
          >
            Ratings
          </AppButton>

          <AppButton
            tone="save"
            className="players-table-action"
            onClick={() => openEdit(player)}
          >
            Editar
          </AppButton>

          <Popconfirm
            title="Excluir jogador?"
            description="Esta ação é irreversível."
            onConfirm={() => handleDelete(player.id)}
            okText="Sim"
            cancelText="Cancelar"
            okButtonProps={{
              style: {
                backgroundColor: '#ff4d4f',
                borderColor: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: 6,
              },
            }}
            cancelButtonProps={{
              style: {
                backgroundColor: '#333',
                borderColor: '#444',
                color: '#ccc',
                fontWeight: 'bold',
                borderRadius: 6,
              },
            }}
          >
            <AppButton tone="reset" className="players-table-action">
              Excluir
            </AppButton>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <main className="players-page">
      {contextHolder}

      <header className="players-header">
        <Title level={2} className="players-title">
          <UserOutlined />
          Jogadores
        </Title>

        <Text className="players-subtitle">
          Cadastre jogadores, defina posições e acompanhe os ratings do grupo.
        </Text>
      </header>

      <section className="players-stack">
        <Card
          className="players-card"
          title={<span className="players-section-title">Novo Jogador</span>}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreate}
            initialValues={{
              sex: "M",
            }}
            className="players-form"
          >
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="name"
                  label="Nome"
                  rules={[
                    {
                      required: true,
                      message: "Informe o nome",
                    },
                  ]}
                >
                  <Input placeholder="Nome do jogador" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item
                  name="sex"
                  label="Sexo"
                  rules={[
                    {
                      required: true,
                      message: "Informe o sexo",
                    },
                  ]}
                >
                  <Radio.Group buttonStyle="solid" className="players-sex-group">
                    <Radio.Button value="M">M</Radio.Button>
                    <Radio.Button value="F">F</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="email" label="E-mail">
                  <Input type="email" placeholder="email@exemplo.com" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item label="Celular">
                  <Input
                    value={formatPhone(rawPhone)}
                    onChange={handlePhoneChange}
                    placeholder="(99) 99999-9999"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="birthDate" label="Nascimento">
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="dd/mm/aaaa"
                    className="players-full-control"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Posições">
                  <Select
                    mode="multiple"
                    placeholder="Selecione as posições"
                    value={newPlayerPositions.map(
                      (position) => position.positionId
                    )}
                    onChange={handleCreatePositionChange}
                    className="players-full-control"
                    options={positionOptions}
                  />
                </Form.Item>
              </Col>

              {newPlayerPositions
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((position) => (
                  <Col xs={12} sm={8} md={6} lg={4} key={position.positionId}>
                    <Form.Item
                      label={`Prioridade ${getPositionName(
                        position.positionId
                      )}`}
                    >
                      <InputNumber
                        min={1}
                        value={position.priority}
                        onChange={(value) =>
                          updateCreatePositionPriority(
                            position.positionId,
                            value || 1
                          )
                        }
                        className="players-full-control"
                      />
                    </Form.Item>
                  </Col>
                ))}

              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item label=" ">
                  <div className="players-submit">
                    <AppButton
                      tone="generate"
                      htmlType="submit"
                      disabled={creating}
                    >
                      <PlusOutlined />
                      Adicionar
                    </AppButton>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          className="players-card players-table-card"
          title={<span className="players-section-title">Jogadores</span>}
          extra={
            <AppButton
              tone="save"
              onClick={refresh}
              disabled={loading}
              className="players-refresh-btn"
            >
              <ReloadOutlined />
              Recarregar
            </AppButton>
          }
        >
          <Table<Player>
            rowKey="id"
            loading={loading}
            dataSource={items}
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
                <div className="players-empty">
                  Nenhum jogador cadastrado.
                </div>
              ),
            }}
          />
        </Card>
      </section>

      <Modal
        title={<span className="players-modal-title">Editar Jogador</span>}
        open={editModalOpen}
        onCancel={closeEdit}
        width="min(94vw, 560px)"
        className="players-modal"
        closeIcon={<CloseOutlined className="players-modal-close" />}
        styles={{ 
          header: { backgroundColor: 'var(--surface-2)', color: 'var(--primary)' },
          container: { backgroundColor: 'var(--surface-2)' }
        }}        
        footer={[
          <Button 
            key="cancel" 
            onClick={closeEdit}
            style={{ 
              backgroundColor: '#333', 
              borderColor: '#444', 
              color: '#ccc',
              fontWeight: 'bold',
              borderRadius: 6
            }}
          >
            Cancelar
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleUpdate}
            loading={updating}
            style={{ 
              backgroundColor: 'var(--primary)',
              borderColor: 'var(--primary)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: 6
            }}
          >
            Salvar
          </Button>
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: "Informe o nome" }]}
          >
            <Input placeholder="Nome do jogador" />
          </Form.Item>

          <Form.Item
            name="sex"
            label="Sexo"
            rules={[{ required: true, message: "Informe o sexo" }]}
          >
            <Radio.Group>
              <Radio value="M">M</Radio>
              <Radio value="F">F</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="email" label="E-mail">
            <Input type="email" placeholder="email@exemplo.com" />
          </Form.Item>

          <Form.Item label="Celular">
            <Input
              value={formatPhone(editRawPhone)}
              onChange={handleEditPhoneChange}
              placeholder="(99) 99999-9999"
            />
          </Form.Item>

          <Form.Item name="birthDate" label="Nascimento">
            <DatePicker format="DD/MM/YYYY" className="players-full-control" />
          </Form.Item>

          <Form.Item label="Posições">
            <Select
              mode="multiple"
              placeholder="Selecione"
              value={editPlayerPositions.map(p => p.positionId)}
              onChange={handleEditPositionChange}
              className="players-full-control"
              options={positionOptions}
            />
          </Form.Item>

          {!!editPlayerPositions.length && (
            <div className="players-priority-list">
              {editPlayerPositions
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map(position => (
                  <div key={position.positionId} className="players-priority-item">
                    <span className="players-priority-name">
                      Prioridade {getPositionName(position.positionId)}
                    </span>
                    <InputNumber
                      min={1}
                      value={position.priority}
                      onChange={value => updateEditPositionPriority(position.positionId, value || 1)}
                      className="players-full-control"
                    />
                  </div>
                ))}
            </div>
          )}
        </Form>
      </Modal>

      <PlayerRatingsModal
        open={ratingsOpen}
        playerId={ratingsPlayerId}
        playerName={ratingsPlayerName}
        onClose={closeRatings}
        onSaved={async () => {
          if (ratingsPlayerId) {
            await refresh();
          }
        }}
      />
    </main>
  );
}
