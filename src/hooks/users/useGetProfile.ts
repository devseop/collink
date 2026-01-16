import { getProfile, getProfileByUsername } from '../../api/profileAPI';
import { useQuery } from '@tanstack/react-query';

export function useGetProfile(userId: string) {
  
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });
}

export function useGetProfileByUsername(username: string) {
  return useQuery({
    queryKey: ['profileByUsername', username],
    queryFn: () => getProfileByUsername(username),
    enabled: !!username,
  });
}