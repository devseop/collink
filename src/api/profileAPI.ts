import { supabase } from '../lib/supabaseClient';

export type ProfileRecord = {
  id: string;
  username?: string;
  avatarUrl?: string;
};

export async function getProfile(userId: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', userId)
    .maybeSingle<ProfileRecord>();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data ?? null;
}

export async function createProfile(userId: string): Promise<ProfileRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select('id, username')
    .single<ProfileRecord>();

  if (error || !data) {
    throw new Error(`Failed to create profile: ${error?.message ?? 'Unknown error'}`);
  }

  return data;
}

export async function updateUsername(userId: string, username: string): Promise<ProfileRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId)
    .select('id, username')
    .single<ProfileRecord>();

  if (error || !data) {
    if ((error as { code?: string })?.code === '23505') {
      throw new Error('이미 사용 중인 Username입니다.');
    }

    throw new Error(`Failed to update username: ${error?.message ?? 'Unknown error'}`);
  }

  return data;
}

export async function getProfileByUsername(username: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle<ProfileRecord>();

  if (error) {
    throw new Error(`Failed to fetch profile by username: ${error.message}`);
  }

  return data ?? null;
}
