import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProfileLink,
  deleteProfileLink,
  getProfileLinksByUserId,
  updateProfileLinkActive,
  updateProfileLinkUrl,
} from '../../api/profileLinksAPI';

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

type UpdateProfileLinkUrlPayload = {
  id: string;
  url: string;
  userId: string;
};

export function useUpdateProfileLinkUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, url }: UpdateProfileLinkUrlPayload) =>
      updateProfileLinkUrl(id, url),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profileLinks', variables.userId] });
    },
  });
}

type CreateProfileLinkPayload = {
  userId: string;
  type: Parameters<typeof createProfileLink>[1];
  url: string;
};

export function useCreateProfileLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, type, url }: CreateProfileLinkPayload) =>
      createProfileLink(userId, type, url),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profileLinks', variables.userId] });
    },
  });
}

type DeleteProfileLinkPayload = {
  id: string;
  userId: string;
};

export function useDeleteProfileLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteProfileLinkPayload) => deleteProfileLink(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profileLinks', variables.userId] });
    },
  });
}
