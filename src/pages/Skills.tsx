import { Button, Card, Col, Form, Input, Row, Space, Table, message, Modal, Tag, Switch } from "antd";
import { useEffect, useState } from "react";
import { createSkill, listSkills, updateSkill } from "../api/skills";
import type { Skill } from "../api/skills";
import AppButton from "../components/AppButton";
import { CloseOutlined } from "@ant-design/icons";

export default function Skills() {
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [form] = Form.useForm();

  async function refresh() {
    setLoading(true);
    try {
      setItems(await listSkills());
    } catch (e: any) {
      message.error(e?.response?.data?.error ?? "Erro ao listar skills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(values: any) {
    try {
      await createSkill(values);
      message.success("Skill criada");
      await refresh();
    } catch (e: any) {
      message.error(e?.response?.data?.error ?? "Erro ao criar skill");
    }
  }

  const openEdit = (skill: Skill) => {
    setEditing(skill);
    form.setFieldsValue({ name: skill.name, active: skill.active });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const values = await form.validateFields();
      await updateSkill(editing.id, values);
      message.success("Skill atualizada");
      setEditModalOpen(false);
      refresh();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Erro ao atualizar");
    }
  };


  const columns = [
    { title: "Nome", dataIndex: "name", width: "50%", ellipsis: true },
    {
      title: "Ativa",
      dataIndex: "active",
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
      render: (_: any, record: Skill) => (
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
      <Space orientation="vertical" style={{ width: "100%" }} size={16}>
        <Card
          title={<span style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', color: 'var(--primary)' }}>Nova Skill</span>}
          styles={{ body: cardBodyStyle, header: { borderBottom: '1px solid #333' } }}
          style={{ backgroundColor: 'var(--surface-2)', borderColor: '#333' }}
        >
          <Form layout="vertical" onFinish={onCreate}>
            <Row gutter={[12, 8]} align="bottom">
              <Col xs={24} sm={18} md={20}>
                <Form.Item name="name" rules={[{ required: true, message: "Informe o nome da skill" }]} label="Nome" style={{ marginBottom: 0 }}>
                  <Input placeholder="Ex: Saque, Ataque, Defesa..." />
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
          title={<span style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', color: 'var(--primary)' }}>Skills</span>}
          styles={{ body: cardBodyStyle, header: { borderBottom: '1px solid #333' } }}
          style={{ backgroundColor: 'var(--surface-2)', borderColor: '#333' }}
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            columns={columns as any}
            scroll={{ x: 'max-content' }}
            pagination={{ responsive: true, pageSize: 10, showSizeChanger: false }}
            style={{ backgroundColor: 'var(--surface-2)' }}
            rowClassName={() => 'dark-row'}
          />
        </Card>

        <Modal
          title="Editar Skill"
          open={editModalOpen}
          onCancel={() => setEditModalOpen(false)}
          width="min(90vw, 400px)"
          closeIcon={<CloseOutlined style={{ color: 'var(--primary)' }} />}
          styles={{ 
            header: { backgroundColor: 'var(--surface-2)', color: 'var(--primary)' },
            container: { backgroundColor: 'var(--surface-2)' }
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
