import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTemplateById } from '../../api/templateAPI';

export function useDeleteTemplateById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplateById(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templatesByUser'] });
    },
  });
}
