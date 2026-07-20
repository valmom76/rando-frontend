import React from 'react';

interface Props {
  players: string[];
  pot: 1 | 2 | 3 | 4;
  compact?: boolean;
  maxTeams?: number;
}

const PlayerColumn: React.FC<Props> = ({
  players,
  pot,
  compact = false,
  maxTeams = 8
}) => {
  const potLabel = `POTE ${pot}`;
  const potVar = `var(--pot-${pot})`;
  const dense = players.length > 8;

  if (compact) {
    return (
      <div className="pc-compact ui-card--inner" style={{ borderLeft: `3px solid ${potVar}` }}>
        <div className="pc-header">
          <div className="pc-tag" style={{ backgroundColor: potVar }}>
            {potLabel}
          </div>
          <span className="pc-count ui-badge">{players.length}</span>
        </div>

        <div className={`pc-list ${dense ? 'pc-list--dense' : ''}`}>
          {players.map((player, index) => {
            const isUsed = index < maxTeams;
            return (
              <div
                key={index}
                className={`pc-item ${isUsed ? 'pc-item--used' : 'pc-item--unused'}`}
              >
                <span className="pc-name">{player}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Se um dia quiser a versão não-compact, reaproveita a mesma base.
  return (
    <div className="pc-compact ui-card--inner" style={{ borderTop: `3px solid ${potVar}` }}>
      <div className="pc-header">
        <div className="pc-tag" style={{ backgroundColor: potVar }}>
          {potLabel}
        </div>
        <span className="pc-count ui-badge">{players.length}</span>
      </div>

      <div className={`pc-list ${dense ? 'pc-list--dense' : ''}`}>
        {players.map((player, index) => {
          const isUsed = index < maxTeams;
          return (
            <div
              key={index}
              className={`pc-item ${isUsed ? 'pc-item--used' : 'pc-item--unused'}`}
            >
              <span className="pc-name">{player}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerColumn;