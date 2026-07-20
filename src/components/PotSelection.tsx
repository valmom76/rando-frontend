import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Spin,
  Typography,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import { http } from "../api/http";
import { usePlayers } from "../hooks/usePlayers";

const { Text } = Typography;

type TeamGenerated = {
  teamIndex: number;
  players: {
    id: string;
    name: string;
    sex: string;
    score: number;
  }[];
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

export const PotSelection: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const { players, loading, error } = usePlayers();

  const activePlayers = useMemo(() => {
    return players.filter((player) => player.active);
  }, [players]);

  const [teamCount, setTeamCount] = useState(8);
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [potes, setPotes] = useState<string[][]>([]);
  const [currentPoteIndex, setCurrentPoteIndex] = useState(0);
  const [generatedTeams, setGeneratedTeams] = useState<TeamGenerated[]>([]);
  const [saving, setSaving] = useState(false);
  const [playerQuery, setPlayerQuery] = useState("");

  useEffect(() => {
    setPotes(Array(playersPerTeam).fill(null).map(() => []));
    setCurrentPoteIndex(0);
    setGeneratedTeams([]);
  }, [playersPerTeam]);

  const selectedPlayerIds = useMemo(() => {
    const selected = new Set<string>();

    potes.forEach((pote, index) => {
      if (index !== currentPoteIndex) {
        pote.forEach((id) => selected.add(id));
      }
    });

    return selected;
  }, [potes, currentPoteIndex]);

  const availablePlayers = useMemo(() => {
    return activePlayers.filter((player) => !selectedPlayerIds.has(player.id));
  }, [activePlayers, selectedPlayerIds]);

  const filteredPlayers = useMemo(() => {
    const query = playerQuery.trim().toLowerCase();

    if (!query) return availablePlayers;

    return availablePlayers.filter((player) =>
      player.name.toLowerCase().includes(query)
    );
  }, [availablePlayers, playerQuery]);

  const currentPote = potes[currentPoteIndex] || [];

  const isCurrentPoteComplete = currentPote.length >= teamCount;

  const areAllPotesComplete =
    potes.length === playersPerTeam &&
    potes.every((pote) => pote.length === teamCount);

  const togglePlayer = useCallback(
    (playerId: string) => {
      if (
        isCurrentPoteComplete &&
        !potes[currentPoteIndex]?.includes(playerId)
      ) {
        message.warning(`Este pote já tem ${teamCount} jogadores.`);
        return;
      }

      setPotes((prev) => {
        const newPotes = [...prev];
        const current = newPotes[currentPoteIndex] || [];

        if (current.includes(playerId)) {
          newPotes[currentPoteIndex] = current.filter((id) => id !== playerId);
        } else {
          newPotes[currentPoteIndex] = [...current, playerId];
        }

        return newPotes;
      });
    },
    [currentPoteIndex, isCurrentPoteComplete, potes, teamCount]
  );

  const goToNextPote = useCallback(() => {
    if (currentPoteIndex < potes.length - 1) {
      setCurrentPoteIndex((prev) => prev + 1);
      setPlayerQuery("");
    }
  }, [currentPoteIndex, potes.length]);

  const goToPrevPote = useCallback(() => {
    if (currentPoteIndex > 0) {
      setCurrentPoteIndex((prev) => prev - 1);
      setPlayerQuery("");
    }
  }, [currentPoteIndex]);

  const handleGenerate = useCallback(() => {
    if (!areAllPotesComplete) {
      message.warning("Complete todos os potes antes de embaralhar.");
      return;
    }

    const playerMap = new Map(activePlayers.map((player) => [player.id, player]));
    const shuffledPotes = potes.map((pote) => shuffleArray([...pote]));

    const potesInfo = shuffledPotes.map((pote) =>
      pote.map((id) => ({
        id,
        sex: playerMap.get(id)?.sex,
      }))
    );

    const teams: {
      players: (string | null)[];
      menCount: number;
    }[] = [];

    for (let index = 0; index < teamCount; index++) {
      teams.push({
        players: new Array(playersPerTeam).fill(null),
        menCount: 0,
      });
    }

    for (let poteIndex = 0; poteIndex < playersPerTeam; poteIndex++) {
      const playersFromPot = potesInfo[poteIndex];

      const men = playersFromPot
        .filter((player) => player.sex === "M")
        .map((player) => player.id);

      const women = playersFromPot
        .filter((player) => player.sex === "F")
        .map((player) => player.id);

      let availableTeams = teams
        .map((team, index) => ({
          index,
          occupied: team.players[poteIndex] !== null,
        }))
        .filter((team) => !team.occupied)
        .map((team) => team.index);

      const orderedTeams = teams
        .map((team, index) => ({
          index,
          menCount: team.menCount,
        }))
        .sort((a, b) => a.menCount - b.menCount)
        .map((team) => team.index);

      const eligibleTeams = orderedTeams.filter(
        (index) =>
          availableTeams.includes(index) && teams[index].menCount < 3
      );

      if (men.length > eligibleTeams.length) {
        message.error(
          "Não há times suficientes com menos de 3 homens para alocar todos os homens. Tente novamente ou ajuste as seleções."
        );
        return;
      }

      for (const man of men) {
        const teamIndex = eligibleTeams.shift();

        if (teamIndex == null) continue;

        teams[teamIndex].players[poteIndex] = man;
        teams[teamIndex].menCount += 1;

        availableTeams = availableTeams.filter((index) => index !== teamIndex);
      }

      for (const woman of women) {
        const teamIndex = availableTeams.shift();

        if (teamIndex == null) continue;

        teams[teamIndex].players[poteIndex] = woman;
      }
    }

    const teamsWithFourMen = teams.filter((team) => team.menCount > 3);

    if (teamsWithFourMen.length > 0) {
      message.error("Erro inesperado: algum time ficou com 4 homens.");
      return;
    }

    const newTeams: TeamGenerated[] = teams.map((team, index) => ({
      teamIndex: index + 1,
      players: team.players
        .filter((id): id is string => Boolean(id))
        .map((id) => {
          const player = playerMap.get(id);

          return {
            id: player?.id || id,
            name: player?.name || "Jogador",
            sex: player?.sex || "M",
            score: 0,
          };
        }),
    }));

    setGeneratedTeams(newTeams);

    message.success("Times gerados com sucesso!");
  }, [areAllPotesComplete, activePlayers, potes, teamCount, playersPerTeam]);

  const handleSave = async () => {
    if (generatedTeams.length === 0) return;

    setSaving(true);

    try {
      const payload = {
        teams: generatedTeams.map((team) => ({
          teamIndex: team.teamIndex,
          players: team.players.map((player) => ({
            id: player.id,
            name: player.name,
            sex: player.sex,
            score: 0,
          })),
        })),
      };

      const response = await http.post("/teams/generate-from-pots", payload);
      const result = response.data;

      navigate(
        `/teams/result?sessionId=${result.sessionId}&teams=${encodeURIComponent(
          JSON.stringify(result.teams)
        )}`
      );
    } catch (error: any) {
      message.error(error.response?.data?.message || "Falha ao salvar times");
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setPotes(Array(playersPerTeam).fill(null).map(() => []));
    setCurrentPoteIndex(0);
    setGeneratedTeams([]);
    setPlayerQuery("");
  };

  if (loading) {
    return (
      <div className="teamgen-loading-state">
        <Spin />

        <span>Carregando jogadores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Erro"
        description={error}
        type="error"
        className="teamgen-error"
      />
    );
  }

  return (
    <div className="pot-workspace">
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
          </div>

          <div className="teamgen-actions">
            <Button
              onClick={handleGenerate}
              disabled={!areAllPotesComplete}
              type="primary"
              size={isMobile ? "small" : "middle"}
            >
              Embaralhar Times
            </Button>

            {generatedTeams.length > 0 && (
              <Button
                onClick={handleSave}
                loading={saving}
                type="primary"
                size={isMobile ? "small" : "middle"}
                className="teamgen-button-info"
              >
                Salvar
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
          {potes.length} potes • {teamCount} jogadores por pote • Pote atual:{" "}
          <b>{currentPoteIndex + 1}</b>
        </div>
      </div>

      <div className="teamgen-panel pot-selection-panel">
        <div className="pot-nav-row">
          <div className="pot-nav-buttons">
            <Button
              onClick={goToPrevPote}
              disabled={currentPoteIndex === 0}
              size={isMobile ? "small" : "middle"}
            >
              Anterior
            </Button>

            <Button
              onClick={goToNextPote}
              disabled={
                !isCurrentPoteComplete || currentPoteIndex === potes.length - 1
              }
              type="primary"
              size={isMobile ? "small" : "middle"}
            >
              Próximo
            </Button>
          </div>

          <Text className="teamgen-meta">
            Selecionados neste pote: <b>{currentPote.length}</b> /{" "}
            <b>{teamCount}</b>
          </Text>
        </div>

        <div className="pot-tabs">
          {potes.map((pote, index) => {
            const disabled =
              !areAllPotesComplete &&
              index !== currentPoteIndex &&
              pote.length < teamCount;

            return (
              <Button
                key={index}
                type={currentPoteIndex === index ? "primary" : "default"}
                onClick={() => {
                  setCurrentPoteIndex(index);
                  setPlayerQuery("");
                }}
                disabled={disabled}
                size="small"
              >
                Pote {index + 1} ({pote.length}/{teamCount})
              </Button>
            );
          })}
        </div>

        <Input
          placeholder="Buscar jogador..."
          value={playerQuery}
          onChange={(event) => setPlayerQuery(event.target.value)}
          className="pot-search"
        />

        <div className="teamgen-scroll-area">
          <div className="teamgen-teams-grid compact">
            {filteredPlayers.map((player) => {
              const isSelected = currentPote.includes(player.id);
              const disabled = isCurrentPoteComplete && !isSelected;

              return (
                <Checkbox
                  key={player.id}
                  checked={isSelected}
                  onChange={() => togglePlayer(player.id)}
                  disabled={disabled}
                  className="teamgen-player-checkbox"
                >
                  {player.name}
                </Checkbox>
              );
            })}

            {filteredPlayers.length === 0 && (
              <div className="teamgen-empty">
                Nenhum jogador disponível.
              </div>
            )}
          </div>
        </div>
      </div>

      {generatedTeams.length > 0 && (
        <div className="teamgen-panel pot-generated-panel">
          <h3 className="pot-generated-title">Times Gerados</h3>

          <div className="pot-generated-grid">
            {generatedTeams.map((team) => (
              <div key={team.teamIndex} className="pot-team-card">
                <div className="pot-team-title">Time {team.teamIndex}</div>

                {team.players.map((player) => (
                  <div key={player.id} className="pot-player">
                    {player.name} <span>({player.sex})</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};