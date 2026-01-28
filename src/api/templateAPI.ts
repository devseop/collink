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

type CustomTemplateRow = {
  id: string;
  user_id: string;
  background_image_url: string | null;
  background_color: string | null;
  is_background_colored: boolean | null;
  template_thumbnail?: string | null;
  created_at?: string;
  is_published?: boolean | null;
  category?: Category | null;
  animation_type?: 'default' | 'spread' | 'collage' | null;
};

type CustomTemplateItemRow = {
  id: string;
  template_id: string;
  type: 'image' | 'text';
  pos_x: number;
  pos_y: number;
  rotation?: number | null;
  z_index?: number | null;
  order_index?: number | null;
  image_url?: string | null;
  width?: number | null;
  height?: number | null;
  scale_percent?: number | null;
  text_content?: string | null;
  font_size?: number | null;
  font_weight?: number | null;
  font_family?: string | null;
  font_color?: string | null;
  link_url?: string | null;
  link_description?: string | null;
  has_link?: boolean | null;
  text_decoration?: string | null;
};

export type CustomTemplatePayload = {
  userId: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  isBackgroundColored?: boolean;
  thumbnailUrl?: string;
  items: TemplateItem[];
  customTemplateId: string;
  isPublished?: boolean;
  sourceTemplateId?: string | null;
  category?: Category | null;
  animationType?: 'default' | 'spread' | 'collage';
};

const getTextDecorationValue = (options?: { underline?: boolean; strikethrough?: boolean }) => {
  const parts = [];
  if (options?.underline) parts.push('underline');
  if (options?.strikethrough) parts.push('line-through');
  return parts.join(' ') || null;
};

