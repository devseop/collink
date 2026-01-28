import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishTemplateById } from '../../api/templateAPI';

type PublishTemplatePayload = {
  userId: string;
  templateId: string;
};

export function usePublishTemplateById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, templateId }: PublishTemplatePayload) =>
      publishTemplateById(userId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templatesByUser'] });
    },
  });
}
