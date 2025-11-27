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
};

export type TextOverlay = BaseOverlay & {
  type: 'text';
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
};

export type Overlay = ImageOverlay | TextOverlay;
