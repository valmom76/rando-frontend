import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Radio, InputNumber, Button, message, Card, Spin, List, Row, Col } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { http } from '../../api/http';
import { useChampionships } from '../../hooks/useChampionships';

interface TeamInfo {
  teamIndex: number;
  sumScore: number;
  players: Array<{ playerId: string; name: string; sex: string; score: number }>;
}

export const ChampionshipCreate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState(sessionIdFromUrl || '');
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamNames, setTeamNames] = useState<Record<number, string>>({});
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { createChampionship, isCreating } = useChampionships();

  const selectedFormat = Form.useWatch('format', form);

  useEffect(() => {
    http.get('/team-generation/sessions').then(res => setSessions(res.data));
  }, []);

  useEffect(() => {
    if (!selectedSession) {
      setTeams([]);
      setTeamNames({});
      return;
    }
    setLoadingTeams(true);
    http.get<TeamInfo[]>(`/teams/session/${selectedSession}`)
      .then(res => {
        setTeams(res.data);
        const defaultNames: Record<number, string> = {};
        res.data.forEach(t => { defaultNames[t.teamIndex] = ''; });
        setTeamNames(defaultNames);
      })
      .catch(() => message.error('Erro ao carregar times da sessão'))
      .finally(() => setLoadingTeams(false));
  }, [selectedSession]);

  const updateTeamName = (teamIndex: number, name: string) => {
    setTeamNames(prev => ({ ...prev, [teamIndex]: name }));
  };

  const onFinish = async (values: any) => {
    if (!selectedSession) {
      message.error('Selecione uma sessão de times');
      return;
    }
    const nonEmptyNames = Object.entries(teamNames)
      .filter(([_, name]) => name.trim() !== '')
      .reduce((acc, [idx, name]) => ({ ...acc, [idx]: name }), {});

    const payload = {
      name: values.name,
      generationSessionId: selectedSession,
      format: values.format,
      groupsCount: values.format !== 'KNOCKOUT' ? values.groupsCount : 0,
      qualifiedPerGroup: values.format !== 'KNOCKOUT' ? values.qualifiedPerGroup : 0,
      matchesType: values.matchesType,
      teamNames: nonEmptyNames,
      setsToWin: values.setsToWin,
      pointsPerSet: values.pointsPerSet,
      tieBreakPoints: values.tieBreakPoints,
    };
    try {
      const result = await createChampionship(payload);
      navigate(`/championships/${result.id}`);
    } catch (err) {
      message.error('Erro ao criar campeonato');
    }
  };

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: 900, margin: '0 auto' }}>
      <Card
        title={<span style={{ fontSize: 'clamp(18px, 3vw, 24px)', color: 'var(--primary)', fontWeight: 'bold' }}>🏆 Criar Campeonato</span>}
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid #333', borderRadius: 8 }}
        styles={{ body: { padding: 'clamp(16px, 3vw, 24px)' } }}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Row gutter={[16, 8]}>
            <Col xs={24}>
              <Form.Item name="name" label="Nome do Campeonato" rules={[{ required: true, message: 'Informe o nome' }]}>
                <Input placeholder="Ex.: Copa BoraVer 2025" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Sessão de Times" required>
                <Select
                  value={selectedSession}
                  onChange={setSelectedSession}
                  placeholder="Selecione a sessão"
                  style={{ width: '100%' }}
                  styles={{ placeholder: { color: '#ffffff80' } }}
                  options={sessions.map(s => ({
                    value: s.sessionId,
                    label: `${new Date(s.createdAt).toLocaleDateString()} - ${s.sessionId}`,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="format" label="Formato" initialValue="GROUPS" rules={[{ required: true }]}>
                <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Radio value="GROUPS">Fase de Grupos + Eliminatórias</Radio>
                  <Radio value="KNOCKOUT">Eliminatórias Diretas</Radio>
                  <Radio value="LEAGUE">Pontos Corridos</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            {selectedFormat !== 'KNOCKOUT' && (
              <>
                <Col xs={12} sm={12} md={8}>
                  <Form.Item name="groupsCount" label="Nº de Grupos" initialValue={2} rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={12} md={8}>
                  <Form.Item name="qualifiedPerGroup" label="Classificados por Grupo" initialValue={2} rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col xs={24} sm={12}>
              <Form.Item name="matchesType" label="Tipo de Partidas" initialValue="SINGLE" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value="SINGLE">Ida</Radio>
                  <Radio value="HOME_AND_AWAY">Ida e Volta</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Card
                title="Configuração de Sets"
                size="small"
                style={{ backgroundColor: '#262626', borderColor: '#333', marginBottom: 0 }}
                styles={{ body: { padding: 'clamp(12px, 2vw, 16px)' } }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="setsToWin" label="Sets para vencer" initialValue={2} rules={[{ required: true }]}>
                      <Select
                        style={{ width: '100%' }}
                        styles={{ placeholder: { color: '#ffffff80' } }}
                        options={[
                          { value: 1, label: 'Melhor de 1 set' },
                          { value: 2, label: 'Melhor de 3 sets' },
                          { value: 3, label: 'Melhor de 5 sets' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Form.Item name="pointsPerSet" label="Pontos por set" initialValue={25} rules={[{ required: true }]}>
                      <InputNumber min={10} max={30} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Form.Item name="tieBreakPoints" label="Tie-break" initialValue={15} rules={[{ required: true }]}>
                      <InputNumber min={10} max={25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            {selectedSession && (
              <Col xs={24}>
                <Card
                  title="Times da Sessão"
                  size="small"
                  style={{ backgroundColor: '#262626', borderColor: '#333' }}
                  styles={{ body: { padding: 'clamp(12px, 2vw, 16px)' } }}
                >
                  {loadingTeams ? (
                    <Spin />
                  ) : (
                    <List
                      size="small"
                      dataSource={teams}
                      renderItem={team => (
                        <List.Item style={{ padding: '8px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, color: '#ccc', whiteSpace: 'nowrap' }}>Time {team.teamIndex}:</span>
                            <Input
                              placeholder={`Time ${team.teamIndex}`}
                              value={teamNames[team.teamIndex]}
                              onChange={e => updateTeamName(team.teamIndex, e.target.value)}
                              style={{ flex: 1, minWidth: 150 }}
                            />
                          </div>
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>
            )}

            <Col xs={24}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating}
                block
                size="large"
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
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};