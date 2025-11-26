import { supabase } from '../lib/supabaseClient';
import type { DefaultTemplate, TemplateItem, Category } from '../types/templates';

type DefaultTemplateRow = {
  id: string;
  category: DefaultTemplate['category'];
  thumbnail_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  is_background_colored: boolean | null;
  items: DefaultTemplate['items'];
};

export async function getDefaultTemplates(): Promise<DefaultTemplate[]> {
  const { data, error } = await supabase
    .from('default_templates')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch default templates: ${error?.message ?? 'Unknown error'}`);
  }

  return (data ?? []).map((template: DefaultTemplateRow) => ({
    id: template.id,
    category: template.category,
    thumbnailUrl: template.thumbnail_url ?? undefined,
    backgroundImageUrl: template.background_image_url ?? undefined,
    isBackgroundColored: template.is_background_colored ?? undefined,
    backgroundColor: template.background_color ?? undefined,
    items: template.items ?? undefined,
  }));
}

export type CustomTemplatePayload = {
  userId: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  isBackgroundColored?: boolean;
  items: TemplateItem[];
};

export async function createCustomTemplate(payload: CustomTemplatePayload) {
  const customTemplateId = crypto.randomUUID();
  const { data, error } = await supabase
    .from('custom_templates')
    .insert({
      user_id: payload.userId,
      id: customTemplateId,
      background_image_url: payload.backgroundImageUrl ?? null,
      background_color: payload.backgroundColor ?? null,
      is_background_colored: payload.isBackgroundColored ?? false,
      items: payload.items ?? [],
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create custom template: ${error?.message ?? 'Unknown error'}`);
  }

  return data;
}

type CustomTemplateRow = {
  id: string;
  user_id: string;
  background_image_url: string | null;
  background_color: string | null;
  is_background_colored: boolean | null;
  items: TemplateItem[];
  created_at?: string;
};

export type PublicTemplate = {
  id: string;
  userId: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  isBackgroundColored?: boolean;
  items: TemplateItem[];
};

export async function getLatestCustomTemplateByUser(
  userId: string
): Promise<PublicTemplate | null> {
  const { data, error } = await supabase
    .from('custom_templates')
    .select('id, user_id, background_image_url, background_color, is_background_colored, items')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<CustomTemplateRow>();

  if (error) {
    throw new Error(`Failed to fetch custom template: ${error?.message ?? 'Unknown error'}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    backgroundImageUrl: data.background_image_url ?? undefined,
    backgroundColor: data.background_color ?? undefined,
    isBackgroundColored: data.is_background_colored ?? undefined,
    items: data.items ?? [],
  };
}
