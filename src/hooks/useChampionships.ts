import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import type {
  ChampionshipSummary,
  ChampionshipDetails,
  StandingEntry,
  MatchDetails
} from '../components/types';

export const useChampionships = (championshipId?: string) => {
  const queryClient = useQueryClient();

  const useList = () =>
    useQuery<ChampionshipSummary[]>({
      queryKey: ['championships'],
      queryFn: () => http.get('/championships').then(res => res.data),
    });

  const useDetails = () =>
    useQuery<ChampionshipDetails>({
      queryKey: ['championship', championshipId],
      queryFn: () => http.get(`/championships/${championshipId}`).then(res => res.data),
      enabled: !!championshipId,
    });

  const useGroupStandings = (groupIndex: number) =>
    useQuery<StandingEntry[]>({
      queryKey: ['championship', championshipId, 'group', groupIndex, 'standings'],
      queryFn: () => http.get(`/championships/${championshipId}/groups/${groupIndex}/standings`).then(res => res.data),
      enabled: !!championshipId && groupIndex > 0,
    });

  const useGroupMatches = (groupIndex: number) =>
    useQuery<MatchDetails[]>({
      queryKey: ['championship', championshipId, 'group', groupIndex, 'matches'],
      queryFn: () => http.get(`/championships/${championshipId}/groups/${groupIndex}/matches`).then(res => res.data),
      enabled: !!championshipId && groupIndex > 0,
    });

  const registerMatchMutation = useMutation({
    mutationFn: ({ matchId, homeScore, awayScore }: { matchId: string; homeScore: number; awayScore: number }) =>
      http.post(`/championships/${championshipId}/matches/result`, { matchId, homeScore, awayScore }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championship', championshipId] });
      queryClient.invalidateQueries({ queryKey: ['championship', championshipId, 'group'] });
    },
  });

  const generateNextStageMutation = useMutation({
    mutationFn: () => http.post(`/championships/${championshipId}/knockout/next`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['championship', championshipId] }),
  });

  const generateThirdPlaceMutation = useMutation({
    mutationFn: () => http.post(`/championships/${championshipId}/knockout/third-place`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['championship', championshipId] }),
  });

  return {
    useList,
    useDetails,
    useGroupStandings,
    useGroupMatches,
    registerMatchResult: registerMatchMutation.mutateAsync,
    isRegistering: registerMatchMutation.isPending,
    generateNextStage: generateNextStageMutation.mutateAsync,
    isGeneratingNext: generateNextStageMutation.isPending,
    generateThirdPlace: generateThirdPlaceMutation.mutateAsync,
    isGeneratingThirdPlace: generateThirdPlaceMutation.isPending,
  };
};
