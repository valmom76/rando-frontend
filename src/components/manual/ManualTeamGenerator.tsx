import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  List,
  Modal,
  Radio,
  Row,
  Select,
  Tabs,
  Typography,
  message,
} from "antd";
import {
  CloseOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { usePlayers } from "../../hooks/usePlayers";
import { useManualTeams } from "../../hooks/useManualTeams";
import { http } from "../../api/http";
import type { SportType } from "../../auth/store";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type ChampionshipFormat = "GROUPS" | "KNOCKOUT" | "LEAGUE";
type MatchesType = "SINGLE" | "HOME_AND_AWAY";

type TeamsState = {
  [key: number]: string[];
};

type TenantSettingsResponse = {
  sportType: SportType;
};

export const ManualTeamGenerator: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [sportType, setSportType] = useState<SportType | null>(null);
  const [sportLoading, setSportLoading] = useState(true);
  const isFootball = sportType === "FOOTBALL";
  const isVolleyball = sportType === "VOLLEYBALL";

  const { players, loading: playersLoading } = usePlayers();
  const { saveManualTeams, isSaving } = useManualTeams();

  const navigate = useNavigate();

  const [teamCount, setTeamCount] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [teams, setTeams] = useState<TeamsState>({});
  const [teamNames, setTeamNames] = useState<{ [key: number]: string }>({});

  const [modalVisible, setModalVisible] = useState(false);
  const [championshipName, setChampionshipName] = useState("");
  const [championshipFormat, setChampionshipFormat] =
    useState<ChampionshipFormat>("GROUPS");
  const [groupsCount, setGroupsCount] = useState(2);
  const [teamGroups, setTeamGroups] = useState<{ [teamIndex: number]: number }>(
    {}
  );
  const [matchesType, setMatchesType] = useState<MatchesType>("SINGLE");
  const [qualifiedPerGroup, setQualifiedPerGroup] = useState(2);

  const [setsToWin, setSetsToWin] = useState(2);
  const [pointsPerSet, setPointsPerSet] = useState(25);
  const [tieBreakPoints, setTieBreakPoints] = useState(15);
  const [startersPerTeam, setStartersPerTeam] = useState(4);
  const [yellowCardsForSuspension, setYellowCardsForSuspension] = useState(3);
  const [redCardSuspensionMatches, setRedCardSuspensionMatches] = useState(1);

  useEffect(() => {
    let mounted = true;

    http
      .get<TenantSettingsResponse>("/tenant/settings")
      .then(({ data }) => {
        if (mounted) setSportType(data.sportType);
      })
      .catch(() => {
        if (mounted) setSportType(null);
      })
      .finally(() => {
        if (mounted) setSportLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setTeams((prev) => {
      const next: TeamsState = {};

      for (let index = 1; index <= teamCount; index++) {
        next[index] = prev[index] ?? [];
      }

      return next;
    });

    setTeamGroups((prev) => {
      const next: { [key: number]: number } = {};

      for (let index = 1; index <= teamCount; index++) {
        next[index] = prev[index] ?? 1;
      }

      return next;
    });

    setTeamNames((prev) => {
      const next: { [key: number]: string } = {};

      for (let index = 1; index <= teamCount; index++) {
        next[index] = prev[index] ?? "";
      }

      return next;
    });
  }, [teamCount]);

  useEffect(() => {
    setTeams((prev) => {
      const next: TeamsState = {};

      Object.entries(prev).forEach(([index, ids]) => {
        next[Number(index)] = ids.slice(0, playersPerTeam);
      });

      return next;
    });
  }, [playersPerTeam]);

  useEffect(() => {
    setStartersPerTeam((current) => Math.min(current, playersPerTeam));
  }, [playersPerTeam]);

  const selectedPlayerIds = useMemo(() => {
    return new Set(Object.values(teams).flat());
  }, [teams]);

  const availablePlayers = useMemo(() => {
    return players.filter((player) => !selectedPlayerIds.has(player.id));
  }, [players, selectedPlayerIds]);

  const totalSelected = Object.values(teams).flat().length;
  const needed = teamCount * playersPerTeam;
  const isComplete = totalSelected === needed;

  const isGroups = championshipFormat === "GROUPS";
  const isLeague = championshipFormat === "LEAGUE";
  const isPowerOfTwo = teamCount > 1 && (teamCount & (teamCount - 1)) === 0;

  const getTeamName = (teamIndex: number) => {
    return teamNames[teamIndex]?.trim() || `Time ${teamIndex}`;
  };

  const addPlayerToTeam = (teamIndex: number, playerId: string) => {
    if (selectedPlayerIds.has(playerId)) {
      message.warning("Este jogador já foi selecionado");
      return;
    }

    if ((teams[teamIndex] ?? []).length >= playersPerTeam) {
      message.warning(`Time ${teamIndex} já está cheio`);
      return;
    }

    setTeams((prev) => ({
      ...prev,
      [teamIndex]: [...(prev[teamIndex] ?? []), playerId],
    }));
  };

  const removePlayerFromTeam = (teamIndex: number, playerId: string) => {
    setTeams((prev) => ({
      ...prev,
      [teamIndex]: (prev[teamIndex] ?? []).filter((id) => id !== playerId),
    }));
  };

  const addPlayerToFirstFreeTeam = (playerId: string) => {
    const firstFreeTeam = Object.entries(teams).find(
      ([, ids]) => ids.length < playersPerTeam
    );

    if (!firstFreeTeam) {
      message.warning("Todos os times estão cheios");
      return;
    }

    addPlayerToTeam(Number(firstFreeTeam[0]), playerId);
  };

  const handleOpenModal = () => {
    if (!isComplete) {
      message.error(
        `Selecione exatamente ${needed} jogadores (${totalSelected} selecionados)`
      );
      return;
    }

    setModalVisible(true);
  };

  const handleSaveChampionship = async () => {
    if (!championshipName.trim()) {
      message.error("Informe o nome do campeonato");
      return;
    }

    if (championshipFormat === "KNOCKOUT" && !isPowerOfTwo) {
      message.error(
        "Para eliminatórias diretas, o número de times deve ser potência de 2 (2, 4, 8, 16...)"
      );
      return;
    }

    if (championshipFormat === "GROUPS" && teamCount % 2 !== 0) {
      message.error("Para fase de grupos, o número de times deve ser par");
      return;
    }

    const payload = {
      name: championshipName.trim(),
      format: championshipFormat,
      groupsCount: isGroups ? groupsCount : 0,
      qualifiedPerGroup: isGroups ? qualifiedPerGroup : 0,
      matchesType,
      teams: Object.entries(teams).map(([index, playerIds]) => ({
        teamIndex: Number(index),
        playerIds,
        groupId:
          isGroups ? teamGroups[Number(index)] || 1 : 0,
      })),
      teamNames: Object.entries(teamNames).reduce((acc, [index, name]) => {
        if (name.trim()) {
          acc[Number(index)] = name.trim();
        }

        return acc;
      }, {} as Record<number, string>),
      setsToWin: isFootball ? 1 : setsToWin,
      pointsPerSet: isFootball ? 0 : pointsPerSet,
      tieBreakPoints: isFootball ? 0 : tieBreakPoints,
      startersPerTeam: isFootball ? startersPerTeam : 0,
      yellowCardsForSuspension: isFootball ? yellowCardsForSuspension : 0,
      redCardSuspensionMatches: isFootball ? redCardSuspensionMatches : 0,
    };

    try {
      const result = await saveManualTeams(payload);

      message.success("Campeonato criado com sucesso!");
      navigate(`/championships/${result.championshipId}`);
    } catch {
      message.error("Erro ao criar campeonato");
    } finally {
      setModalVisible(false);
    }
  };

  const renderConfigCard = () => (
    <Card
      className="manual-teams-card"
      title={
        <span className="manual-teams-card-title">
          <SettingOutlined />
          Configuração
        </span>
      }
    >
      <div className="manual-teams-config-stack">
        <div>
          <Text className="manual-teams-field-label">Número de times</Text>

          <InputNumber
            min={2}
            value={teamCount}
            onChange={(value) => setTeamCount(Math.max(2, Number(value) || 2))}
            className="players-full-control"
          />
        </div>

        <div>
          <Text className="manual-teams-field-label">Jogadores por time</Text>

          <InputNumber
            min={1}
            value={playersPerTeam}
            onChange={(value) =>
              setPlayersPerTeam(Math.max(1, Number(value) || 1))
            }
            className="players-full-control"
          />
        </div>

        <div className="manual-teams-progress-box">
          <span>
            {totalSelected} / {needed} selecionados
          </span>
        </div>

        {!isMobile && (
          <Button
            type="primary"
            onClick={handleOpenModal}
            disabled={!isComplete}
            block
            icon={<TrophyOutlined />}
            style={{ color: '#000' }}
          >
            Criar Campeonato
          </Button>
        )}
      </div>
    </Card>
  );

  const renderPlayersCard = () => (
    <Card
      className="manual-teams-card manual-teams-list-card"
      title={
        <span className="manual-teams-card-title">
          <TeamOutlined />
          Jogadores Disponíveis
        </span>
      }
    >
      <div className="manual-teams-scroll">
        {availablePlayers.length === 0 ? (
          <Empty
            description="Nenhum jogador disponível"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={availablePlayers}
            renderItem={(player) => (
              <div className="manual-teams-player-row">
                <span className="manual-teams-player-name">
                  {player.name}
                </span>

                <Button
                  size="small"
                  icon={<UserAddOutlined />}
                  onClick={() => addPlayerToFirstFreeTeam(player.id)}
                  className="manual-teams-add-btn"
                >
                  Adicionar
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </Card>
  );

  const renderTeamsCard = () => (
    <Card
      className="manual-teams-card manual-teams-list-card"
      title={
        <span className="manual-teams-card-title">
          <TeamOutlined />
          Times
        </span>
      }
    >
      <div className="manual-teams-scroll">
        {Object.entries(teams).map(([index, playerIds]) => {
          const teamIndex = Number(index);
          const vacancies = playersPerTeam - playerIds.length;

          return (
            <Card
              key={index}
              type="inner"
              size="small"
              className="manual-team-card"
              title={
                <span className="manual-team-title">
                  {getTeamName(teamIndex)}

                  <Badge count={playerIds.length} />
                </span>
              }
            >
              <Input
                placeholder="Nome do time"
                value={teamNames[teamIndex]}
                onChange={(event) =>
                  setTeamNames((prev) => ({
                    ...prev,
                    [teamIndex]: event.target.value,
                  }))
                }
                size="small"
                className="manual-team-name-input"
              />

              {playerIds.length === 0 ? (
                <Text className="manual-team-empty">Nenhum jogador</Text>
              ) : (
                playerIds.map((playerId) => {
                  const player = players.find((item) => item.id === playerId);

                  return (
                    <div key={playerId} className="manual-team-player">
                      <span className="manual-team-player-name">
                        {player?.name}
                      </span>

                      <Button
                        size="small"
                        danger
                        icon={<UserDeleteOutlined />}
                        onClick={() => removePlayerFromTeam(teamIndex, playerId)}
                      />
                    </div>
                  );
                })
              )}

              <Text className="manual-team-vacancies">
                {vacancies} vaga{vacancies !== 1 ? "s" : ""} restante
                {vacancies !== 1 ? "s" : ""}
              </Text>
            </Card>
          );
        })}
      </div>
    </Card>
  );

  if (playersLoading || sportLoading) {
    return (
      <div className="teamgen-loading-state">
        Carregando jogadores...
      </div>
    );
  }

  if (!sportType) {
    return (
      <div className="teamgen-loading-state">
        Não foi possível identificar o esporte do grupo. Saia e entre novamente após atualizar o backend.
      </div>
    );
  }

  return (
    <main className="manual-teams-page">
      <header className="manual-teams-header">
        <Title level={2} className="manual-teams-title">
          <TrophyOutlined />
          Criação de Campeonato
        </Title>

        <Badge
          count={`${totalSelected}/${needed}`}
          className="manual-teams-counter"
        />
      </header>

      {isMobile ? (
        <div className="manual-teams-mobile-shell">
          <Tabs
            defaultActiveKey="config"
            className="manual-teams-mobile-tabs"
            items={[
              {
                key: "config",
                label: "Config.",
                children: (
                  <div className="manual-teams-mobile-pane">
                    {renderConfigCard()}
                  </div>
                ),
              },
              {
                key: "players",
                label: "Jogadores",
                children: (
                  <div className="manual-teams-mobile-pane">
                    {renderPlayersCard()}
                  </div>
                ),
              },
              {
                key: "teams",
                label: "Times",
                children: (
                  <div className="manual-teams-mobile-pane">
                    {renderTeamsCard()}
                  </div>
                ),
              },
            ]}
          />

          <div className="manual-teams-mobile-footer">
            <Text>
              <strong>{totalSelected}</strong> de <strong>{needed}</strong>
            </Text>

            <Button
              type="primary"
              onClick={handleOpenModal}
              disabled={!isComplete}
              icon={<TrophyOutlined />}
            >
              Criar
            </Button>
          </div>
        </div>
      ) : (
        <Row gutter={[16, 16]} className="manual-teams-grid">
          <Col xs={24} md={8}>
            {renderConfigCard()}
          </Col>

          <Col xs={24} md={8}>
            {renderPlayersCard()}
          </Col>

          <Col xs={24} md={8}>
            {renderTeamsCard()}
          </Col>
        </Row>
      )}

      <Modal
        title={
          <span className="manual-teams-modal-title">
            <TrophyOutlined />
            Configurar Campeonato · {isFootball ? "⚽ Futebol" : "🏐 Vôlei"}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={isMobile ? "calc(100vw - 16px)" : 600}
        className="manual-teams-modal"
        closeIcon={<CloseOutlined className="manual-teams-modal-close" />}
      >
        <Form layout="vertical">
          <Form.Item label="Nome do Campeonato" required>
            <Input
              value={championshipName}
              onChange={(event) => setChampionshipName(event.target.value)}
              placeholder="Ex.: Copa BoraVer 2025"
            />
          </Form.Item>

          <Form.Item label="Formato" required>
            <Select
              value={championshipFormat}
              onChange={setChampionshipFormat}
              options={[
                {
                  value: "GROUPS",
                  label: "Fase de Grupos + Eliminatórias",
                },
                {
                  value: "KNOCKOUT",
                  label: "Eliminatórias Diretas",
                },
                ...(isFootball
                  ? [{ value: "LEAGUE", label: "Liga · Pontos Corridos" }]
                  : []),
              ]}
            />
          </Form.Item>

          {isGroups && (
            <>
              <Form.Item label="Número de Grupos" required>
                <InputNumber
                  min={1}
                  value={groupsCount}
                  onChange={(value) => setGroupsCount(Number(value) || 1)}
                  className="players-full-control"
                />
              </Form.Item>

              <Form.Item label="Alocar Times aos Grupos">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: teamCount }, (_, i) => i + 1).map(
                    (teamIndex) => (
                      <div
                        key={teamIndex}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span style={{ color: '#ccc', flex: 1 }}>
                          {getTeamName(teamIndex)}
                        </span>
                        <Select
                          value={teamGroups[teamIndex]}
                          onChange={(value) =>
                            setTeamGroups((prev) => ({
                              ...prev,
                              [teamIndex]: value,
                            }))
                          }
                          style={{ width: 140 }}
                          options={Array.from(
                            { length: groupsCount },
                            (_, groupIndex) => ({
                              value: groupIndex + 1,
                              label: `Grupo ${groupIndex + 1}`,
                            })
                          )}
                        />
                      </div>
                    )
                  )}
                </div>
              </Form.Item>

              <Form.Item label="Classificados por grupo" required>
                <InputNumber
                  min={1}
                  value={qualifiedPerGroup}
                  onChange={(value) =>
                    setQualifiedPerGroup(Number(value) || 1)
                  }
                  className="players-full-control"
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="Tipo de Partidas" required>
            <Radio.Group
              value={matchesType}
              onChange={(event) => setMatchesType(event.target.value)}
            >
              <Radio value="SINGLE">
                {isLeague ? "Turno Único" : "Somente Ida"}
              </Radio>
              <Radio value="HOME_AND_AWAY">
                {isLeague ? "Turno e Returno" : "Ida e Volta"}
              </Radio>
            </Radio.Group>
          </Form.Item>

          {isVolleyball && (
            <Card
              title="Configuração de Sets"
              size="small"
              className="manual-teams-sets-card"
            >
              <Form.Item label="Sets para vencer">
                <Select
                  value={setsToWin}
                  onChange={setSetsToWin}
                  options={[
                    {
                      value: 1,
                      label: "Melhor de 1 set",
                    },
                    {
                      value: 2,
                      label: "Melhor de 3 sets",
                    },
                    {
                      value: 3,
                      label: "Melhor de 5 sets",
                    },
                  ]}
                />
              </Form.Item>

              <Form.Item label="Pontos por set">
                <InputNumber
                  min={10}
                  max={30}
                  value={pointsPerSet}
                  onChange={(value) => setPointsPerSet(Number(value) || 25)}
                  className="players-full-control"
                />
              </Form.Item>

              {setsToWin > 1 && (
                <Form.Item label="Pontos no tie-break">
                  <InputNumber
                    min={10}
                    max={25}
                    value={tieBreakPoints}
                    onChange={(value) =>
                      setTieBreakPoints(Number(value) || 15)
                    }
                    className="players-full-control"
                  />
                </Form.Item>
              )}
            </Card>
          )}

          {isFootball && (
            <Card
              title="Escalação e Disciplina"
              size="small"
              className="manual-teams-sets-card"
            >
              <Form.Item label="Titulares por time" required>
                <InputNumber
                  min={1}
                  max={playersPerTeam}
                  value={startersPerTeam}
                  onChange={(value) =>
                    setStartersPerTeam(Math.max(1, Number(value) || 1))
                  }
                  className="players-full-control"
                />
              </Form.Item>

              <Form.Item label="Amarelos para suspensão" required>
                <InputNumber
                  min={1}
                  value={yellowCardsForSuspension}
                  onChange={(value) =>
                    setYellowCardsForSuspension(Math.max(1, Number(value) || 3))
                  }
                  className="players-full-control"
                />
              </Form.Item>

              <Form.Item label="Jogos de suspensão por vermelho direto" required>
                <InputNumber
                  min={1}
                  value={redCardSuspensionMatches}
                  onChange={(value) =>
                    setRedCardSuspensionMatches(Math.max(1, Number(value) || 1))
                  }
                  className="players-full-control"
                />
              </Form.Item>
            </Card>
          )}

          <Form.Item>
            <Button
              type="primary"
              onClick={handleSaveChampionship}
              loading={isSaving}
              block
              icon={<TrophyOutlined />}
              className="manual-teams-submit"
              style={{ color: '#000' }}
            >
              Criar Campeonato
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
};
