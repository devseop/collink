import { getProfile, getProfileByUsername } from '../../api/profileAPI';
import { useQuery } from '@tanstack/react-query';

export function useGetProfile(userId: string, enabled = true) {
  
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId && enabled,
  });
}

export function useGetProfileByUsername(username: string, enabled = true) {
  return useQuery({
    queryKey: ['profileByUsername', username],
    queryFn: () => getProfileByUsername(username),
    enabled: !!username && enabled,
  });
}
