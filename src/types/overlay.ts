export type BaseOverlay = {
  id: string;
  x: number;
  y: number;
};

export type ImageOverlay = BaseOverlay & {
  type: 'image';
  image: string;
  file?: File | null;
  rotation: number;
  baseWidth: number;
  baseHeight: number;
  scalePercent: number;
  linkUrl?: string;
  linkDescription?: string;
};

export type TextOverlay = BaseOverlay & {
  type: 'text';
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  rotation: number;
  scalePercent: number;
  textColor?: string;
  boxStyle?: 0 | 1 | 2;
  underline?: boolean;
  strikethrough?: boolean;
};

export type Overlay = ImageOverlay | TextOverlay;
