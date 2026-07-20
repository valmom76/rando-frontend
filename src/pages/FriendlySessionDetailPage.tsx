import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Spin, Tag, Row, Col, Space, Button } from 'antd';
import { TeamOutlined, TrophyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { http } from '../api/http';
import { ScoreboardModal } from '../components/championship/ScoreboardModal';
import { useMediaQuery } from 'react-responsive';
import { authStore } from '../auth/store';

const { Title, Text } = Typography;

export default function FriendlySessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const sportType = authStore.get().sportType ?? 'VOLLEYBALL';
  const [details, setDetails] = useState<any>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [scoreboardData, setScoreboardData] = useState<{
    courtName: string;
    homeTeam: number;
    awayTeam: number;
  } | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

  useEffect(() => {
    http.get(`/game-sessions/${sessionId}/details`).then(res => {
      setDetails(res.data);
      if (res.data?.courts?.length === 1) {
        setSelectedCourt(res.data.courts[0].name);
      }
    });
  }, [sessionId]);

  const openScoreboard = (courtName: string, homeTeam: number, awayTeam: number) => {
    setScoreboardData({ courtName, homeTeam, awayTeam });
    setShowScoreboard(true);
  };

  const handleSaveFriendly = async (matchData: any) => {
    if (!scoreboardData) return;
    await http.post(`/game-sessions/${sessionId}/matches`, {
      courtName: scoreboardData.courtName,
      homeTeamIndex: scoreboardData.homeTeam,
      awayTeamIndex: scoreboardData.awayTeam,
      homeScore: matchData.homeScore,
      awayScore: matchData.awayScore,
      walkover: matchData.walkover || false,
      winnerTeamIndex: matchData.winnerTeamIndex,
    });
    const res = await http.get(`/game-sessions/${sessionId}/details`);
    setDetails(res.data);
  };

  if (!details) return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;

  const renderCourtContent = (court: any) => {
    const teams = court.teams || [];
    const pairs: { home: any; away: any }[] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairs.push({ home: teams[i], away: teams[j] });
      }
    }

    const winsMap: Record<string, number> = {};
    teams.forEach((t: any) => {
      winsMap[t.teamName || `Time ${t.teamIndex}`] = 0;
    });
    court.matches?.forEach((m: any) => {
      if (m.winnerTeamIndex === m.homeTeamIndex) {
        const name = m.homeTeamName || `Time ${m.homeTeamIndex}`;
        winsMap[name] = (winsMap[name] || 0) + 1;
      } else if (m.winnerTeamIndex === m.awayTeamIndex) {
        const name = m.awayTeamName || `Time ${m.awayTeamIndex}`;
        winsMap[name] = (winsMap[name] || 0) + 1;
      }
    });
    const sorted = Object.entries(winsMap).sort((a, b) => b[1] - a[1]);
    const hasWins = sorted.some(([, v]) => v > 0);

    return (
      <>
        {details.courts.length > 1 && (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setSelectedCourt(null)}
            style={{ marginBottom: 16, borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            Trocar quadra
          </Button>
        )}

        <Card
          title={<span style={{ color: 'var(--primary)', fontSize: 'clamp(18px, 2.5vw, 24px)' }}>{court.name}</span>}
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid #333',
            borderRadius: 8,
            marginBottom: 24,
          }}
          styles={{ body: { padding: isMobile ? 12 : 16 } }}
        >
          {hasWins && (
            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
              padding: '8px 12px', backgroundColor: '#262626', borderRadius: 6,
              alignItems: 'center',
            }}>
              <TrophyOutlined style={{ color: '#ff9f1a', fontSize: 14 }} />
              {sorted.filter(([, v]) => v > 0).map(([name, wins], i) => (
                <Tag key={name} color={i === 0 ? 'gold' : 'default'} style={{ margin: 0, fontWeight: 600, fontSize: 12 }}>
                  {name}: {wins}V
                </Tag>
              ))}
            </div>
          )}

          <Row gutter={[12, 12]}>
            {pairs.map(({ home, away }) => {
              const homeName = home.teamName || `Time ${home.teamIndex}`;
              const awayName = away.teamName || `Time ${away.teamIndex}`;
              const homePlayers = home.playerNames?.join(', ') || 'Nenhum jogador';
              const awayPlayers = away.playerNames?.join(', ') || 'Nenhum jogador';

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={`${home.teamIndex}-${away.teamIndex}`}>
                  <div
                    onClick={() => openScoreboard(court.name, home.teamIndex, away.teamIndex)}
                    style={{
                      backgroundColor: 'var(--primary)',
                      borderRadius: 8,
                      padding: 12,
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid var(--primary)',
                    }}
                  >
                    <Space orientation="vertical" size={8} style={{ width: '100%', textAlign: 'center' }}>
                      <div>
                        <Text strong style={{ color: '#000', fontSize: 18 }}>{homeName}</Text>
                        <Text style={{ color: '#000', fontSize: 14, display: 'block' }}>{homePlayers}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: '#000' }} />
                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>vs</Text>
                        <div style={{ flex: 1, height: 1, backgroundColor: '#000' }} />
                      </div>
                      <div>
                        <Text strong style={{ color: '#000', fontSize: 18 }}>{awayName}</Text>
                        <Text style={{ color: '#000', fontSize: 14, display: 'block' }}>{awayPlayers}</Text>
                      </div>
                    </Space>
                  </div>
                </Col>
              );
            })}
          </Row>

          {court.matches?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: 14 }}>Partidas realizadas:</Text>
              {court.matches.map((match: any, idx: number) => (
                <div key={idx} style={{
                  marginTop: 8, padding: '8px 12px', backgroundColor: '#262626',
                  borderRadius: 6, border: '1px solid #333', display: 'flex',
                  justifyContent: 'space-between', color: '#ccc', fontSize: 13,
                }}>
                  <span>{match.homeTeamName} vs {match.awayTeamName}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    {match.homeScore} x {match.awayScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </>
    );
  };

  const renderCourtSelection = () => (
    <div style={{ textAlign: 'center', marginTop: isMobile ? 40 : 80 }}>
      <Title level={3} style={{ color: 'var(--primary)', marginBottom: 32 }}>
        Selecione a quadra
      </Title>
      <Row gutter={[16, 16]} justify="center">
        {details.courts.map((court: any) => (
          <Col xs={24} sm={12} key={court.name}>
            <Button
              block
              size="large"
              onClick={() => setSelectedCourt(court.name)}
              style={{
                height: isMobile ? 80 : 120,
                fontSize: isMobile ? 20 : 28,
                fontWeight: 'bold',
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TeamOutlined style={{ fontSize: isMobile ? 24 : 32, marginBottom: 8 }} />
              {court.name}
            </Button>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <div style={{
      padding: isMobile ? 8 : 'clamp(12px, 2vw, 24px)',
      maxWidth: 1400,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <Title level={2} style={{ color: 'var(--primary)', marginBottom: 24, fontSize: 'clamp(20px, 4vw, 28px)' }}>
        <TeamOutlined style={{ marginRight: 12 }} />
        {details.sessionDate || details.dateFormatted || 'Sessão de Times'}
        {details.sessionTime && <span style={{ fontSize: 16, color: '#aaa', marginLeft: 8 }}>às {details.sessionTime}</span>}
      </Title>

      {!selectedCourt && details.courts.length > 1 ? (
        renderCourtSelection()
      ) : (
        details.courts
          .filter((c: any) => c.name === (selectedCourt || details.courts[0]?.name))
          .map((court: any) => <div key={court.name}>{renderCourtContent(court)}</div>)
      )}

      {showScoreboard && scoreboardData && (
        <ScoreboardModal
          visible={showScoreboard}
          onClose={() => setShowScoreboard(false)}
          championshipId=""
          matchId=""
          homeTeamIndex={scoreboardData.homeTeam}
          awayTeamIndex={scoreboardData.awayTeam}
          generationSessionId={sessionId}
          onSave={handleSaveFriendly}
          onSuccess={() => setShowScoreboard(false)}
          homeTeamName={
            details.courts
              .find((c: any) => c.name === scoreboardData.courtName)
              ?.teams.find((t: any) => t.teamIndex === scoreboardData.homeTeam)
              ?.teamName || `Time ${scoreboardData.homeTeam}`
          }
          awayTeamName={
            details.courts
              .find((c: any) => c.name === scoreboardData.courtName)
              ?.teams.find((t: any) => t.teamIndex === scoreboardData.awayTeam)
              ?.teamName || `Time ${scoreboardData.awayTeam}`
          }
          setsToWin={details.setsToWin || 1}
          pointsPerSet={details.pointsPerSet || 12}
          sportType={sportType}
        />
      )}
    </div>
  );
};
