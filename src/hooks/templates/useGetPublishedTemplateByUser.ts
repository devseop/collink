import { getPublishedTemplateByUser } from '../../api/templateAPI';
import { useQuery } from '@tanstack/react-query';

export function useGetPublishedTemplateByUser(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['publishedTemplate', userId],
    queryFn: () => getPublishedTemplateByUser(userId),
    enabled: !!userId && userId !== '' && enabled,
  });
}
