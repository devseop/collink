import { useQuery } from '@tanstack/react-query';
import { getTemplatesByUserId } from '../../api/templateAPI';

export function useGetTemplatesByUserId(userId: string) {
  return useQuery({
    queryKey: ['templatesByUser', userId],
    queryFn: () => getTemplatesByUserId(userId),
    enabled: !!userId && userId !== '',
  });
}
