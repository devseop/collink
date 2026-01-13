import type { DefaultTemplate } from '../types/templates';
import type { Overlay } from '../types/overlay';
import { computeBaseDimensions, DEFAULT_IMAGE_SIZE, IMAGE_SCALE_PERCENT_MIN } from './overlayMath';
import {
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_TEXT_FONT_WEIGHT,
  FALLBACK_POSITION,
  IMAGE_SCALE_DEFAULT_PERCENT,
} from '../constants/templates';
import { safeRandomUUID } from './random';
import type { TemplateItem } from '../types/templates';

export type EditorInitialState = {
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  isBackgroundColored: boolean;
  overlays: Overlay[];
};

const deriveScalePercentFromSize = (width: number, height: number) => {
  const maxDimension = Math.max(width, height, 1);
  const rawPercent = (maxDimension / DEFAULT_IMAGE_SIZE) * 100;
  return Math.max(IMAGE_SCALE_PERCENT_MIN, Math.round(rawPercent));
};

export const mapTemplateToEditorState = (template: DefaultTemplate | null): EditorInitialState => {
  if (!template) {
    return {
      backgroundImageUrl: null,
      backgroundColor: null,
      isBackgroundColored: false,
      overlays: [],
    };
  }

  const overlays: Overlay[] = [];
  const items = template.items ?? [];

  items.forEach((item) => {
    const basePosition = {
      x: item.coordinates?.x ?? FALLBACK_POSITION.x,
      y: item.coordinates?.y ?? FALLBACK_POSITION.y,
    };

    if (item.imageUrl) {
      const templateWidth = item.size?.width ?? DEFAULT_IMAGE_SIZE;
      const templateHeight = item.size?.height ?? DEFAULT_IMAGE_SIZE;
      const { baseWidth, baseHeight } = computeBaseDimensions(templateWidth, templateHeight);
      const scalePercent = deriveScalePercentFromSize(templateWidth, templateHeight);
      overlays.push({
        id: safeRandomUUID(),
        type: 'image',
        image: item.imageUrl,
        file: null,
        ...basePosition,
        rotation: item.rotation ?? 0,
        baseWidth,
        baseHeight,
        scalePercent,
        linkUrl: item.linkUrl ?? undefined,
      });
      return;
    }

    if (item.text || item.font) {
      overlays.push({
        id: safeRandomUUID(),
        type: 'text',
        text: item.text ?? '',
        fontSize: item.font?.size ?? DEFAULT_TEXT_FONT_SIZE,
        fontWeight: item.font?.weight ?? DEFAULT_TEXT_FONT_WEIGHT,
        fontFamily: item.font?.family ?? DEFAULT_TEXT_FONT_FAMILY,
        rotation: item.rotation ?? 0,
        scalePercent: IMAGE_SCALE_DEFAULT_PERCENT,
        textColor: item.font?.color ?? '#222222',
        boxStyle: 0,
        underline: item.font?.decoration?.includes('underline'),
        strikethrough: item.font?.decoration?.includes('line-through'),
        ...basePosition,
      });
    }
  });

  return {
    backgroundImageUrl: template.backgroundImageUrl ?? null,
    backgroundColor: template.backgroundColor ?? null,
    isBackgroundColored: Boolean(template.isBackgroundColored),
    overlays,
  };
};

export const getTextDecorationValue = (underline?: boolean, strikethrough?: boolean) => {
  const parts = [];
  if (underline) parts.push('underline');
  if (strikethrough) parts.push('line-through');
  return parts.length ? parts.join(' ') : 'none';
};

export const mapOverlayToTemplateItem = (
  overlay: Overlay,
  index: number,
  options?: { imageUrl?: string; linkUrl?: string }
): TemplateItem => {
  const base = {
    index,
    coordinates: { x: overlay.x, y: overlay.y },
  };

  if (overlay.type === 'image') {
    const imageUrl = options?.imageUrl ?? overlay.image;
    const linkUrl = options?.linkUrl;
    return {
      ...base,
      imageUrl,
      linkUrl,
      hasLink: Boolean(linkUrl),
      rotation: overlay.rotation ?? 0,
      size: {
        width: (overlay.baseWidth * overlay.scalePercent) / 100,
        height: (overlay.baseHeight * overlay.scalePercent) / 100,
      },
    };
  }

  return {
    ...base,
    text: overlay.text,
    font: {
      size: overlay.fontSize,
      weight: overlay.fontWeight,
      color: overlay.textColor ?? '#000000',
      family: overlay.fontFamily ?? 'classic',
      decoration: getTextDecorationValue(overlay.underline, overlay.strikethrough) as
        | 'underline'
        | 'line-through'
        | 'none'
        | 'underline line-through'
        | undefined,
    },
  };
};
