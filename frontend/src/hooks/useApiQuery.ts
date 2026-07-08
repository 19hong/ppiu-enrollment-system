'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useApiQuery<TData = any>(
  key: string | string[],
  fetcher: () => Promise<{ data: TData }>,
  options?: any
) {
  return useQuery<TData>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await fetcher();
      return response.data;
    },
    ...options,
  });
}

export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData }>,
  options?: any
) {
  const queryClient = useQueryClient();

  return useMutation<TData, any, TVariables>({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);
      return response.data;
    },
    ...options,
  });
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return (keys: string[][]) => {
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
}
