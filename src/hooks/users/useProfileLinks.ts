import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfileLinksByUserId, updateProfileLinkActive } from '../../api/profileLinksAPI';

export function useGetProfileLinks(userId: string) {
  return useQuery({
    queryKey: ['profileLinks', userId],
    queryFn: () => getProfileLinksByUserId(userId),
    enabled: !!userId,
  });
}

type UpdateProfileLinkPayload = {
  id: string;
  isActive: boolean;
  userId: string;
};

export function useUpdateProfileLinkActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: UpdateProfileLinkPayload) =>
      updateProfileLinkActive(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profileLinks', variables.userId] });
    },
  });
}