export async function createCustomTemplate(payload: CustomTemplatePayload) {
  const { error: unpublishError } = await supabase
    .from('custom_templates')
    .update({ is_published: false })
    .eq('user_id', payload.userId);

  if (unpublishError) {
    throw new Error(`Failed to unpublish previous templates: ${unpublishError?.message ?? 'Unknown error'}`);
  }

  const { data, error } = await supabase
    .from('custom_templates')
    .insert({
      user_id: payload.userId,
      id: payload.customTemplateId,
      background_image_url: payload.backgroundImageUrl ?? null,
      background_color: payload.backgroundColor ?? null,
      is_background_colored: payload.isBackgroundColored ?? false,
      template_thumbnail: payload.thumbnailUrl ?? null,
      is_published: payload.isPublished ?? false,
      category: payload.category ?? null,
      animation_type: payload.animationType ?? 'default',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create custom template: ${error?.message ?? 'Unknown error'}`);
  }

  if (payload.items?.length) {
    const itemsToInsert = payload.items.map((item, index) => ({
      template_id: payload.customTemplateId,
      type: item.imageUrl ? 'image' : 'text',
      pos_x: item.coordinates?.x ?? 0,
      pos_y: item.coordinates?.y ?? 0,
      rotation: item.rotation ?? 0,
      order_index: item.index ?? index,
      image_url: item.imageUrl ?? null,
      width: item.size?.width ?? null,
      height: item.size?.height ?? null,
      scale_percent: item.scalePercent ?? null,
      text_content: item.text ?? null,
      font_size: item.font?.size ?? null,
      font_weight: item.font?.weight ?? null,
      font_family: item.font?.family ?? null,
      font_color: item.font?.color ?? null,
      link_url: item.linkUrl ?? null,
      link_description: item.linkDescription ?? null,
      has_link: item.hasLink ?? null,
      text_decoration: getTextDecorationValue({
        underline: item.font?.decoration?.includes('underline'),
        strikethrough: item.font?.decoration?.includes('line-through'),
      }),
    }));

    const { error: insertItemsError } = await supabase
      .from('custom_template_items')
      .insert(itemsToInsert);

    if (insertItemsError) {
      throw new Error(`Failed to create custom template items: ${insertItemsError?.message ?? 'Unknown error'}`);
    }
  }

  return data;
}

export type PublicTemplate = {
  id: string;
  userId: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  isBackgroundColored?: boolean;
  thumbnailUrl?: string;
  items: TemplateItem[];
  isPublished?: boolean;
  category?: Category | null;
  animationType?: 'default' | 'spread' | 'collage';
};

export type UserTemplateSummary = {
  id: string;
  userId: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
  category?: Category | null;
  animationType?: 'default' | 'spread' | 'collage';
  createdAt?: string;
};

export async function getPublishedTemplateByUser(
  userId: string
): Promise<PublicTemplate | null> {
  const { data, error } = await supabase
    .from('custom_templates')
    .select('id, user_id, background_image_url, background_color, is_background_colored, template_thumbnail, is_published, category, animation_type')
    .eq('user_id', userId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<CustomTemplateRow>();

  if (error) {
    throw new Error(`Failed to fetch custom template: ${error?.message ?? 'Unknown error'}`);
  }

  if (!data) {
    return null;
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('custom_template_items')
    .select('*')
    .eq('template_id', data.id)
    .order('order_index', { ascending: true });

  if (itemsError) {
    throw new Error(`Failed to fetch template items: ${itemsError?.message ?? 'Unknown error'}`);
  }

  const items: TemplateItem[] = (itemsData ?? []).map((item: CustomTemplateItemRow) => ({
    imageUrl: item.image_url ?? undefined,
    text: item.text_content ?? undefined,
    hasLink: item.has_link ?? undefined,
    linkUrl: item.link_url ?? undefined,
    linkDescription: item.link_description ?? undefined,
    index: item.order_index ?? undefined,
    coordinates: { x: item.pos_x ?? 0, y: item.pos_y ?? 0 },
    size:
      item.width != null && item.height != null
        ? {
            width: item.width,
            height: item.height,
          }
        : undefined,
    scalePercent: item.scale_percent ?? undefined,
    font: item.type === 'text'
      ? {
          size: item.font_size ?? 18,
          weight: item.font_weight ?? 600,
          color: item.font_color ?? '#000000',
          family: item.font_family ?? 'classic',
          decoration: item.text_decoration as
            | 'underline'
            | 'line-through'
            | 'none'
            | 'underline line-through'
            | undefined,
        }
      : undefined,
    rotation: item.rotation ?? 0,
  }));

  return {
    id: data.id,
    userId: data.user_id,
    backgroundImageUrl: data.background_image_url ?? undefined,
    backgroundColor: data.background_color ?? undefined,
    isBackgroundColored: data.is_background_colored ?? undefined,
    thumbnailUrl: data.template_thumbnail ?? undefined,
    animationType: data.animation_type ?? 'default',
    items,
    isPublished: data.is_published ?? undefined,
    category: data.category ?? undefined,
  };
}

export async function getTemplatesByUserId(userId: string): Promise<UserTemplateSummary[]> {
  const { data, error } = await supabase
    .from('custom_templates')
    .select('id, user_id, template_thumbnail, is_published, created_at, category, animation_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<CustomTemplateRow[]>();

  if (error) {
    throw new Error(`Failed to fetch user templates: ${error?.message ?? 'Unknown error'}`);
  }

  return (data ?? []).map((template) => ({
    id: template.id,
    userId: template.user_id,
    thumbnailUrl: template.template_thumbnail ?? undefined,
    isPublished: template.is_published ?? undefined,
    category: template.category ?? undefined,
    animationType: template.animation_type ?? 'default',
    createdAt: template.created_at ?? undefined,
  }));
}

export async function deleteTemplateById(templateId: string) {
  const { error: itemsError } = await supabase
    .from('custom_template_items')
    .delete()
    .eq('template_id', templateId);

  if (itemsError) {
    throw new Error(`Failed to delete template items: ${itemsError?.message ?? 'Unknown error'}`);
  }

  const { error } = await supabase
    .from('custom_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to delete template: ${error?.message ?? 'Unknown error'}`);
  }
}

export async function publishTemplateById(userId: string, templateId: string) {
  const { error: unpublishError } = await supabase
    .from('custom_templates')
    .update({ is_published: false })
    .eq('user_id', userId);

  if (unpublishError) {
    throw new Error(`Failed to unpublish templates: ${unpublishError?.message ?? 'Unknown error'}`);
  }

  const { error } = await supabase
    .from('custom_templates')
    .update({ is_published: true })
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to publish template: ${error?.message ?? 'Unknown error'}`);
  }
}
