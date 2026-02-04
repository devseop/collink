import { supabase } from '../lib/supabaseClient';

export type ProfileLinkType = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'email';

export type ProfileLink = {
  id: string;
  userId: string;
  type: ProfileLinkType;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProfileLinkRow = {
  id: string;
  user_id: string;
  type: ProfileLinkType;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const mapProfileLink = (row: ProfileLinkRow): ProfileLink => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  url: row.url,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function getProfileLinksByUserId(userId: string): Promise<ProfileLink[]> {
  const { data, error } = await supabase
    .from('profile_links')
    .select('id, user_id, type, url, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .returns<ProfileLinkRow[]>();

  if (error) {
    throw new Error(`Failed to fetch profile links: ${error.message}`);
  }

  return (data ?? []).map(mapProfileLink);
}

export async function updateProfileLinkActive(id: string, isActive: boolean): Promise<ProfileLink> {
  const { data, error } = await supabase
    .from('profile_links')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id, user_id, type, url, is_active, created_at, updated_at')
    .single<ProfileLinkRow>();

  if (error || !data) {
    throw new Error(`Failed to update profile link: ${error?.message ?? 'Unknown error'}`);
  }

  return mapProfileLink(data);
}

export async function updateProfileLinkUrl(id: string, url: string): Promise<ProfileLink> {
  const { data, error } = await supabase
    .from('profile_links')
    .update({ url })
    .eq('id', id)
    .select('id, user_id, type, url, is_active, created_at, updated_at')
    .single<ProfileLinkRow>();

  if (error || !data) {
    throw new Error(`Failed to update profile link: ${error?.message ?? 'Unknown error'}`);
  }

  return mapProfileLink(data);
}

export async function createProfileLink(userId: string, type: ProfileLinkType, url: string): Promise<ProfileLink> {
  const { data, error } = await supabase
    .from('profile_links')
    .insert({ user_id: userId, type, url })
    .select('id, user_id, type, url, is_active, created_at, updated_at')
    .single<ProfileLinkRow>();

  if (error || !data) {
    throw new Error(`Failed to create profile link: ${error?.message ?? 'Unknown error'}`);
  }

  return mapProfileLink(data);
}

export async function deleteProfileLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('profile_links')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete profile link: ${error.message}`);
  }
}
