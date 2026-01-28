import { useQuery } from '@tanstack/react-query';
import { getTemplateById } from '../../api/templateAPI';

export function useGetTemplateById(templateId?: string) {
  return useQuery({
    queryKey: ['templateById', templateId],
    queryFn: () => getTemplateById(templateId as string),
    enabled: !!templateId,
  });
}
