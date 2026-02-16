import { useQuery } from '@tanstack/react-query';
import { examplesApi } from '@/api';

export const useExamples = () => {
  return useQuery({
    queryKey: ['examples'],
    queryFn: examplesApi.list,
    staleTime: Infinity, // Examples don't change often
  });
};

export const useExample = (id: string | undefined) => {
  return useQuery({
    queryKey: ['example', id],
    queryFn: () => examplesApi.get(id!),
    enabled: !!id,
    staleTime: Infinity,
  });
};
