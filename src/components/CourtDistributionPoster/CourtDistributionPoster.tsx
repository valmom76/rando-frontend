import { forwardRef, type CSSProperties } from 'react';
import { authStore } from '../../auth/store';
import { handleGroupLogoError, resolveGroupLogoUrl } from '../../utils/groupLogo';
import './CourtDistributionPoster.css';

export interface PosterTeamInfo {
  teamIndex: number;
  teamName: string;
  avgRating?: number;
  womenCount?: number;
}

export interface PosterCourtAllocation {
  name: string;
  teams: PosterTeamInfo[];
}

interface CourtDistributionPosterProps {
  courts: PosterCourtAllocation[];
  title?: string;
  subtitle?: string;
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  return [0, 2, 4]
    .map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16))
    .join(', ');
};

export const CourtDistributionPoster = forwardRef<
  HTMLDivElement,
  CourtDistributionPosterProps
>(({ courts, title = 'DISTRIBUIÇÃO DAS QUADRAS', subtitle }, ref) => {
  const branding = authStore.get();
  const primaryColor = branding.primaryColor || '#01ff69';
  const secondaryColor = branding.secondaryColor || '#020402';

  return (
    <div
      className="court-poster"
      ref={ref}
      style={{
        '--poster-primary': primaryColor,
        '--poster-primary-rgb': hexToRgb(primaryColor),
        '--poster-secondary': secondaryColor,
      } as CSSProperties}
    >
      <div className="court-poster-bg" />

      <header className="court-poster-header">
        <div className="court-poster-line" />
        <h1>{title}</h1>
        <p>{subtitle || branding.groupName || 'R4NDO'}</p>
      </header>

      <img
        src={resolveGroupLogoUrl(branding.logoUrl)}
        alt="Escudo do grupo"
        className="court-poster-logo"
        onError={handleGroupLogoError}
      />

      <section className="court-poster-grid">
        {courts.map((court, index) => (
          <article className="court-card" key={`${court.name}-${index}`}>
            <div className="court-card-title">
              <span>{court.name}</span>
            </div>

            <div className="court-teams-list">
              {court.teams.length === 0 ? (
                <div className="empty-court">Nenhum time alocado</div>
              ) : (
                court.teams.map((team) => (
                  <div className="court-team-row" key={team.teamIndex}>
                    <div className="team-badge">
                      {team.teamIndex + 1}
                    </div>

                    <div className="team-info">
                      <strong>{team.teamName}</strong>

                      <span>
                        Média: {team.avgRating?.toFixed(1) ?? '-'} · Mulheres:{' '}
                        {team.womenCount ?? '-'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </section>

      <footer className="court-poster-footer">
        {branding.sportType === 'FOOTBALL' ? 'FUTEBOL • TIMES • CAMPOS' : 'VÔLEI • TIMES • QUADRAS'}
      </footer>
    </div>
  );
});

CourtDistributionPoster.displayName = 'CourtDistributionPoster';
