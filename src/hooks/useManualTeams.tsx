import { useMutation } from '@tanstack/react-query';
import { http } from '../api/http';

interface ManualTeamRequest {
  name: string;
  format: 'GROUPS' | 'KNOCKOUT' | 'LEAGUE';
  groupsCount: number;
  matchesType: 'SINGLE' | 'HOME_AND_AWAY';
  qualifiedPerGroup: number;
  teams: {
    teamIndex: number;
    playerIds: string[];
    groupId: number;
  }[];
  teamNames: Record<number, string>;
  setsToWin: number;
  pointsPerSet: number;
  tieBreakPoints: number;
  startersPerTeam: number;
  yellowCardsForSuspension: number;
  redCardSuspensionMatches: number;
}

interface ManualTeamResponse {
  sessionId: string;
  championshipId: string;
}

export const useManualTeams = () => {
  const saveMutation = useMutation({
    mutationFn: (data: ManualTeamRequest) =>
      http.post<ManualTeamResponse>('/teams/save-manual', data).then(res => res.data),
  });

  return {
    saveManualTeams: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
};
