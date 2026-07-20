import { Button, Card, Col, Form, Input, Row, Space, Table, message, Modal, Tag, Switch } from "antd";
import { useEffect, useState } from "react";
import { http } from "../api/http";
import AppButton from "../components/AppButton";
import { CloseOutlined } from "@ant-design/icons";

export interface Position {
  id: string;
  name: string;
  active: boolean;
}

export default function PositionsPage() {
  const [items, setItems] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form] = Form.useForm();

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<Position[]>("/positions");
      setItems(data);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Erro ao carregar posições");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async (values: { name: string }) => {
    try {
      await http.post("/positions", values);
      message.success("Posição criada");
      refresh();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Erro ao criar posição");
    }
  };

  const openEdit = (pos: Position) => {
    setEditing(pos);
    form.setFieldsValue({ name: pos.name, active: pos.active });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const values = await form.validateFields();
      await http.put(`/positions/${editing.id}`, values);
      message.success("Posição atualizada");
      setEditModalOpen(false);
      refresh();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Erro ao atualizar");
    }
  };


  const columns = [
    { title: "Nome", dataIndex: "name", key: "name", width: "50%", ellipsis: true },
    {
      title: "Ativa",
      dataIndex: "active",
      key: "active",
      width: "20%",
      align: "center" as const,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? "Sim" : "Não"}</Tag>
      ),
    },
    {
      title: "Ações",
      key: "actions",
      width: "30%",
      align: "center" as const,
      render: (_: any, record: Position) => (
        <Space size={[4, 4]} wrap>
          <AppButton tone="save" onClick={() => openEdit(record)} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            Editar
          </AppButton>
        </Space>
      ),
    },
  ];

  const cardBodyStyle = { padding: 'clamp(12px, 3vw, 24px)' };

  return (
    <div style={{ padding: 'clamp(8px, 2vw, 24px)', maxWidth: 800, margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <Card
          title={<span style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', color: 'var(--primary)' }}>Nova Posição</span>}
          styles={{ body: cardBodyStyle, header: { borderBottom: '1px solid #333' } }}
          style={{ backgroundColor: 'var(--surface-2)', borderColor: '#333' }}
        >
          <Form layout="vertical" onFinish={handleCreate}>
            <Row gutter={[12, 8]} align="bottom">
              <Col xs={24} sm={18} md={20}>
                <Form.Item name="name" rules={[{ required: true, message: "Informe o nome da posição" }]} label="Nome" style={{ marginBottom: 0 }}>
                  <Input placeholder="Ex: Levantador, Central..." />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6} md={4}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <AppButton tone="generate" htmlType="submit" style={{ width: "100%" }}>
                    Adicionar
                  </AppButton>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          title={<span style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', color: 'var(--primary)' }}>Posições</span>}
          styles={{ body: cardBodyStyle, header: { borderBottom: '1px solid #333' } }}
          style={{ backgroundColor: 'var(--surface-2)', borderColor: '#333' }}
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            columns={columns}
            scroll={{ x: 'max-content' }}
            pagination={{ responsive: true, pageSize: 10, showSizeChanger: false }}
            style={{ backgroundColor: 'var(--surface-2)' }}
            rowClassName={() => 'dark-row'}
          />
        </Card>

        <Modal
          title="Editar Posição"
          open={editModalOpen}
          width="min(90vw, 400px)"
          closeIcon={<CloseOutlined style={{ color: 'var(--primary)' }} />}
          styles={{ 
            container: { backgroundColor: 'var(--surface-2)' },
            header: { backgroundColor: 'var(--surface-2)', color: 'var(--primary)' }
          }}
          footer={[
            <Button 
              key="cancel" 
              onClick={() => setEditModalOpen(false)}
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
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="active" label="Ativa" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  );
};
