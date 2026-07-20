import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Radio, InputNumber, message, Card, Row, Col } from 'antd';
import { http } from '../api/http';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CreateChampionshipPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(sessionIdFromUrl || '');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    http.get('/team-generation/sessions').then(res => setSessions(res.data));
  }, []);

  const onFinish = async (values: any) => {
    const payload = {
      name: values.name,
      generationSessionId: selectedSession,
      format: values.format,
      groupsCount: values.groupsCount,
      qualifiedPerGroup: values.qualifiedPerGroup,
      matchesType: values.matchesType,
    };
    try {
      const response = await http.post('/championships', payload);
      navigate(`/championships/${response.data.id}`);
    } catch (err) {
      message.error('Erro ao criar campeonato');
    }
  };

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={<span style={{ fontSize: 'clamp(18px, 3vw, 24px)', color: 'var(--primary)', fontWeight: 'bold' }}>🏆 Criar Campeonato</span>}
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid #333', borderRadius: 8 }}
        styles={{ body: { padding: 'clamp(16px, 3vw, 24px)' } }}
      >
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            format: 'GROUPS',
            groupsCount: 2,
            qualifiedPerGroup: 2,
            matchesType: 'SINGLE',
          }}
        >
          <Row gutter={[16, 8]}>
            <Col xs={24}>
              <Form.Item
                name="name"
                label="Nome do Campeonato"
                rules={[{ required: true, message: 'Informe o nome do campeonato' }]}
              >
                <Input placeholder="Ex: Copa Primavera 2026" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Sessão de Times" required>
              <Select
                value={selectedSession}
                onChange={setSelectedSession}
                placeholder="Selecione uma sessão"
                style={{ width: '100%' }}
                styles={{ placeholder: { color: '#ffffff80' } }}
                options={sessions.map((s: any) => ({
                  value: s.sessionId,
                  label: new Date(s.createdAt).toLocaleDateString(),
                }))}
              />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="format"
                label="Formato"
                rules={[{ required: true }]}
              >
                <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Radio value="GROUPS">Fase de Grupos + Eliminatórias</Radio>
                  <Radio value="KNOCKOUT">Eliminatórias Diretas</Radio>
                  <Radio value="LEAGUE">Pontos Corridos</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={12} sm={12} md={8}>
              <Form.Item name="groupsCount" label="Nº de Grupos">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={12} sm={12} md={8}>
              <Form.Item name="qualifiedPerGroup" label="Classificados por Grupo">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={8}>
              <Form.Item name="matchesType" label="Tipo de Partidas">
                <Radio.Group>
                  <Radio value="SINGLE">Ida</Radio>
                  <Radio value="HOME_AND_AWAY">Ida e Volta</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  style={{
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    color: 'var(--surface-2)',
                    fontWeight: 'bold',
                    height: 48,
                    fontSize: 'clamp(16px, 2vw, 18px)',
                  }}
                >
                  Criar Campeonato
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default CreateChampionshipPage;