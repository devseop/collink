export type FontOption = {
  label: string;
  family: string;
  path: string;
  format: 'opentype' | 'truetype';
  weight: number;
  style?: 'normal' | 'italic';
};

export const FONT_OPTIONS: FontOption[] = [
  {
    label: '메모먼트 꾹꾹체',
    family: 'MemomentKkukkukk',
    path: 'MemomentKkukkukk.otf',
    format: 'opentype',
    weight: 400,
  },
  {
    label: '와일드각',
    family: 'WILDgag',
    path: 'WILDgag-Bold.ttf',
    format: 'truetype',
    weight: 700,
  },
  {
    label: 'Zen Serif',
    family: 'Zen Serif',
    path: 'ZEN-SERIF-Regular.otf',
    format: 'opentype',
    weight: 400,
  },
  {
    label: '꾸불림체',
    family: 'BMKkubulim',
    path: 'BMKkubulim.otf',
    format: 'opentype',
    weight: 400,
  },
  {
    label: 'Barriecito',
    family: 'Barriecito',
    path: 'Barriecito-Regular.ttf',
    format: 'truetype',
    weight: 400,
  },
  {
    label: '기랑해랑체',
    family: 'BMKIRANGHAERANG',
    path: 'BMKIRANGHAERANG-OTF.otf',
    format: 'opentype',
    weight: 400,
  }
];
