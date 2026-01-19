import type { TemplateItem } from '../types/templates';

type MappedImageItem = {
  type: 'image';
  key: string | number;
  src: string;
  linkUrl?: string;
  linkDescription?: string;
  style: {
    left: number;
    top: number;
    width?: number;
    height?: number;
    rotation: number;
    zIndex: number;
  };
};

type MappedTextItem = {
  type: 'text';
  key: string | number;
  text: string;
  font: TemplateItem['font'];
  style: {
    left: number;
    top: number;
    rotation: number;
    zIndex: number;
    scalePercent?: number;
  };
};

export type MappedTemplateItem = MappedImageItem | MappedTextItem;

export function mapTemplateItemsToRender(items: TemplateItem[]): MappedTemplateItem[] {
  return items.map((item, idx) => {
    const left = item.coordinates?.x ?? 0;
    const top = item.coordinates?.y ?? 0;
    const width = item.size?.width;
    const height = item.size?.height;
    const rotation = item.rotation ?? 0;
    const zIndex = item.index ?? idx;
    const key = item.index ?? idx;

    if (item.imageUrl) {
      return {
        type: 'image' as const,
        key,
        src: item.imageUrl,
        linkUrl: item.linkUrl,
        linkDescription: item.linkDescription,
        style: {
          left,
          top,
          width,
          height,
          rotation,
          zIndex,
        },
      };
    }

    return {
      type: 'text' as const,
      key,
      text: item.text ?? '',
      font: item.font,
      style: {
        left,
        top,
        rotation,
        zIndex,
        scalePercent: item.scalePercent,
      },
    };
  });
}
