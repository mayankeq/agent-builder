import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '@/api';
import { toast } from 'react-toastify';

export const useApiKeys = () => {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['api-key-status'],
    queryFn: apiKeysApi.getStatus,
  });

  const addMutation = useMutation({
    mutationFn: (apiKey: string) => apiKeysApi.add(apiKey),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-key-status'] });
      toast.success(data.message || 'API key added successfully');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Failed to add API key');
    },
  });

  const validateMutation = useMutation({
    mutationFn: apiKeysApi.validate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-key-status'] });
      if (data.valid) {
        toast.success('API key is valid');
      } else {
        toast.error('API key is invalid');
      }
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Failed to validate API key');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiKeysApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-key-status'] });
      toast.success(data.message || 'API key deleted');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Failed to delete API key');
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    addApiKey: addMutation.mutate,
    validateApiKey: validateMutation.mutate,
    deleteApiKey: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isValidating: validateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
