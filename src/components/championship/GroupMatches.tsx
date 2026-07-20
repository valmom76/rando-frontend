import React, { useMemo, useState } from 'react';
import { Card, Button, message, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import type { MatchDetails } from '../types';
import { ScoreboardModal } from './ScoreboardModal';
import type { SportType } from '../../auth/store';

const { Text } = Typography;

interface Props {
  matches: MatchDetails[];
  championshipId: string;
  groupName: string;
  sportType?: SportType;
  preserveOrder?: boolean;
  onMatchPlayed?: () => void;
}

interface ScheduleState {
  orderedIndexes: number[];
  remainingIndexes: number[];
  playedCount: Map<number, number>;
  lastPlayedAt: Map<number, number>;
  cost: number;
}

const orderMatchesEvenly = (
  matches: MatchDetails[],
): MatchDetails[] => {
  if (matches.length <= 2) {
    return [...matches];
  }

  const totalMatches = matches.length;
  const totalGamesByTeam = new Map<number, number>();

  /*
   * Calcula quantos jogos cada time possui no grupo.
   */
  matches.forEach((match) => {
    totalGamesByTeam.set(
      match.homeTeamIndex,
      (totalGamesByTeam.get(match.homeTeamIndex) ?? 0) + 1,
    );

    totalGamesByTeam.set(
      match.awayTeamIndex,
      (totalGamesByTeam.get(match.awayTeamIndex) ?? 0) + 1,
    );
  });

  /*
   * Retorna a posição ideal da participação de um time.
   *
   * Exemplo:
   * Se o time possui 3 jogos em uma tabela de 12 partidas,
   * suas posições ideais ficam aproximadamente em:
   *
   * 1,5 — 5,5 — 9,5
   *
   * Isso evita que o time faça todos os jogos no começo.
   */
  const getIdealPosition = (
    occurrenceIndex: number,
    totalTeamGames: number,
  ) => {
    return (
      ((occurrenceIndex + 0.5) * totalMatches) /
        totalTeamGames -
      0.5
    );
  };

  const getRestPenalty = (
    teamIndex: number,
    position: number,
    lastPlayedAt: Map<number, number>,
  ) => {
    const lastPosition = lastPlayedAt.get(teamIndex);

    if (lastPosition === undefined) {
      return 0;
    }

    const matchesBetween = position - lastPosition - 1;

    /*
     * Penalidades:
     *
     * 0 partidas de intervalo: time joga novamente imediatamente.
     * 1 partida de intervalo: permitido, mas pouco desejável.
     * 2 partidas de intervalo: pequena penalidade.
     */
    if (matchesBetween === 0) {
      return 10_000;
    }

    if (matchesBetween === 1) {
      return 120;
    }

    if (matchesBetween === 2) {
      return 30;
    }

    return 0;
  };

  /*
   * Beam Search:
   *
   * Em vez de escolher apenas a próxima melhor partida,
   * mantém várias sequências possíveis e compara o resultado
   * acumulado de cada uma.
   */
  const beamWidth =
    totalMatches <= 16
      ? 600
      : totalMatches <= 30
        ? 350
        : 200;

  let states: ScheduleState[] = [
    {
      orderedIndexes: [],
      remainingIndexes: matches.map((_, index) => index),
      playedCount: new Map(),
      lastPlayedAt: new Map(),
      cost: 0,
    },
  ];

  for (
    let position = 0;
    position < totalMatches;
    position += 1
  ) {
    const nextStates: ScheduleState[] = [];

    states.forEach((state) => {
      state.remainingIndexes.forEach((matchIndex) => {
        const match = matches[matchIndex];

        const homeTeamIndex = match.homeTeamIndex;
        const awayTeamIndex = match.awayTeamIndex;

        const homeOccurrence =
          state.playedCount.get(homeTeamIndex) ?? 0;

        const awayOccurrence =
          state.playedCount.get(awayTeamIndex) ?? 0;

        const homeTotalGames =
          totalGamesByTeam.get(homeTeamIndex) ?? 1;

        const awayTotalGames =
          totalGamesByTeam.get(awayTeamIndex) ?? 1;

        const homeIdealPosition = getIdealPosition(
          homeOccurrence,
          homeTotalGames,
        );

        const awayIdealPosition = getIdealPosition(
          awayOccurrence,
          awayTotalGames,
        );

        /*
         * Quanto mais distante da posição ideal,
         * maior será o custo da partida nessa posição.
         */
        const positionPenalty =
          Math.abs(position - homeIdealPosition) +
          Math.abs(position - awayIdealPosition);

        /*
         * Evita que um time jogue novamente com pouco descanso.
         */
        const restPenalty =
          getRestPenalty(
            homeTeamIndex,
            position,
            state.lastPlayedAt,
          ) +
          getRestPenalty(
            awayTeamIndex,
            position,
            state.lastPlayedAt,
          );

        const nextPlayedCount = new Map(state.playedCount);

        nextPlayedCount.set(
          homeTeamIndex,
          homeOccurrence + 1,
        );

        nextPlayedCount.set(
          awayTeamIndex,
          awayOccurrence + 1,
        );

        /*
         * Verifica se algum time está fazendo seus jogos
         * rápido demais ou ficando atrasado em relação aos outros.
         */
        let distributionPenalty = 0;

        totalGamesByTeam.forEach(
          (totalTeamGames, teamIndex) => {
            const actualGames =
              nextPlayedCount.get(teamIndex) ?? 0;

            const expectedGames =
              ((position + 1) * totalTeamGames) /
              totalMatches;

            const difference =
              actualGames - expectedGames;

            distributionPenalty += difference * difference;
          },
        );

        const nextLastPlayedAt = new Map(
          state.lastPlayedAt,
        );

        nextLastPlayedAt.set(homeTeamIndex, position);
        nextLastPlayedAt.set(awayTeamIndex, position);

        nextStates.push({
          orderedIndexes: [
            ...state.orderedIndexes,
            matchIndex,
          ],

          remainingIndexes:
            state.remainingIndexes.filter(
              (index) => index !== matchIndex,
            ),

          playedCount: nextPlayedCount,
          lastPlayedAt: nextLastPlayedAt,

          cost:
            state.cost +
            positionPenalty * 15 +
            distributionPenalty * 10 +
            restPenalty +
            matchIndex * 0.000001,
        });
      });
    });

    /*
     * Mantém somente as melhores sequências encontradas até aqui.
     */
    nextStates.sort((a, b) => a.cost - b.cost);

    states = nextStates.slice(0, beamWidth);
  }

  const bestState = states[0];

  if (!bestState) {
    return [...matches];
  }

  return bestState.orderedIndexes.map(
    (matchIndex) => matches[matchIndex],
  );
};

export const GroupMatches: React.FC<Props> = ({
  matches,
  championshipId,
  groupName,
  sportType = 'VOLLEYBALL',
  preserveOrder = false,
  onMatchPlayed,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const handlePlay = (match: MatchDetails) => {
    if (!match.generationSessionId) {
      message.error('Dados da partida incompletos. Não é possível iniciar o jogo.');
      return;
    }
    setSelectedMatch(match);
    setModalVisible(true);
  };

  const teamName = (match: MatchDetails, isHome: boolean) => {
    return isHome 
      ? (match.homeTeamName || `Time ${match.homeTeamIndex}`)
      : (match.awayTeamName || `Time ${match.awayTeamIndex}`);
  };

  const isWinner = (match: MatchDetails, isHome: boolean) => {
    if (!match.played) return false;
    return isHome 
      ? match.winnerTeamIndex === match.homeTeamIndex
      : match.winnerTeamIndex === match.awayTeamIndex;
  };

  const interleavedMatches = useMemo(() => {
    if (!matches?.length) {
      return [];
    }

    return preserveOrder
      ? [...matches].sort((first, second) => first.round - second.round)
      : orderMatchesEvenly(matches);
  }, [matches, preserveOrder]);

  return (
    <Card
      title={
        <span style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: 'var(--primary)', fontWeight: 'bold' }}>
          {groupName}
        </span>
      }
      style={{ backgroundColor: 'var(--surface-2)', border: '1px solid #333', borderRadius: 8, marginBottom: 16 }}
      styles={{
        header: { borderBottom: '1px solid #333' },
        body: { padding: isMobile ? 8 : 'clamp(8px, 2vw, 16px)' },
      }}
    >
      {interleavedMatches.map((match) => (
        <div
          key={match.matchId}
          style={{
            padding: isMobile ? '8px 0' : 'clamp(8px, 1.5vw, 14px) 0',
            borderBottom: '1px solid #333',
          }}
        >
          {/* Rodada */}
          <Text style={{
            fontSize: 'clamp(11px, 1.8vw, 14px)',
            color: '#888',
            display: 'block',
            marginBottom: isMobile ? 4 : 6,
          }}>
            Rodada {match.round}
          </Text>

          {/* Times + Placar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 6 : 12,
            flexWrap: 'wrap',
          }}>
            {/* Time Casa */}
            <Text
              style={{
                fontSize: 'clamp(13px, 2vw, 16px)',
                color: isWinner(match, true) ? 'var(--primary)' : '#ccc',
                fontWeight: isWinner(match, true) ? 'bold' : 'normal',
                flex: 1,
                minWidth: 80,
                textAlign: 'right',
                wordBreak: 'break-word',
              }}
            >
              {teamName(match, true)}
            </Text>

            {/* Placar ou vs */}
            <Text style={{
              fontSize: 'clamp(16px, 2.5vw, 24px)',
              fontWeight: 'bold',
              color: match.played ? 'var(--primary)' : '#fff',
              minWidth: 50,
              textAlign: 'center',
              flexShrink: 0,
            }}>
              {match.played ? `${match.homeScore} x ${match.awayScore}` : 'vs'}
            </Text>

            {/* Time Fora */}
            <Text
              style={{
                fontSize: 'clamp(13px, 2vw, 16px)',
                color: isWinner(match, false) ? 'var(--primary)' : '#ccc',
                fontWeight: isWinner(match, false) ? 'bold' : 'normal',
                flex: 1,
                minWidth: 80,
                textAlign: 'left',
                wordBreak: 'break-word',
              }}
            >
              {teamName(match, false)}
            </Text>

            {/* Botão Jogar */}
            {!match.played && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => handlePlay(match)}
                size="small"
                style={{
                  backgroundColor: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  color: 'var(--surface-2)',
                  fontWeight: 'bold',
                  fontSize: 'clamp(12px, 1.8vw, 14px)',
                  height: 32,
                  padding: '0 12px',
                  flexShrink: 0,
                }}
              >
                Jogar
              </Button>
            )}
          </div>
        </div>
      ))}

      {selectedMatch && (
        <ScoreboardModal
          visible={modalVisible}
          onClose={() => { setModalVisible(false); setSelectedMatch(null); }}
          championshipId={championshipId}
          matchId={selectedMatch.matchId}
          homeTeamIndex={selectedMatch.homeTeamIndex}
          awayTeamIndex={selectedMatch.awayTeamIndex}
          generationSessionId={selectedMatch.generationSessionId}
          homeTeamName={selectedMatch.homeTeamName}
          awayTeamName={selectedMatch.awayTeamName}
          setsToWin={selectedMatch.setsToWin}
          pointsPerSet={selectedMatch.pointsPerSet}
          tieBreakPoints={selectedMatch.tieBreakPoints}
          sportType={sportType}
          stage={selectedMatch.stage || 'GROUP'}
          onSuccess={() => onMatchPlayed && onMatchPlayed()}
        />
      )}
    </Card>
  );
};
