import { useMemo } from 'react';
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorThumb,
  Input,
  SliderTrack,
  parseColor,
} from 'react-aria-components';

type ColorPickerPanelProps = {
  value: string;
  onChange: (color: string) => void;
};

export default function ColorPickerPanel({ value, onChange }: ColorPickerPanelProps) {
  const colorValue = useMemo(() => parseColor(value), [value]);

  return (
    <ColorPicker value={colorValue} onChange={(color) => onChange(color.toString('hex'))}>
      <div className="flex flex-col gap-3">
        <ColorArea
          colorSpace="hsl"
          xChannel="saturation"
          yChannel="lightness"
          className="relative h-[180px] w-full rounded-lg border border-[#E0E0E0]"
        >
          <ColorThumb className="h-4 w-4 rounded-full border-2 border-white shadow" />
        </ColorArea>
        <ColorSlider channel="hue" colorSpace="hsl" className="w-full">
          <SliderTrack className="relative h-4 w-full rounded-md bg-[linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]">
            <ColorThumb className="h-4 w-4 rounded-full border-2 border-white shadow" />
          </SliderTrack>
        </ColorSlider>
        <ColorField aria-label="색상" colorSpace="hsl" className="w-full">
          <Input className="w-full rounded-lg border border-[#D3D3D3] px-3 py-2 text-sm text-[#222222] outline-none" />
        </ColorField>
      </div>
    </ColorPicker>
  );
}
