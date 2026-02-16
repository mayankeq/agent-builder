import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api';
import { User } from '@/types';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getMe,
    retry: false,
    staleTime: Infinity,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
    onError: () => {
      toast.error('Logout failed');
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
    onError: () => {
      toast.error('Logout failed');
    },
  });

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
    logout: logoutMutation.mutate,
    logoutAll: logoutAllMutation.mutate,
  };
};
