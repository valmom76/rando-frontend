import { forwardRef, type CSSProperties } from 'react';
import './CourtPosterImage.css';

export interface TeamPlayer {
  id: string | number;
  name: string;
}

export interface PosterTeam {
  teamIndex: number;
  name: string;
  players: TeamPlayer[];
}

interface CourtPosterImageProps {
  courtName: string;
  teams: PosterTeam[];
  sessionDate?: string;
  sessionTime?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  return [0, 2, 4]
    .map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16))
    .join(', ');
};

export const CourtPosterImage = forwardRef<HTMLDivElement, CourtPosterImageProps>(
  ({
    courtName,
    teams,
    sessionDate,
    sessionTime,
    logoUrl,
    primaryColor = '#01ff69',
    secondaryColor = '#020402',
  }, ref) => {
    const normalizedTeams = Array.from({ length: 4 }).map((_, index) => {
      return (
        teams[index] || {
          teamIndex: index,
          name: '',
          players: [],
        }
      );
    });

    return (
      <div
        className="court-image-poster"
        ref={ref}
        style={{
          '--poster-primary': primaryColor,
          '--poster-primary-rgb': hexToRgb(primaryColor),
          '--poster-secondary': secondaryColor,
        } as CSSProperties}
      >
        <div className="court-image-bg" />

        <header className="court-image-header">
          <div className="court-image-line" />
          <h1>{courtName}</h1>
          {(sessionDate || sessionTime) && (
            <div className="court-image-datetime">
              {sessionDate && <span>{sessionDate}</span>}
              {sessionDate && sessionTime && <span> • </span>}
              {sessionTime && <span>{sessionTime}</span>}
            </div>
          )}
        </header>

        <img
          src={logoUrl || '/images/boraver-logo-transparent.png'}
          alt="Escudo do grupo"
          className="court-image-logo"
          onError={(event) => { event.currentTarget.src = '/images/boraver-logo-transparent.png'; }}
        />

        <section className="court-image-layout">
          {normalizedTeams.map((team, index) => (
            <article
              className={`team-poster-card team-slot-${index}`}
              key={`${team.teamIndex}-${index}`}
            >
              <div className="team-poster-title">
                <span>{team.name || `TIME ${index + 1}`}</span>
              </div>

              <div className="team-poster-players">
                {team.players.length > 0 ? (
                  team.players.map((player) => (
                    <div className="team-player-row" key={player.id}>
                      <div className="team-player-icon" />
                      <span className="team-player-name">{player.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="team-player-empty">Sem jogadores</div>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }
);

CourtPosterImage.displayName = 'CourtPosterImage';
