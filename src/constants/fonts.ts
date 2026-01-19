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
    label: 'zen serif',
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
];
