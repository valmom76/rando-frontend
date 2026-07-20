import React, { useState } from 'react';
import { Card, Button, Tag, message, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import type { MatchDetails } from '../types';
import { ScoreboardModal } from './ScoreboardModal';
import type { SportType } from '../../auth/store';

const { Text } = Typography;

interface Props {
  matches: MatchDetails[];
  championshipId: string;
  sportType?: SportType;
  onMatchPlayed?: () => void;
}

const stageOrder = ['QUARTER', 'SEMI', 'FINAL', 'THIRD_PLACE'];
const stageNames: Record<string, string> = {
  QUARTER: 'Quartas de Final',
  SEMI: 'Semifinal',
  FINAL: 'Final',
  THIRD_PLACE: 'Disputa de 3º Lugar',
};

export const KnockoutBracket: React.FC<Props> = ({ matches, championshipId, sportType = 'VOLLEYBALL', onMatchPlayed }) => {
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

  const grouped = matches.reduce((acc, match) => {
    const stage = match.stage || 'UNKNOWN';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(match);
    return acc;
  }, {} as Record<string, MatchDetails[]>);

  const teamName = (match: MatchDetails, isHome: boolean) => {
    return isHome
      ? (match.homeTeamName || `Time ${match.homeTeamIndex}`)
      : (match.awayTeamName || `Time ${match.awayTeamIndex}`);
  };

  return (
    <div style={{ width: '100%' }}>
      {stageOrder.map((stage) => {
        const stageMatches = grouped[stage];
        if (!stageMatches || stageMatches.length === 0) return null;

        return (
          <Card
            key={stage}
            title={
              <span style={{
                fontSize: 'clamp(14px, 2.5vw, 22px)',
                fontWeight: 'bold',
                color: 'var(--primary)',
              }}>
                {stageNames[stage]}
              </span>
            }
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid #333',
              borderRadius: 8,
              marginBottom: 16,
            }}
            styles={{
              header: {
                backgroundColor: '#0d0d0d',
                borderBottom: '1px solid var(--primary)',
              },
              body: {
                padding: isMobile ? 8 : 'clamp(8px, 2vw, 16px)',
              },
            }}
          >
            {stageMatches.map((match) => (
              <div
                key={match.matchId}
                style={{
                  backgroundColor: '#262626',
                  padding: isMobile ? '10px 12px' : 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px)',
                  marginBottom: 8,
                  borderRadius: 8,
                  borderLeft: '6px solid var(--primary)',
                }}
              >
                {/* Times lado a lado */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 6 : 12,
                  flexWrap: 'wrap',
                }}>
                  <Text style={{
                    fontSize: 'clamp(13px, 2vw, 18px)',
                    color: '#fff',
                    flex: 1,
                    minWidth: 70,
                    textAlign: 'right',
                    wordBreak: 'break-word',
                  }}>
                    {teamName(match, true)}
                  </Text>

                  <Text style={{
                    fontSize: 'clamp(16px, 2.5vw, 22px)',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    flexShrink: 0,
                    minWidth: 36,
                    textAlign: 'center',
                  }}>
                    vs
                  </Text>

                  <Text style={{
                    fontSize: 'clamp(13px, 2vw, 18px)',
                    color: '#fff',
                    flex: 1,
                    minWidth: 70,
                    textAlign: 'left',
                    wordBreak: 'break-word',
                  }}>
                    {teamName(match, false)}
                  </Text>

                  {/* Placar ou Botão */}
                  {match.played ? (
                    <Tag style={{
                      fontSize: 'clamp(14px, 2.5vw, 20px)',
                      padding: 'clamp(4px, 1vw, 8px) clamp(10px, 2vw, 18px)',
                      borderRadius: 8,
                      backgroundColor: 'var(--primary)',
                      color: 'var(--surface-2)',
                      border: 'none',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {match.homeScore} x {match.awayScore}
                      {match.homePenaltyScore != null && match.awayPenaltyScore != null
                        ? ` (${match.homePenaltyScore} x ${match.awayPenaltyScore} pên.)`
                        : ''}
                    </Tag>
                  ) : (
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
          </Card>
        );
      })}

      {selectedMatch && (
        <ScoreboardModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedMatch(null);
          }}
          championshipId={championshipId}
          matchId={selectedMatch.matchId}
          homeTeamIndex={selectedMatch.homeTeamIndex}
          awayTeamIndex={selectedMatch.awayTeamIndex}
          generationSessionId={selectedMatch.generationSessionId}
          onSuccess={() => {
            if (onMatchPlayed) onMatchPlayed();
          }}
          homeTeamName={selectedMatch.homeTeamName}
          awayTeamName={selectedMatch.awayTeamName}
          setsToWin={selectedMatch.setsToWin}
          pointsPerSet={selectedMatch.pointsPerSet}
          tieBreakPoints={selectedMatch.tieBreakPoints}
          sportType={sportType}
          stage={selectedMatch.stage}
        />
      )}
    </div>
  );
};
