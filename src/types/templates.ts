export type Category = 'schedule' | 'shop' | 'folder';

export type TemplateItemCoordinate = {
  x: number;
  y: number;
};

export type TemplateItemSize = {
  width: number;
  height: number;
};

export type TemplateItemFont = {
  size: number;
  weight: number;
  color: string;
  family: string;
};

export type TemplateItem = {
  imageUrl?: string;
  text?: string;
  hasLink?: boolean;
  linkUrl?: string;
  index?: number;
  coordinates?: TemplateItemCoordinate;
  size?: TemplateItemSize;
  font?: TemplateItemFont;
  rotation?: number;
};

export type DefaultTemplate = {
  id?: string;
  category?: Category;
  thumbnailUrl?: string;
  backgroundImageUrl?: string;
  items?: TemplateItem[];
  isBackgroundColored?: boolean;
  backgroundColor?: string;
};

export type UserTemplate = {
  id?: string;
  category?: Category;
  backgroundImageUrl?: string;
  items?: TemplateItem[];
  userId: string;
  isBackgroundColored?: boolean;
  backgroundColor?: string;
};

export type Template = DefaultTemplate | UserTemplate;
