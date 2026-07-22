import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  IdcardOutlined,
  PlusOutlined,
  SwapOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { http } from '../../api/http';

const { Text } = Typography;

type MatchPlayer = {
  playerId: string;
  playerName: string;
  teamIndex: number;
  rosterRole?: 'STARTER' | 'RESERVE' | null;
  suspended: boolean;
  suspensionMatchesRemaining?: number | null;
};

type Referee = { id: string; name: string };
type Official = { role: string; refereeId: string; refereeName: string };
type MatchCard = {
  id: string;
  playerId: string;
  playerName: string;
  teamIndex: number;
  cardType: string;
  minute?: number | null;
  reason?: string | null;
};
type Substitution = {
  id: string;
  teamIndex: number;
  playerOutId: string;
  playerOutName: string;
  playerInId: string;
  playerInName: string;
  minute?: number | null;
};

type ManagementData = {
  startersPerTeam: number;
  yellowCardsForSuspension: number;
  redCardSuspensionMatches: number;
  players: MatchPlayer[];
  officials: Official[];
  cards: MatchCard[];
  substitutions: Substitution[];
};

interface Props {
  visible: boolean;
  onClose: () => void;
  initialTab?: ManagementTab;
  championshipId: string;
  matchId: string;
  homeTeamIndex: number;
  awayTeamIndex: number;
  homeTeamName: string;
  awayTeamName: string;
}

type ManagementTab = 'lineup' | 'officials' | 'cards' | 'substitutions';

const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data !== 'object' || data === null) return fallback;
  if ('error' in data && typeof data.error === 'string') return data.error;
  return fallback;
};

