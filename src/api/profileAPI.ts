import { supabase } from '../lib/supabaseClient';

export type ProfileRecord = {
  id: string;
  username?: string;
  avatarUrl?: string;
  isUserVisited?: boolean;
};

type RawProfileRecord = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_user_visited: boolean | null;
};

const mapProfileRecord = (record: RawProfileRecord | null): ProfileRecord | null => {
  if (!record) return null;
  return {
    id: record.id,
    username: record.username ?? undefined,
    avatarUrl: record.avatar_url ?? undefined,
    isUserVisited: record.is_user_visited ?? undefined,
  };
};

export async function getProfile(userId: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_user_visited')
    .eq('id', userId)
    .maybeSingle<RawProfileRecord>();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return mapProfileRecord(data);
}

export async function createProfile(userId: string): Promise<ProfileRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select('id, username, avatar_url, is_user_visited')
    .single<RawProfileRecord>();

  if (error || !data) {
    throw new Error(`Failed to create profile: ${error?.message ?? 'Unknown error'}`);
  }

  return mapProfileRecord(data) ?? { id: userId };
}

export async function updateUsername(userId: string, username: string): Promise<ProfileRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId)
    .select('id, username, avatar_url, is_user_visited')
    .single<RawProfileRecord>();

  if (error || !data) {
    if ((error as { code?: string })?.code === '23505') {
      throw new Error('이미 사용 중인 Username입니다.');
    }

    throw new Error(`Failed to update username: ${error?.message ?? 'Unknown error'}`);
  }

  return mapProfileRecord(data) ?? { id: userId };
}

export async function getProfileByUsername(username: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_user_visited')
    .eq('username', username)
    .maybeSingle<RawProfileRecord>();

  if (error) {
    throw new Error(`Failed to fetch profile by username: ${error.message}`);
  }

  return mapProfileRecord(data);
}

export async function updateIsUserVisited(userId: string, isUserVisited: boolean): Promise<ProfileRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_user_visited: isUserVisited })
    .eq('id', userId)
    .select('id, username, avatar_url, is_user_visited')
    .single<RawProfileRecord>();

  if (error || !data) {
    throw new Error(`Failed to update isUserVisited: ${error?.message ?? 'Unknown error'}`);
  }

  return mapProfileRecord(data) ?? { id: userId };
}
