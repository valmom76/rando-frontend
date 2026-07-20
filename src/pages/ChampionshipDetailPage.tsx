import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Button, Spin, Alert, message, Card, Modal } from 'antd';
import { CloseOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useChampionships } from '../hooks/useChampionships';
import { GroupStandings } from '../components/championship/GroupStandings';
import { GroupMatches } from '../components/championship/GroupMatches';
import { KnockoutBracket } from '../components/championship/KnockoutBracket';
import { FootballDisciplinePanel } from '../components/championship/FootballDisciplinePanel';
import { FootballScorersPanel } from '../components/championship/FootballScorersPanel';

const getGroupLetter = (index: number): string => {
  return String.fromCharCode(64 + index);
};

const ChampionshipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    useDetails,
    generateNextStage,
    isGeneratingNext,
    generateThirdPlace,
    isGeneratingThirdPlace,
  } = useChampionships(id);

  const { data, isLoading, error, refetch } = useDetails();

  const [activeTab, setActiveTab] = useState('groups');
  const [fullscreenGroups, setFullscreenGroups] = useState(false);

  if (isLoading) return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;
  if (error) return <Alert message="Erro ao carregar detalhes" type="error" style={{ margin: 16 }} />;
  if (!data) return null;
  const {
    championship,
    standingsByGroup,
    matchesByGroup,
    leagueStandings = [],
    leagueMatches = [],
    knockoutMatches,
  } = data;

  const isFootball = championship.sportType === 'FOOTBALL';
  const isSingleSet = isFootball || championship.defaultSetsToWin === 1;

  const isKnockoutFormat = championship.format === 'KNOCKOUT';
  const isLeagueFormat = championship.format === 'LEAGUE';
  const visibleActiveTab = ['discipline', 'scorers'].includes(activeTab) && isFootball
    ? activeTab
    : isKnockoutFormat
      ? 'knockout'
      : isLeagueFormat && !['league-standings', 'league-matches'].includes(activeTab)
        ? 'league-standings'
        : activeTab;

  const isGroupStageComplete = () => {
    const groups = Object.keys(matchesByGroup);
    return groups.length > 0 && groups.every((g) => matchesByGroup[parseInt(g)].every((m) => m.played));
  };

  const handleNextStage = async () => {
    try {
      await generateNextStage();
      await refetch();
      message.success('Próxima fase gerada');
    } catch {
      message.error('Erro ao gerar próxima fase');
    }
  };

  const handleThirdPlace = async () => {
    try {
      await generateThirdPlace();
      await refetch();
      message.success('Disputa de 3º lugar gerada');
    } catch {
      message.error('Erro ao gerar 3º lugar');
    }
  };

  const getCurrentKnockoutStage = () => {
    if (knockoutMatches.length === 0) return null;
    if (knockoutMatches.some((m) => m.stage === 'QUARTER')) return 'QUARTER';
    if (knockoutMatches.some((m) => m.stage === 'SEMI')) return 'SEMI';
    if (knockoutMatches.some((m) => m.stage === 'FINAL')) return 'FINAL';
    return null;
  };

  const isCurrentStageComplete = () => {
    const stage = getCurrentKnockoutStage();
    if (!stage) return false;
    const stageMatches = knockoutMatches.filter((m) => m.stage === stage);
    return stageMatches.length > 0 && stageMatches.every((m) => m.played);
  };

  const canGenerateNextStage = () => {
    if (knockoutMatches.length === 0) return false;
    const currentStage = getCurrentKnockoutStage();
    if (currentStage === 'FINAL') return false;
    return isCurrentStageComplete();
  };

  const getNextStageButtonText = () => {
    const currentStage = getCurrentKnockoutStage();
    if (currentStage === 'QUARTER') return 'Gerar Semifinais';
    if (currentStage === 'SEMI') return 'Gerar Final';
    return 'Gerar Próxima Fase';
  };

  const renderGroupsGrid = () => {
    const groups = Object.entries(standingsByGroup);
    const qualifiedCount = championship.qualifiedPerGroup ?? 0;

    if (groups.length === 0) {
      return (
        <Card>
          <p>Nenhum grupo encontrado. Os times ainda não foram distribuídos.</p>
        </Card>
      );
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          width: '100%',
        }}
      >
        {groups.map(([groupIdx, standings]) => {
          const groupIndex = parseInt(groupIdx);
          const groupMatches = matchesByGroup[groupIndex] || [];
          const isGroupComplete = groupMatches.length > 0 && groupMatches.every((m) => m.played);
          return (
            <div key={groupIdx} style={{ minWidth: 0 }}>
              <GroupStandings
                standings={standings}
                groupName={`Grupo ${getGroupLetter(groupIndex)}`}
                qualifiedCount={qualifiedCount}
                isGroupComplete={isGroupComplete}
                isSingleSet={isSingleSet}
                sportType={championship.sportType}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderLeagueStandings = () => {
    if (leagueStandings.length === 0) {
      return (
        <Card>
          <p>A classificação da liga ainda não está disponível.</p>
        </Card>
      );
    }

    const leagueComplete = leagueMatches.length > 0
      && leagueMatches.every((match) => match.played);

    return (
      <>
        {leagueComplete && leagueStandings[0] && (
          <Alert
            type="success"
            showIcon
            message={`Campeão: ${leagueStandings[0].teamName || `Time ${leagueStandings[0].teamIndex}`}`}
            description="Critérios: pontos, vitórias, saldo de gols e gols marcados."
            style={{ marginBottom: 16 }}
          />
        )}
        <GroupStandings
          standings={leagueStandings}
          groupName="Classificação Geral"
          qualifiedCount={leagueComplete ? 1 : 0}
          isGroupComplete={leagueComplete}
          isSingleSet
          sportType={championship.sportType}
        />
      </>
    );
  };

  const renderLeagueMatches = () => {
    if (leagueMatches.length === 0) {
      return (
        <Card>
          <p>Nenhuma partida da liga foi gerada.</p>
        </Card>
      );
    }

    return (
      <GroupMatches
        matches={leagueMatches}
        championshipId={id!}
        groupName={championship.matchesType === 'HOME_AND_AWAY'
          ? 'Turno e Returno'
          : 'Turno Único'}
        sportType={championship.sportType}
        preserveOrder
        onMatchPlayed={refetch}
      />
    );
  };

  const renderMatches = () => {
    const groups = Object.entries(matchesByGroup);
    if (groups.length === 0) {
      return (
        <Card>
          <p>Nenhuma partida disponível.</p>
        </Card>
      );
    }
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          width: '100%',
        }}
      >
        {groups.map(([groupIdx, matches]) => (
          <div key={groupIdx} style={{ minWidth: 0 }}>
            <GroupMatches
              matches={matches}
              championshipId={id!}
              groupName={`Grupo ${getGroupLetter(parseInt(groupIdx))}`}
              sportType={championship.sportType}
              onMatchPlayed={refetch}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderKnockoutContent = () => (
    <>
      {knockoutMatches.length === 0 && !isKnockoutFormat && isGroupStageComplete() && (
        <Button
          onClick={handleNextStage}
          loading={isGeneratingNext}
          size="large"
          block
          style={{
            marginBottom: 16,
            backgroundColor: 'var(--primary)',
            borderColor: 'var(--primary)',
            color: '#000',
            fontWeight: 'bold',
            height: 48,
            fontSize: 16,
          }}
        >
          Gerar Fase Eliminatória
        </Button>
      )}
      {knockoutMatches.length > 0 && canGenerateNextStage() && championship.status !== 'FINISHED' && (
        <Button
          onClick={handleNextStage}
          loading={isGeneratingNext}
          size="large"
          block
          style={{
            marginBottom: 16,
            backgroundColor: 'var(--primary)',
            borderColor: 'var(--primary)',
            color: '#000',
            fontWeight: 'bold',
            height: 48,
            fontSize: 16,
          }}
        >
          {getNextStageButtonText()}
        </Button>
      )}
      {knockoutMatches.length > 0 && (
        <>
          <div style={{ overflowX: 'auto', overflowY: 'hidden', maxWidth: '100%' }}>
            <KnockoutBracket
              matches={knockoutMatches}
              championshipId={id!}
              sportType={championship.sportType}
              onMatchPlayed={refetch}
            />
          </div>
          {knockoutMatches.some((m) => m.stage === 'SEMI' && m.played) &&
            !knockoutMatches.some((m) => m.stage === 'THIRD_PLACE') && (
              <Button
                onClick={handleThirdPlace}
                loading={isGeneratingThirdPlace}
                size="large"
                block
                style={{
                  marginTop: 16,
                  backgroundColor: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  color: '#000',
                  fontWeight: 'bold',
                  height: 48,
                  fontSize: 16,
                }}
              >
                Gerar Disputa de 3º Lugar
              </Button>
            )}
        </>
      )}
      {knockoutMatches.length === 0 && isKnockoutFormat && (
        <Card>
          <p>Nenhuma partida eliminatória encontrada. Verifique se o campeonato foi configurado corretamente.</p>
        </Card>
      )}
    </>
  );

  const competitionTabItems = isKnockoutFormat
    ? [
        {
          key: 'knockout',
          label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Mata-Mata</span>,
          children: renderKnockoutContent(),
        },
      ]
    : isLeagueFormat
      ? [
          {
            key: 'league-standings',
            label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Classificação</span>,
            children: renderLeagueStandings(),
          },
          {
            key: 'league-matches',
            label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Partidas</span>,
            children: renderLeagueMatches(),
          },
        ]
      : [
        {
          key: 'groups',
          label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Grupos</span>,
          children: renderGroupsGrid(),
        },
        {
          key: 'matches',
          label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Partidas</span>,
          children: renderMatches(),
        },
        {
          key: 'knockout',
          label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Mata-Mata</span>,
          children: renderKnockoutContent(),
        },
      ];

  const tabItems = [
    ...competitionTabItems,
    ...(isFootball
      ? [
          {
            key: 'scorers',
            label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Artilharia</span>,
            children: <FootballScorersPanel championshipId={id!} />,
          },
          {
            key: 'discipline',
            label: <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Disciplina</span>,
            children: <FootballDisciplinePanel championshipId={id!} />,
          },
        ]
      : []),
  ];

  return (
    <div style={{
      padding: 'clamp(8px, 2vw, 24px)',
      maxWidth: 1400,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h1 style={{
          fontSize: 'clamp(22px, 5vw, 48px)',
          color: 'var(--primary)',
          margin: 0,
          wordBreak: 'break-word',
          flex: 1,
        }}>
          {championship.name}
        </h1>
        {!isKnockoutFormat && (
          <Button
            icon={<FullscreenOutlined />}
            onClick={() => setFullscreenGroups(true)}
            style={{
              fontSize: 'clamp(13px, 2vw, 16px)',
              padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2.5vw, 24px)',
              height: 'clamp(36px, 8vw, 44px)',
              fontWeight: 'bold',
              borderColor: 'var(--primary)',
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            Tela Cheia
          </Button>
        )}
      </div>

      <Tabs
        activeKey={visibleActiveTab}
        items={tabItems}
        onChange={setActiveTab}
        size="large"
        tabBarStyle={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}
      />

      {/* Modal de tela cheia */}
      {!isKnockoutFormat && (
        <Modal
          title={
            <div style={{
              fontSize: 'clamp(18px, 4vw, 32px)',
              fontWeight: 700,
              textAlign: 'center',
              color: '#4CAF50',
              width: '100%',
              paddingBottom: 8,
            }}>
              Classificação
            </div>
          }
          open={fullscreenGroups}
          onCancel={() => setFullscreenGroups(false)}
          footer={null}
          width="100vw"
          style={{ top: 0, maxWidth: '100vw', height: '100vh', padding: 0, overflow: 'hidden' }}
          styles={{
            body: {
              height: 'calc(100vh - 55px)',
              padding: 16,
              overflow: 'auto',
            },
          }}
          closeIcon={<CloseOutlined style={{ color: 'var(--primary)' }} />}
        >
          {isLeagueFormat ? renderLeagueStandings() : renderGroupsGrid()}
        </Modal>
      )}
    </div>
  );
};

export default ChampionshipDetailsPage;
