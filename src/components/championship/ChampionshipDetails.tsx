import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Button, Spin, Alert, message, Card } from 'antd';
import { useChampionships } from '../../hooks/useChampionships';
import { GroupStandings } from '../../components/championship/GroupStandings';
import { GroupMatches } from '../../components/championship/GroupMatches';
import { KnockoutBracket } from '../../components/championship/KnockoutBracket';

const ChampionshipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { useDetails, generateNextStage, isGeneratingNext, generateThirdPlace, isGeneratingThirdPlace } = useChampionships(id);
  const { data, isLoading, error, refetch } = useDetails();

  const [activeTab, setActiveTab] = useState('groups');

  if (isLoading) return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;
  if (error) return <Alert message="Erro ao carregar detalhes" type="error" style={{ margin: 24 }} />;
  if (!data) return null;

  const { championship, standingsByGroup, matchesByGroup, knockoutMatches } = data;

  // Verifica se o campeonato é de 1 set (para ocultar colunas de sets na classificação)
  const isSingleSet = (championship as any).setsToWin === 1;

  const isGroupStageComplete = () => {
    const groups = Object.keys(matchesByGroup);
    return groups.length > 0 && groups.every(g => matchesByGroup[parseInt(g)].every(m => m.played));
  };

  const handleNextStage = async () => {
    try {
      await generateNextStage();
      await refetch();
      message.success('Próxima fase gerada');
    } catch (err) {
      message.error('Erro ao gerar próxima fase');
    }
  };

  const handleThirdPlace = async () => {
    try {
      await generateThirdPlace();
      await refetch();
      message.success('Disputa de 3º lugar gerada');
    } catch (err) {
      message.error('Erro ao gerar 3º lugar');
    }
  };

  const renderGroups = () => {
    const groups = Object.entries(standingsByGroup);
    if (groups.length === 0) {
      return (
        <Card>
          <p>Nenhuma partida foi jogada ainda. A classificação será atualizada após os primeiros resultados.</p>
        </Card>
      );
    }
    const qualifiedCount = championship.qualifiedPerGroup ?? 0;
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
          gap: '16px',
        }}
      >
        {groups.map(([groupIdx, standings]) => {
          const groupIndex = parseInt(groupIdx);
          const groupMatches = matchesByGroup[groupIndex] || [];
          const isGroupComplete = groupMatches.length > 0 && groupMatches.every(m => m.played);
          return (
            <GroupStandings
              key={groupIdx}
              standings={standings}
              groupName={`Grupo ${groupIdx}`}
              qualifiedCount={qualifiedCount}
              isGroupComplete={isGroupComplete}
              isSingleSet={isSingleSet}
            />
          );
        })}
      </div>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
          gap: '16px',
        }}
      >
        {groups.map(([groupIdx, matches]) => (
          <GroupMatches
            key={groupIdx}
            matches={matches}
            championshipId={id!}
            groupName={`Grupo ${groupIdx}`}
            onMatchPlayed={refetch}
          />
        ))}
      </div>
    );
  };

  const tabItems = [
    {
      key: 'groups',
      label: 'Grupos 2',
      children: renderGroups(),
    },
    {
      key: 'matches',
      label: 'Partidas',
      children: renderMatches(),
    },
    {
      key: 'knockout',
      label: 'Mata-Mata',
      children: (
        <>
          {knockoutMatches.length === 0 && isGroupStageComplete() && (
            <Button onClick={handleNextStage} loading={isGeneratingNext} style={{ marginBottom: 16 }}>
              Gerar Fase Eliminatória
            </Button>
          )}
          {knockoutMatches.length > 0 && (
            <>
              <KnockoutBracket matches={knockoutMatches} championshipId={id!} onMatchPlayed={refetch} />
              {knockoutMatches.some(m => m.stage === 'SEMI' && m.played) && !knockoutMatches.some(m => m.stage === 'THIRD_PLACE') && (
                <Button onClick={handleThirdPlace} loading={isGeneratingThirdPlace} style={{ marginTop: 16 }}>
                  Gerar Disputa de 3º Lugar
                </Button>
              )}
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(24px, 6vw, 48px)', color: 'var(--primary)', margin: '0 0 8px 0' }}>
        {championship.name}
      </h1>
      <p style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: '#aaa', margin: '0 0 16px 0' }}>
        Status: {championship.status === 'FINISHED' ? 'Finalizado' : championship.status === 'IN_PROGRESS' ? 'Em andamento' : 'Não iniciado'}
      </p>
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={setActiveTab}
        style={{ overflowX: 'auto' }}
      />
    </div>
  );
};

export default ChampionshipDetailsPage;