export function FootballMatchManagementModal({
  visible,
  onClose,
  initialTab = 'lineup',
  championshipId,
  matchId,
  homeTeamIndex,
  awayTeamIndex,
  homeTeamName,
  awayTeamName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ManagementData | null>(null);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [activeTab, setActiveTab] = useState<ManagementTab>(initialTab);

  const [homeStarters, setHomeStarters] = useState<string[]>([]);
  const [homeReserves, setHomeReserves] = useState<string[]>([]);
  const [awayStarters, setAwayStarters] = useState<string[]>([]);
  const [awayReserves, setAwayReserves] = useState<string[]>([]);

  const [mainRefereeId, setMainRefereeId] = useState<string>();
  const [assistantOneId, setAssistantOneId] = useState<string>();
  const [assistantTwoId, setAssistantTwoId] = useState<string>();
  const [newRefereeName, setNewRefereeName] = useState('');

  const [cardPlayerId, setCardPlayerId] = useState<string>();
  const [cardType, setCardType] = useState('YELLOW');
  const [cardMinute, setCardMinute] = useState<number>();
  const [cardReason, setCardReason] = useState('');

  const [substitutionTeam, setSubstitutionTeam] = useState(homeTeamIndex);
  const [playerOutId, setPlayerOutId] = useState<string>();
  const [playerInId, setPlayerInId] = useState<string>();
  const [substitutionMinute, setSubstitutionMinute] = useState<number>();

  const hydrate = useCallback((management: ManagementData) => {
    setData(management);
    setHomeStarters(management.players.filter(
      (player) => player.teamIndex === homeTeamIndex && player.rosterRole === 'STARTER'
    ).map((player) => player.playerId));
    setHomeReserves(management.players.filter(
      (player) => player.teamIndex === homeTeamIndex && player.rosterRole === 'RESERVE'
    ).map((player) => player.playerId));
    setAwayStarters(management.players.filter(
      (player) => player.teamIndex === awayTeamIndex && player.rosterRole === 'STARTER'
    ).map((player) => player.playerId));
    setAwayReserves(management.players.filter(
      (player) => player.teamIndex === awayTeamIndex && player.rosterRole === 'RESERVE'
    ).map((player) => player.playerId));
    setMainRefereeId(management.officials.find((item) => item.role === 'MAIN')?.refereeId);
    setAssistantOneId(management.officials.find((item) => item.role === 'ASSISTANT_1')?.refereeId);
    setAssistantTwoId(management.officials.find((item) => item.role === 'ASSISTANT_2')?.refereeId);
  }, [awayTeamIndex, homeTeamIndex]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [managementResponse, refereesResponse] = await Promise.all([
        http.get<ManagementData>(
          `/championships/${championshipId}/matches/${matchId}/football-management`
        ),
        http.get<Referee[]>('/football/referees'),
      ]);
      hydrate(managementResponse.data);
      setReferees(refereesResponse.data);
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao carregar gestão da partida'));
    } finally {
      setLoading(false);
    }
  }, [championshipId, hydrate, matchId]);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      void load();
    }
  }, [initialTab, load, visible]);

  const playersByTeam = (teamIndex: number) =>
    data?.players.filter((player) => player.teamIndex === teamIndex) ?? [];

  const playerOptions = (teamIndex: number, excluded: string[] = []) =>
    playersByTeam(teamIndex).map((player) => ({
      value: player.playerId,
      label: player.suspended
        ? `${player.playerName} · suspenso (${player.suspensionMatchesRemaining})`
        : player.playerName,
      disabled: player.suspended || excluded.includes(player.playerId),
    }));

  const rosterPlayers = useMemo(
    () => data?.players.filter((player) => Boolean(player.rosterRole)) ?? [],
    [data]
  );

  const onFieldPlayerIds = useMemo(() => {
    const ids = new Set(
      data?.players
        .filter((player) => player.teamIndex === substitutionTeam && player.rosterRole === 'STARTER')
        .map((player) => player.playerId) ?? []
    );
    data?.substitutions
      .filter((substitution) => substitution.teamIndex === substitutionTeam)
      .forEach((substitution) => {
        ids.delete(substitution.playerOutId);
        ids.add(substitution.playerInId);
      });
    data?.cards
      .filter((card) =>
        card.teamIndex === substitutionTeam
        && ['SECOND_YELLOW', 'DIRECT_RED'].includes(card.cardType)
      )
      .forEach((card) => ids.delete(card.playerId));
    return ids;
  }, [data, substitutionTeam]);

  const enteredReserveIds = useMemo(
    () => new Set(
      data?.substitutions
        .filter((substitution) => substitution.teamIndex === substitutionTeam)
        .map((substitution) => substitution.playerInId) ?? []
    ),
    [data, substitutionTeam]
  );

  const refereeOptions = (excludedIds: Array<string | undefined>) => referees.map(
    (referee) => ({
      value: referee.id,
      label: referee.name,
      disabled: excludedIds.includes(referee.id),
    })
  );

  const saveLineup = async () => {
    setSaving(true);
    try {
      await http.put(`/championships/${championshipId}/matches/${matchId}/lineup`, {
        home: { teamIndex: homeTeamIndex, starters: homeStarters, reserves: homeReserves },
        away: { teamIndex: awayTeamIndex, starters: awayStarters, reserves: awayReserves },
      });
      message.success('Escalação salva');
      await load();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao salvar escalação'));
    } finally {
      setSaving(false);
    }
  };

  const saveOfficials = async () => {
    if (!mainRefereeId) {
      message.warning('Selecione o árbitro principal');
      return;
    }
    setSaving(true);
    try {
      await http.put(`/championships/${championshipId}/matches/${matchId}/officials`, {
        mainRefereeId,
        assistantOneId,
        assistantTwoId,
      });
      message.success('Equipe de arbitragem salva');
      await load();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao salvar arbitragem'));
    } finally {
      setSaving(false);
    }
  };

  const createReferee = async () => {
    if (!newRefereeName.trim()) return;
    try {
      const response = await http.post<Referee>('/football/referees', {
        name: newRefereeName.trim(),
      });
      setReferees((current) => [...current, response.data].sort(
        (first, second) => first.name.localeCompare(second.name)
      ));
      setMainRefereeId((current) => current ?? response.data.id);
      setNewRefereeName('');
      message.success('Árbitro cadastrado');
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao cadastrar árbitro'));
    }
  };

  const registerCard = async () => {
    const player = rosterPlayers.find((item) => item.playerId === cardPlayerId);
    if (!player) {
      message.warning('Selecione um jogador escalado');
      return;
    }
    setSaving(true);
    try {
      await http.post(`/championships/${championshipId}/matches/${matchId}/cards`, {
        teamIndex: player.teamIndex,
        playerId: player.playerId,
        cardType,
        minute: cardMinute,
        reason: cardReason,
      });
      setCardPlayerId(undefined);
      setCardMinute(undefined);
      setCardReason('');
      message.success('Cartão registrado');
      await load();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao registrar cartão'));
    } finally {
      setSaving(false);
    }
  };

  const registerSubstitution = async () => {
    if (!playerOutId || !playerInId) {
      message.warning('Selecione os jogadores de saída e entrada');
      return;
    }
    setSaving(true);
    try {
      await http.post(`/championships/${championshipId}/matches/${matchId}/substitutions`, {
        teamIndex: substitutionTeam,
        playerOutId,
        playerInId,
        minute: substitutionMinute,
      });
      setPlayerOutId(undefined);
      setPlayerInId(undefined);
      setSubstitutionMinute(undefined);
      message.success('Substituição registrada');
      await load();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Erro ao registrar substituição'));
    } finally {
      setSaving(false);
    }
  };

  const renderTeamLineup = (
    teamIndex: number,
    teamName: string,
    starters: string[],
    setStarters: (ids: string[]) => void,
    reserves: string[],
    setReserves: (ids: string[]) => void,
  ) => (
    <Card title={teamName} size="small">
      <Form layout="vertical">
        <Form.Item label={`Titulares (${starters.length}/${data?.startersPerTeam ?? 0})`}>
          <Select
            mode="multiple"
            value={starters}
            maxCount={data?.startersPerTeam}
            onChange={setStarters}
            options={playerOptions(teamIndex, reserves)}
            placeholder="Selecione os titulares"
          />
        </Form.Item>
        <Form.Item label={`Reservas (${reserves.length})`}>
          <Select
            mode="multiple"
            value={reserves}
            onChange={setReserves}
            options={playerOptions(teamIndex, starters)}
            placeholder="Selecione os reservas"
          />
        </Form.Item>
      </Form>
    </Card>
  );

  const lineupTab = (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Alert
        showIcon
        type="info"
        message={`${data?.startersPerTeam ?? 0} titulares por time`}
        description="Todos os jogadores disponíveis devem ser classificados como titulares ou reservas. Suspensos ficam fora da relação."
      />
      {renderTeamLineup(homeTeamIndex, homeTeamName, homeStarters, setHomeStarters, homeReserves, setHomeReserves)}
      {renderTeamLineup(awayTeamIndex, awayTeamName, awayStarters, setAwayStarters, awayReserves, setAwayReserves)}
      <Button type="primary" block icon={<TeamOutlined />} loading={saving} onClick={saveLineup}>
        Salvar escalação
      </Button>
    </Space>
  );

  const officialsTab = (
    <Form layout="vertical">
      <Form.Item label="Cadastrar novo árbitro">
        <Space.Compact style={{ width: '100%' }}>
          <Input value={newRefereeName} onChange={(event) => setNewRefereeName(event.target.value)} />
          <Button icon={<PlusOutlined />} onClick={createReferee}>Cadastrar</Button>
        </Space.Compact>
      </Form.Item>
      <Form.Item label="Árbitro principal" required>
        <Select
          value={mainRefereeId}
          onChange={setMainRefereeId}
          options={refereeOptions([assistantOneId, assistantTwoId])}
        />
      </Form.Item>
      <Form.Item label="Bandeirinha 1 (opcional)">
        <Select
          allowClear
          value={assistantOneId}
          onChange={setAssistantOneId}
          options={refereeOptions([mainRefereeId, assistantTwoId])}
        />
      </Form.Item>
      <Form.Item label="Bandeirinha 2 (opcional)">
        <Select
          allowClear
          value={assistantTwoId}
          onChange={setAssistantTwoId}
          options={refereeOptions([mainRefereeId, assistantOneId])}
        />
      </Form.Item>
      <Button type="primary" block icon={<IdcardOutlined />} loading={saving} onClick={saveOfficials}>
        Salvar arbitragem
      </Button>
    </Form>
  );

  const cardsTab = (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Alert
        showIcon
        type="warning"
        message={`Suspensão a cada ${data?.yellowCardsForSuspension ?? 3} amarelos`}
        description={`Vermelho direto: ${data?.redCardSuspensionMatches ?? 1} partida(s). Segundo amarelo: 1 partida.`}
      />
      <Form layout="vertical">
        <Form.Item label="Jogador" required>
          <Select
            showSearch
            optionFilterProp="label"
            value={cardPlayerId}
            onChange={setCardPlayerId}
            options={rosterPlayers.map((player) => ({
              value: player.playerId,
              label: `${player.playerName} · ${player.teamIndex === homeTeamIndex ? homeTeamName : awayTeamName}`,
            }))}
          />
        </Form.Item>
        <Form.Item label="Cartão" required>
          <Select value={cardType} onChange={setCardType} options={[
            { value: 'YELLOW', label: 'Amarelo' },
            { value: 'SECOND_YELLOW', label: 'Segundo amarelo / expulsão' },
            { value: 'DIRECT_RED', label: 'Vermelho direto' },
          ]} />
        </Form.Item>
        <Form.Item label="Minuto">
          <InputNumber min={0} value={cardMinute} onChange={(value) => setCardMinute(value ?? undefined)} />
        </Form.Item>
        <Form.Item label="Motivo">
          <Input.TextArea value={cardReason} onChange={(event) => setCardReason(event.target.value)} />
        </Form.Item>
        <Button type="primary" danger block icon={<WarningOutlined />} loading={saving} onClick={registerCard}>
          Registrar cartão
        </Button>
      </Form>
      <List
        bordered
        dataSource={data?.cards ?? []}
        locale={{ emptyText: 'Nenhum cartão registrado' }}
        renderItem={(card) => (
          <List.Item>
            <Space wrap>
              <Tag color={card.cardType === 'YELLOW' ? 'gold' : 'red'}>{card.cardType}</Tag>
              <Text>{card.playerName}</Text>
              {card.minute != null && <Text type="secondary">{card.minute}'</Text>}
              {card.reason && <Text type="secondary">{card.reason}</Text>}
            </Space>
          </List.Item>
        )}
      />
    </Space>
  );

  const substitutionsTab = (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Form layout="vertical">
        <Form.Item label="Time" required>
          <Select value={substitutionTeam} onChange={(value) => {
            setSubstitutionTeam(value);
            setPlayerOutId(undefined);
            setPlayerInId(undefined);
          }} options={[
            { value: homeTeamIndex, label: homeTeamName },
            { value: awayTeamIndex, label: awayTeamName },
          ]} />
        </Form.Item>
        <Form.Item label="Jogador que sai" required>
          <Select value={playerOutId} onChange={setPlayerOutId} options={playersByTeam(substitutionTeam)
            .filter((player) => onFieldPlayerIds.has(player.playerId))
            .map((player) => ({ value: player.playerId, label: player.playerName }))} />
        </Form.Item>
        <Form.Item label="Reserva que entra" required>
          <Select value={playerInId} onChange={setPlayerInId} options={playersByTeam(substitutionTeam)
            .filter((player) => player.rosterRole === 'RESERVE' && !enteredReserveIds.has(player.playerId))
            .map((player) => ({ value: player.playerId, label: player.playerName }))} />
        </Form.Item>
        <Form.Item label="Minuto">
          <InputNumber min={0} value={substitutionMinute} onChange={(value) => setSubstitutionMinute(value ?? undefined)} />
        </Form.Item>
        <Button type="primary" block icon={<SwapOutlined />} loading={saving} onClick={registerSubstitution}>
          Registrar substituição
        </Button>
      </Form>
      <List
        bordered
        dataSource={data?.substitutions ?? []}
        locale={{ emptyText: 'Nenhuma substituição registrada' }}
        renderItem={(substitution) => (
          <List.Item>
            <Text>
              {substitution.playerOutName} → {substitution.playerInName}
              {substitution.minute != null ? ` · ${substitution.minute}'` : ''}
            </Text>
          </List.Item>
        )}
      />
    </Space>
  );

  return (
    <Modal
      title="Gestão da Partida"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="min(96vw, 820px)"
      loading={loading}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ManagementTab)}
        items={[
        { key: 'lineup', label: 'Escalação', children: lineupTab },
        { key: 'officials', label: 'Arbitragem', children: officialsTab },
        { key: 'cards', label: 'Cartões', children: cardsTab },
        { key: 'substitutions', label: 'Substituições', children: substitutionsTab },
        ]}
      />
    </Modal>
  );
}
