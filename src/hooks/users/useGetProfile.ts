import { getProfile } from '../../api/profileAPI';
import { useQuery } from '@tanstack/react-query';

export function useGetProfile(userId: string) {
  
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });
}
