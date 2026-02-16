import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/api';
import { CreateAgentRequest } from '@/types';
import { toast } from 'react-toastify';

export const useSessions = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  outputType?: string;
  search?: string;
}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sessions', params],
    queryFn: () => sessionsApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateAgentRequest) => sessionsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success('Agent creation started!');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Failed to create agent');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.cancel(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      toast.success('Session cancelled');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Failed to cancel session');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success('Session deleted');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Failed to delete session');
    },
  });

  return {
    ...query,
    createSession: createMutation.mutate,
    cancelSession: cancelMutation.mutate,
    deleteSession: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useSession = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsApi.get(sessionId!),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Refetch every 2 seconds if session is in progress
      return status && ['pending', 'clarifying', 'designing', 'implementing', 'packaging'].includes(status)
        ? 2000
        : false;
    },
  });
};

export const useSessionStats = () => {
  return useQuery({
    queryKey: ['session-stats'],
    queryFn: sessionsApi.getStats,
  });
};
