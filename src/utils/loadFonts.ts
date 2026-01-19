import { supabase } from '../lib/supabaseClient';
import type { FontOption } from '../constants/fonts';

const FONT_BUCKET = 'fonts';
const STYLE_ELEMENT_ID = 'app-font-face-styles';

const buildFontFaceCss = (family: string, url: string, format: FontOption['format'], weight: number, style?: string) => {
  const fontStyle = style ?? 'normal';
  return `
@font-face {
  font-family: '${family}';
  src: url('${url}') format('${format}');
  font-weight: ${weight};
  font-style: ${fontStyle};
  font-display: swap;
}
`.trim();
};

export async function loadFonts(options: FontOption[]) {
  if (typeof document === 'undefined') return;

  const styleElement =
    document.getElementById(STYLE_ELEMENT_ID) ??
    Object.assign(document.createElement('style'), { id: STYLE_ELEMENT_ID });

  if (!styleElement.parentElement) {
    document.head.appendChild(styleElement);
  }

  const fontFaceCss: string[] = [];

  options.forEach((option) => {
    const { data } = supabase.storage.from(FONT_BUCKET).getPublicUrl(option.path);
    if (!data?.publicUrl) return;
    fontFaceCss.push(buildFontFaceCss(option.family, data.publicUrl, option.format, option.weight, option.style));
  });

  if (fontFaceCss.length) {
    styleElement.textContent = fontFaceCss.join('\n');
  }
}
