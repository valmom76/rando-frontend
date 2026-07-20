export type Player = {
  id: string;
  name: string;
  sex: 'M' | 'F';
  active: boolean;
}
  
export type Team = {
  teamIndex: number;
  name: string;
  players: Player[];
}

export type PlayerColumns = {
  coluna1: string[];
  coluna2: string[];
  coluna3: string[];
  coluna4: string[];
}

// Props dos componentes
export type PlayerColumnProps = {
  players: string[];
  color: string;
}

export type FileUploadProps = {
  onFileUpload: (file: File, content: string) => void;
}

// Tipo para eventos de arquivo
export type FileEvent = {
  target: {
    files: FileList | File[];
  };
}

export type ChampionshipSummary = {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  teamCount: number;
  groupsCount: number;
  sportType: 'VOLLEYBALL' | 'FOOTBALL';
}

export type ChampionshipResponse = {
  id: string;
  name: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  teamCount: number;
  sportType: 'VOLLEYBALL' | 'FOOTBALL';
  format: string;
  groupsCount?: number;
  teamsPerGroup?: number;
  qualifiedPerGroup?: number;
  matchesType: string;
  status: string;
  generationSessionId?: string;
  defaultSetsToWin?: number;
  startersPerTeam?: number;
  yellowCardsForSuspension?: number;
  redCardSuspensionMatches?: number;
}

export type ChampionshipDetails = {
  championship: ChampionshipResponse;
  teams: ChampionshipTeamInfo[];
  standingsByGroup: Record<number, StandingEntry[]>;
  matchesByGroup: Record<number, MatchDetails[]>;
  leagueStandings: StandingEntry[];
  leagueMatches: MatchDetails[];
  knockoutMatches: MatchDetails[];
}

export type ChampionshipTeamInfo = {
  teamIndex: number;
  groupIndex: number | null;
  seed: number;
  initialScore: number;
}

export type StandingEntry = {
  teamIndex: number;
  groupIndex?: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDifference: number;
  teamName?: string;
  setsWon: number;
  setsLost: number;
  setsDifference: number;
}

export interface MatchDetails {
  matchId: string;
  groupIndex: number | null;
  round: number;
  homeTeamIndex: number;
  awayTeamIndex: number;
  homeScore: number;
  awayScore: number;
  played: boolean;
  winnerTeamIndex: number | null;
  generationSessionId?: string;
  stage?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  setsToWin?: number;
  pointsPerSet?: number;
  tieBreakPoints?: number;
  homeSetsWon: number;
  awaySetsWon: number;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
}
