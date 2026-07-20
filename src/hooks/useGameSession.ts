import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';

export const useGameSession = () => {
  const queryClient = useQueryClient();

  const { data: isActive = false, isLoading, refetch } = useQuery({
    queryKey: ['gameSessionActive'],
    queryFn: () => http.get<boolean>('/game-sessions/active').then(res => res.data),
  });

  const startMutation = useMutation({
    mutationFn: (teamGenerationId: string) => http.post('/game-sessions/start', { teamGenerationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSessionActive'] });
    },
  });

  const endMutation = useMutation({
    mutationFn: () => http.post('/game-sessions/end'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSessionActive'] });
    },
  });

  return {
    isActive,
    isLoading,
    refetch,
    startSession: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    endSession: endMutation.mutateAsync,
    isEnding: endMutation.isPending,
  };
};