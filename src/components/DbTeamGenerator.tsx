import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DragEvent } from "react";
import {
  Button,
  Checkbox,
  Col,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import {
  HistoryOutlined,
  PlayCircleOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import { http } from "../api/http";
import { usePlayers } from "../hooks/usePlayers";
import { CourtSetupModal } from "./CourtPosterImage/CourtSetupModal";

const { Text } = Typography;

type UUID = string;

type Skill = {
  id: UUID;
  name: string;
  active: boolean;
};

type GenerateDbRequest = {
  teamCount: number;
  playersPerTeam: number;
  playerIds: UUID[];
  selectedSkills: Array<{ skillId: UUID; weight: number }>;
  sexBalance?: { enabled: boolean; maxMaleDiff: number };
  sexMultiplier?: Record<"M" | "F", number>;
  requiredPositions?: UUID[];
  friendlyPointsPerSet?: number;
  friendlySetsToWin?: number;
};

type RawTeamPlayer = {
  id?: UUID;
  playerId?: UUID;
  player_id?: UUID;
  athleteId?: UUID;
  athlete_id?: UUID;
  name?: string;
  sex?: "M" | "F";
  score?: number;
  player?: {
    id?: UUID;
    name?: string;
    sex?: "M" | "F";
  };
};

type TeamPlayer = {
  playerId: UUID;
  name: string;
  sex: "M" | "F";
  score: number;
};

type RawTeam = {
  teamIndex: number;
  sumScore: number;
  players: RawTeamPlayer[];
};

type Team = {
  teamIndex: number;
  sumScore: number;
  players: TeamPlayer[];
};

type GenerateDbApiResponse = {
  sessionId: UUID;
  teams: RawTeam[];
};

type GenerateDbResponse = {
  sessionId: UUID;
  teams: Team[];
};

type StepKey = "players" | "skills" | "result";

type DragPlayerData = {
  playerId: string;
  fromTeamIndex: number;
};

const DEFAULT_TEAM_COUNT = 8;
const DEFAULT_PLAYERS_PER_TEAM = 4;
const DEFAULT_FRIENDLY_POINTS = 12;

export default function DbTeamGenerator() {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const navigate = useNavigate();

  const [step, setStep] = useState<StepKey>("players");

  const [skillsLoading, setSkillsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const [skills, setSkills] = useState<Skill[]>([]);

  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT);
  const [playersPerTeam, setPlayersPerTeam] = useState(DEFAULT_PLAYERS_PER_TEAM);
  const [friendlyPointsPerSet, setFriendlyPointsPerSet] = useState(
    DEFAULT_FRIENDLY_POINTS
  );

  const [playerQuery, setPlayerQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<UUID[]>([]);
  const [selectedSkillMap, setSelectedSkillMap] = useState<Record<UUID, number>>(
    {}
  );

  const [sexBalanceEnabled, setSexBalanceEnabled] = useState(true);
  const [maxMaleDiff, setMaxMaleDiff] = useState(1);
  const [multM, setMultM] = useState(1);
  const [multF, setMultF] = useState(0.92);

  const [balancePositions, setBalancePositions] = useState(false);
  const [requiredPositions, setRequiredPositions] = useState<UUID[]>([]);
  const [availablePositions, setAvailablePositions] = useState<
    { id: UUID; name: string }[]
  >([]);

  const [result, setResult] = useState<GenerateDbResponse | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const [courtModalOpen, setCourtModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [dragOverTeamIndex, setDragOverTeamIndex] = useState<number | null>(
    null
  );

  const dragDataRef = useRef<DragPlayerData | null>(null);

  const { players: allPlayers, loading: playersLoading } = usePlayers();

  const needed = teamCount * playersPerTeam;

  const activePlayers = useMemo(() => {
    return allPlayers.filter((player) => player.active);
  }, [allPlayers]);

  const activeSkills = useMemo(() => {
    return skills.filter((skill) => skill.active);
  }, [skills]);

  const filteredPlayers = useMemo(() => {
    const query = playerQuery.trim().toLowerCase();

    if (!query) return activePlayers;

    return activePlayers.filter((player) =>
      player.name.toLowerCase().includes(query)
    );
  }, [activePlayers, playerQuery]);

  const filteredSkills = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();

    if (!query) return activeSkills;

    return activeSkills.filter((skill) =>
      skill.name.toLowerCase().includes(query)
    );
  }, [activeSkills, skillQuery]);

  const selectedSkills = useMemo(() => {
    return Object.entries(selectedSkillMap).map(([skillId, weight]) => ({
      skillId,
      weight,
    }));
  }, [selectedSkillMap]);

  const selectedPlayersCount = selectedPlayerIds.length;
  const selectedSkillsCount = selectedSkills.length;

  const canGoNext = selectedPlayersCount >= needed;
  const canGenerate = canGoNext && selectedSkillsCount > 0;

  const normalizeTeams = (rawTeams: RawTeam[]): Team[] => {
    return rawTeams.map((team) => ({
      teamIndex: team.teamIndex,
      sumScore: team.sumScore,
      players: team.players.map((player) => ({
        playerId:
          player.playerId ??
          player.id ??
          player.player_id ??
          player.athleteId ??
          player.athlete_id ??
          player.player?.id ??
          "",
        name: player.name ?? player.player?.name ?? "",
        sex: player.sex ?? player.player?.sex ?? "M",
        score: player.score ?? 0,
      })),
    }));
  };

  const loadSkills = useCallback(async () => {
    setSkillsLoading(true);

    try {
      const { data } = await http.get<Skill[]>("/skills");
      setSkills(Array.isArray(data) ? data : []);
    } catch {
      message.error("Erro ao carregar skills");
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  useEffect(() => {
    http
      .get("/positions")
      .then((res) => setAvailablePositions(Array.isArray(res.data) ? res.data : []))
      .catch(() => message.error("Erro ao carregar posições"));
  }, []);

  useEffect(() => {
    if (result?.teams) {
      setTeams(result.teams);
    }
  }, [result]);

  const togglePlayer = useCallback(
    (playerId: UUID, checked: boolean) => {
      setSelectedPlayerIds((prev) => {
        if (checked) {
          if (prev.length >= needed) {
            message.warning(`Você já selecionou ${needed} jogadores.`);
            return prev;
          }

          return prev.includes(playerId) ? prev : [...prev, playerId];
        }

        return prev.filter((id) => id !== playerId);
      });
    },
    [needed]
  );

  const toggleSkill = useCallback((skillId: UUID, checked: boolean) => {
    setSelectedSkillMap((prev) => {
      const copy = { ...prev };

      if (checked) {
        copy[skillId] = copy[skillId] ?? 1;
      } else {
        delete copy[skillId];
      }

      return copy;
    });
  }, []);

  const setSkillWeight = useCallback((skillId: UUID, weight: number) => {
    setSelectedSkillMap((prev) => ({
      ...prev,
      [skillId]: weight,
    }));
  }, []);

  const goNext = useCallback(() => {
    if (!canGoNext) {
      message.warning(`Selecione pelo menos ${needed} jogadores.`);
      return;
    }

    setStep("skills");
  }, [canGoNext, needed]);

  const goBackToPlayers = useCallback(() => {
    setStep("players");
  }, []);

  const generate = useCallback(async () => {
    if (!canGenerate) {
      message.warning("Selecione jogadores suficientes e pelo menos 1 skill.");
      return;
    }

    const payload: GenerateDbRequest = {
      teamCount,
      playersPerTeam,
      playerIds: selectedPlayerIds.slice(0, needed),
      selectedSkills,
      sexBalance: {
        enabled: sexBalanceEnabled,
        maxMaleDiff,
      },
      sexMultiplier: {
        M: multM,
        F: multF,
      },
      requiredPositions: balancePositions ? requiredPositions : [],
      friendlyPointsPerSet,
      friendlySetsToWin: 1,
    };

    setGenerating(true);
    setResult(null);
    setTeams([]);

    try {
      const { data } = await http.post<GenerateDbApiResponse>(
        "/teams/generate/db",
        payload
      );

      const generatedTeams = normalizeTeams(data.teams);

      setResult({
        sessionId: data.sessionId,
        teams: generatedTeams,
      });

      setTeams(generatedTeams);
      setStep("result");

      message.success("Times gerados com sucesso!");
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? "Erro ao gerar times");
    } finally {
      setGenerating(false);
    }
  }, [
    canGenerate,
    teamCount,
    playersPerTeam,
    selectedPlayerIds,
    needed,
    selectedSkills,
    sexBalanceEnabled,
    maxMaleDiff,
    multM,
    multF,
    balancePositions,
    requiredPositions,
    friendlyPointsPerSet,
  ]);

  const handleRecoverLatest = useCallback(async () => {
    setRecovering(true);

    try {
      const { data } = await http.get<GenerateDbApiResponse>(
        "/teams/latest-session"
      );

      const recoveredTeams = normalizeTeams(data.teams);

      setResult({
        sessionId: data.sessionId,
        teams: recoveredTeams,
      });

      setTeams(recoveredTeams);
      setStep("result");

      message.success("Última geração recuperada!");
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ?? "Nenhuma sessão anterior encontrada."
      );
    } finally {
      setRecovering(false);
    }
  }, []);

  const resetAll = useCallback(() => {
    setStep("players");
    setSelectedPlayerIds([]);
    setSelectedSkillMap({});
    setResult(null);
    setTeams([]);
    setPlayerQuery("");
    setSkillQuery("");
    setTeamCount(DEFAULT_TEAM_COUNT);
    setPlayersPerTeam(DEFAULT_PLAYERS_PER_TEAM);
    setFriendlyPointsPerSet(DEFAULT_FRIENDLY_POINTS);
    setDragOverTeamIndex(null);
    setBalancePositions(false);
    setRequiredPositions([]);

    dragDataRef.current = null;
  }, []);

  const prepareDragPlayer = useCallback(
    (playerId: string, fromTeamIndex: number) => {
      if (!playerId) return;

      dragDataRef.current = {
        playerId,
        fromTeamIndex,
      };
    },
    []
  );

  const movePlayerLocally = useCallback(
    (playerId: string, fromTeamIndex: number, toTeamIndex: number) => {
      const previous = teams.map((team) => ({
        ...team,
        players: [...team.players],
      }));

      const newTeams = teams.map((team) => ({
        ...team,
        players: [...team.players],
      }));

      const fromTeam = newTeams.find(
        (team) => team.teamIndex === fromTeamIndex
      );

      const toTeam = newTeams.find((team) => team.teamIndex === toTeamIndex);

      if (!fromTeam || !toTeam) {
        return {
          didMove: false,
          previousTeams: previous,
        };
      }

      const playerIndex = fromTeam.players.findIndex(
        (player) => player.playerId === playerId
      );

      if (playerIndex === -1) {
        return {
          didMove: false,
          previousTeams: previous,
        };
      }

      const [movedPlayer] = fromTeam.players.splice(playerIndex, 1);
      toTeam.players.push(movedPlayer);

      fromTeam.sumScore = fromTeam.players.reduce(
        (sum, player) => sum + player.score,
        0
      );

      toTeam.sumScore = toTeam.players.reduce(
        (sum, player) => sum + player.score,
        0
      );

      setTeams(newTeams);

      return {
        didMove: true,
        previousTeams: previous,
      };
    },
    [teams]
  );

  const handleDropPlayer = useCallback(
    async (playerId: string, fromTeamIndex: number, toTeamIndex: number) => {
      if (!playerId || fromTeamIndex === toTeamIndex) return;
      if (!result?.sessionId) return;

      const { previousTeams, didMove } = movePlayerLocally(
        playerId,
        fromTeamIndex,
        toTeamIndex
      );

      if (!didMove) return;

      try {
        await http.put(`/teams/session/${result.sessionId}/move-player`, {
          playerId,
          fromTeamIndex,
          toTeamIndex,
        });
      } catch (error: any) {
        message.error(
          error?.response?.data?.message ??
            "Erro ao mover jogador. Revertendo..."
        );

        setTeams(previousTeams);
      }
    },
    [result?.sessionId, movePlayerLocally]
  );

  const onDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, playerId: string, fromTeamIndex: number) => {
      if (!playerId) {
        event.preventDefault();
        return;
      }

      dragDataRef.current = {
        playerId,
        fromTeamIndex,
      };

      event.dataTransfer.effectAllowed = "move";

      try {
        event.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            playerId,
            fromTeamIndex,
          })
        );
      } catch {
        // Fallback via ref.
      }
    },
    []
  );

  const onDragEnd = useCallback(() => {
    setDragOverTeamIndex(null);

    setTimeout(() => {
      dragDataRef.current = null;
    }, 100);
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>, teamIndex: number) => {
      event.preventDefault();
      event.stopPropagation();

      setDragOverTeamIndex(teamIndex);
    },
    []
  );

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const related = event.relatedTarget as Node | null;

    if (related && event.currentTarget.contains(related)) return;

    setDragOverTeamIndex(null);
  }, []);

  const onDropOnTeam = useCallback(
    (event: DragEvent<HTMLDivElement>, toTeamIndex: number) => {
      event.preventDefault();
      event.stopPropagation();

      setDragOverTeamIndex(null);

      let data: Partial<DragPlayerData> | null = null;

      try {
        const raw = event.dataTransfer.getData("text/plain");

        if (raw) {
          data = JSON.parse(raw);
        }
      } catch {
        // Fallback via ref.
      }

      if (!data?.playerId || typeof data.fromTeamIndex !== "number") {
        data = dragDataRef.current;
      }

      if (!data?.playerId || typeof data.fromTeamIndex !== "number") return;

      handleDropPlayer(data.playerId, data.fromTeamIndex, toTeamIndex);
    },
    [handleDropPlayer]
  );

  const handleStartSession = useCallback(
    async (courts: { name: string; teamIndices: number[] }[], sessionDate?: string, sessionTime?: string) => {
      if (!result?.sessionId) return;
      try {
        await http.post("/game-sessions/start-with-courts", {
          generationSessionId: result.sessionId,
          courts,
          pointsPerSet: friendlyPointsPerSet,
          setsToWin: 1,
          sessionDate: sessionDate || null,
          sessionTime: sessionTime || null,
        });
        message.success("Sessão iniciada com sucesso!");
        setCourtModalOpen(false);
        navigate(`/friendly-sessions/${result.sessionId}`);
      } catch (err: any) {
        console.error(err);
        message.error(err?.response?.data?.message ?? "Erro ao iniciar sessão");
      }
    },
    [result?.sessionId, navigate, friendlyPointsPerSet]
  );

  const renderTeamsGrid = (compact: boolean) => (
    <div className={`teamgen-teams-grid ${compact ? "compact" : "wide"}`}>
      {teams.map((team) => {
        const isDragOver = dragOverTeamIndex === team.teamIndex;

        return (
          <div
            key={team.teamIndex}
            className={`teamgen-team-card ${isDragOver ? "drag-over" : ""}`}
            onDragOver={onDragOver}
            onDragEnter={(event) => onDragEnter(event, team.teamIndex)}
            onDragLeave={onDragLeave}
            onDrop={(event) => onDropOnTeam(event, team.teamIndex)}
          >
            <div className="teamgen-team-title">
              Time {team.teamIndex} <span>• {team.sumScore.toFixed(1)}</span>
            </div>

            <div className="teamgen-team-players">
              {team.players.map((player, index) => {
                const canDrag = Boolean(player.playerId);

                return (
                  <div
                    key={
                      player.playerId ||
                      `${team.teamIndex}-${player.name}-${index}`
                    }
                    draggable={canDrag}
                    onPointerDown={() =>
                      canDrag &&
                      prepareDragPlayer(player.playerId, team.teamIndex)
                    }
                    onDragStart={(event) =>
                      onDragStart(event, player.playerId, team.teamIndex)
                    }
                    onDragEnd={onDragEnd}
                    className={`teamgen-player-row ${
                      canDrag ? "" : "disabled"
                    }`}
                    title={
                      canDrag
                        ? "Arraste para outro time"
                        : "Jogador sem ID"
                    }
                  >
                    <span className="teamgen-player-name">{player.name}</span>

                    <span className="teamgen-player-meta">
                      {player.sex} • {player.score.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const TopBar = (
    <div className="teamgen-panel teamgen-topbar">
      <div className="teamgen-topbar-row">
        <div className="teamgen-controls">
          <div className="teamgen-control">
            <label>Times:</label>

            <InputNumber
              min={1}
              value={teamCount}
              onChange={(value) => setTeamCount(Number(value || 1))}
              className="teamgen-number"
            />
          </div>

          <div className="teamgen-control">
            <label>Jogadores/time:</label>

            <InputNumber
              min={2}
              value={playersPerTeam}
              onChange={(value) => setPlayersPerTeam(Number(value || 2))}
              className="teamgen-number wide"
            />
          </div>

          <div className="teamgen-control">
            <label>Pontos p/ vitória:</label>

            <InputNumber
              min={1}
              max={50}
              value={friendlyPointsPerSet}
              onChange={(value) =>
                setFriendlyPointsPerSet(Number(value || DEFAULT_FRIENDLY_POINTS))
              }
              className="teamgen-number"
            />
          </div>
        </div>

        <div className="teamgen-actions">
          {step !== "result" && (
            <Button
              onClick={handleRecoverLatest}
              disabled={recovering}
              icon={<HistoryOutlined />}
              size={isMobile ? "small" : "middle"}
              className="teamgen-button-outline"
            >
              {recovering ? "Carregando..." : "Recuperar última geração"}
            </Button>
          )}

          <Button
            onClick={resetAll}
            size={isMobile ? "small" : "middle"}
            className="teamgen-button-danger"
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="teamgen-meta">
        Precisa de <b>{needed}</b> jogadores • Selecionados:{" "}
        <b>{selectedPlayersCount}</b>
        {step !== "players" && (
          <>
            {" "}
            • Skills selecionadas: <b>{selectedSkillsCount}</b>
          </>
        )}
      </div>
    </div>
  );

  const PlayersStep = (
    <div className="teamgen-panel teamgen-step-panel">
      <div className="teamgen-panel-header">
        <h3 className="teamgen-panel-title">Selecionar Jogadores</h3>

        <Tag className="teamgen-count-tag">
          {selectedPlayersCount} / {needed}
        </Tag>
      </div>

      <div className="teamgen-step-actions">
        <Input
          placeholder="Buscar jogador..."
          value={playerQuery}
          onChange={(event) => setPlayerQuery(event.target.value)}
        />

        <Button 
          onClick={goNext} 
          disabled={!canGoNext}
          className="dashboard-btn primary"
        >
          Próximo: Skills
        </Button>
      </div>

      {playersLoading ? (
        <div className="teamgen-loading-state">
          <Spin />
        </div>
      ) : (
        <div className="teamgen-scroll-area">
          <Row gutter={[12, 12]}>
            {filteredPlayers.map((player) => {
              const checked = selectedPlayerIds.includes(player.id);
              const isDisabled = !checked && selectedPlayersCount >= needed;

              return (
                <Col xs={12} sm={8} md={6} lg={4} key={player.id}>
                  <Checkbox
                    checked={checked}
                    disabled={isDisabled}
                    onChange={(event: CheckboxChangeEvent) =>
                      togglePlayer(player.id, event.target.checked)
                    }
                    className="teamgen-player-checkbox"
                  >
                    {player.name}
                  </Checkbox>
                </Col>
              );
            })}

            {filteredPlayers.length === 0 && (
              <Col span={24}>
                <div className="teamgen-empty">Nenhum jogador encontrado.</div>
              </Col>
            )}
          </Row>
        </div>
      )}
    </div>
  );

  const SkillsStep = (
    <div className="teamgen-skills-layout">
      <div className="teamgen-panel teamgen-skill-panel">
        <div className="teamgen-panel-header">
          <h3 className="teamgen-panel-title">Selecionar Skills</h3>

          <Tag className="teamgen-count-tag">{selectedSkillsCount}</Tag>
        </div>

        <Input
          placeholder="Buscar skill..."
          value={skillQuery}
          onChange={(event) => setSkillQuery(event.target.value)}
        />

        {skillsLoading ? (
          <div className="teamgen-loading-state">
            <Spin />
          </div>
        ) : (
          <div className="teamgen-skill-list">
            {filteredSkills.map((skill) => {
              const checked = selectedSkillMap[skill.id] != null;
              const weight = selectedSkillMap[skill.id] ?? 1;

              return (
                <div key={skill.id} className="teamgen-skill-row">
                  <div className="teamgen-skill-info">
                    <Checkbox
                      checked={checked}
                      onChange={(event) =>
                        toggleSkill(skill.id, event.target.checked)
                      }
                    />

                    <span className="teamgen-skill-name">{skill.name}</span>
                  </div>

                  {checked ? (
                    <div className="teamgen-skill-weight">
                      <span>Peso</span>

                      <InputNumber
                        min={0}
                        max={10}
                        step={0.5}
                        value={weight}
                        onChange={(value) =>
                          setSkillWeight(skill.id, Number(value ?? 1))
                        }
                        className="teamgen-number"
                      />
                    </div>
                  ) : (
                    <Text className="teamgen-rule-label">—</Text>
                  )}
                </div>
              );
            })}

            {filteredSkills.length === 0 && (
              <div className="teamgen-empty">Nenhuma skill encontrada.</div>
            )}
          </div>
        )}

        <div className="teamgen-result-header">
          <Button 
            onClick={goBackToPlayers} 
            size={isMobile ? "small" : "middle"}
            styles={{content: {color: "#000"}}}
            className="dashboard-btn primary"
          >
            Voltar
          </Button>

          <Button
            onClick={generate}
            disabled={!canGenerate || generating}
            loading={generating}
            size={isMobile ? "small" : "middle"}
            className="dashboard-btn primary"
          >
            {generating ? "Gerando..." : "Gerar Times"}
          </Button>
        </div>
      </div>

      <div className="teamgen-panel teamgen-rules-panel">
        <div className="teamgen-panel-header">
          <h3 className="teamgen-rules-title">⚖️ Pesos e Regras</h3>

          <Tag className="teamgen-count-tag">M/F</Tag>
        </div>

        <div className="teamgen-rules-section">
          <Checkbox
            checked={sexBalanceEnabled}
            onChange={(event) => setSexBalanceEnabled(event.target.checked)}
          >
            Balancear quantidade de homens por time
          </Checkbox>

          <div className="teamgen-rule-row">
            <span className="teamgen-rule-label">
              Dif. máxima de homens:
            </span>

            <InputNumber
              min={0}
              max={10}
              value={maxMaleDiff}
              onChange={(value) => setMaxMaleDiff(Number(value ?? 1))}
              className="teamgen-number"
            />
          </div>

          <div className="teamgen-rule-row">
            <span className="teamgen-rule-label">Multiplicador M:</span>

            <InputNumber
              min={0.5}
              max={2}
              step={0.01}
              value={multM}
              onChange={(value) => setMultM(Number(value ?? 1))}
              className="teamgen-number"
            />

            <span className="teamgen-rule-label">Multiplicador F:</span>

            <InputNumber
              min={0.5}
              max={2}
              step={0.01}
              value={multF}
              onChange={(value) => setMultF(Number(value ?? 0.92))}
              className="teamgen-number"
            />
          </div>

          <div className="teamgen-rules-section">
            <Checkbox
              checked={balancePositions}
              onChange={(event) => setBalancePositions(event.target.checked)}
            >
              Garantir posições obrigatórias
            </Checkbox>

            {balancePositions && (
              <div className="teamgen-required-positions">
                <Text className="teamgen-rule-label">
                  Posições obrigatórias:
                </Text>

                <Select
                  mode="multiple"
                  placeholder="Selecione"
                  value={requiredPositions}
                  onChange={setRequiredPositions}
                  options={availablePositions.map((position) => ({
                    value: position.id,
                    label: position.name,
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ResultStep = (
    <div className="teamgen-panel teamgen-result-panel">
      <div className="teamgen-result-header">
        <h2 className="teamgen-result-title">Times Gerados</h2>

        <div className="teamgen-actions">
          {teams.length ? (
            <Tag className="teamgen-count-tag">{teams.length} times</Tag>
          ) : null}

          <Button 
            onClick={resetAll} 
            size={isMobile ? "small" : "middle"}
            className="dashboard-btn primary"
          >
            Novo sorteio
          </Button>
        </div>
      </div>

      {generating ? (
        <div className="teamgen-loading-state">
          <Spin />
          <span>Calculando balanceamento...</span>
        </div>
      ) : teams.length ? (
        <>
          <div className="teamgen-generated-toolbar">
            <div className="teamgen-actions">
              <Button
                onClick={generate}
                disabled={!canGenerate || generating}
                icon={<SwapOutlined />}
                size={isMobile ? "small" : "middle"}
                className="dashboard-btn primary"
              >
                Reembaralhar
              </Button>

              <Button
                onClick={() => setAdjustModalOpen(true)}
                size={isMobile ? "small" : "middle"}
                className="dashboard-btn primary"
              >
                Ajustar Times
              </Button>

              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => setCourtModalOpen(true)}
                size={isMobile ? "small" : "middle"}
                className="dashboard-btn primary"
              >
                Iniciar Sessão
              </Button>
            </div>
          </div>

          <div className="teamgen-teams-scroll">{renderTeamsGrid(true)}</div>
        </>
      ) : (
        <div className="teamgen-empty-state">
          <div className="teamgen-empty-icon">🧠</div>

          <h3>Nenhum time gerado</h3>

          <p>Volte e gere novamente.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="teamgen-workspace">
      {TopBar}

      <div className="teamgen-content">
        {step === "players" && PlayersStep}
        {step === "skills" && SkillsStep}
        {step === "result" && ResultStep}
      </div>

      {result?.sessionId && (
        <CourtSetupModal
          open={courtModalOpen}
          sessionId={result.sessionId}
          teams={teams.map((team) => ({
            teamIndex: team.teamIndex,
            name: `Time ${team.teamIndex}`,
            players: team.players.map((player, playerIndex) => ({
              id:
                player.playerId ||
                `${team.teamIndex}-${player.name}-${playerIndex}`,
              name: player.name,
            })),
          }))}
          onCancel={() => setCourtModalOpen(false)}
          onConfirm={handleStartSession}
        />
      )}

      <Modal
        title={
          <div className="teamgen-adjust-modal-title">
            <span>Ajustar Times</span>

            <div className="teamgen-actions">
              <Button type="primary" onClick={() => setAdjustModalOpen(false)}>
                Concluído
              </Button>

              <Button onClick={() => setAdjustModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        }
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        footer={null}
        closable={false}
        width="100vw"
        className="teamgen-adjust-modal"
      >
        {teams.length > 0 ? (
          renderTeamsGrid(false)
        ) : (
          <div className="teamgen-empty">
            Nenhum time disponível para ajuste.
          </div>
        )}
      </Modal>
    </div>
  );
}