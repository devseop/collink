import { HexColorPicker } from 'react-colorful';
import IconClose from '../../../assets/icons/ic_close.svg?react';
import IconImage from '../../../assets/icons/ic_image.svg?react';

type BackgroundOptionsModalProps = {
  showBackgroundOptions: boolean;
  showBackgroundToggle: boolean;
  backgroundMode: 'image' | 'color';
  setBackgroundMode: (mode: 'image' | 'color') => void;
  setShowBackgroundOptions: (value: boolean) => void;
  setBackgroundOptionsSource: (value: 'empty' | 'navbar' | null) => void;
  triggerBackgroundSelect: () => void;
  setIsBackgroundColored: (value: boolean) => void;
  colorPickerValue: string;
  handleSelectColor: (color: string) => void;
};

export default function BackgroundOptionsModal({
  showBackgroundOptions,
  showBackgroundToggle,
  backgroundMode,
  setBackgroundMode,
  setShowBackgroundOptions,
  setBackgroundOptionsSource,
  triggerBackgroundSelect,
  setIsBackgroundColored,
  colorPickerValue,
  handleSelectColor,
}: BackgroundOptionsModalProps) {
  if (!showBackgroundOptions) return null;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50">
      <div
        className={`mb-0 bg-white backdrop-blur-sm shadow-[0_-1px_12px_rgba(0,0,0,0.2)] flex flex-col rounded-t-lg ${
          showBackgroundToggle ? 'gap-2' : 'gap-5'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-4 py-5 ${!showBackgroundToggle && 'border-b border-[#D3D3D3]'}`}>
          <p className="text-lg font-semibold text-[#222222] leading-none text-left">
            {!showBackgroundToggle ? '배경색 고르기' : '배경 수정'}
          </p>
          <button
            onClick={() => {
              setShowBackgroundOptions(false);
              setBackgroundOptionsSource(null);
            }}
          >
            <IconClose className="h-4 w-4 text-[#222222]" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {showBackgroundToggle && (
            <div className="flex items-center justify-between">
              <div className="flex w-full">
                <button
                  onClick={() => setBackgroundMode('image')}
                  className={`w-full text-base pb-2 border-b ${
                    backgroundMode === 'image'
                      ? 'font-bold text-[#222222] border-[#222222] border-b-2 border-b-solid'
                      : 'text-[#6B6B6B] border-[#D3D3D3]'
                  }`}
                >
                  이미지
                </button>
                <button
                  onClick={() => setBackgroundMode('color')}
                  className={`w-full text-base pb-2 border-b ${
                    backgroundMode === 'color'
                      ? 'font-bold text-[#222222] border-[#222222] border-b-2 border-b-solid'
                      : 'text-[#6B6B6B] border-[#D3D3D3]'
                  }`}
                >
                  단색
                </button>
              </div>
            </div>
          )}

          {showBackgroundToggle && backgroundMode === 'image' ? (
            <div className="flex flex-col gap-2 px-5 mb-10">
              <div className="flex flex-col items-center justify-center mt-4">
                <div className="mx-auto flex items-center justify-center">
                  <IconImage className="h-10 w-10 text-[#222222]" aria-hidden />
                </div>
                <div className="flex flex-col items-center justify-center gap-2 mt-3 mb-6">
                  <p className="text-sm font-medium text-[#222222] leading-none">
                    원하는 이미지나 배경색을 선택해주세요.
                  </p>
                  <p className="text-xs font-regular text-[#7A7A7A] leading-none">
                    50MB 이하의 JPEG, PNG, and MP4만 가능해요.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerBackgroundSelect();
                  setIsBackgroundColored(false);
                  setShowBackgroundOptions(false);
                  setBackgroundOptionsSource(null);
                }}
                className="w-full py-4 rounded-lg flex items-center justify-center text-[#222222] leading-none font-bold bg-[#B1FF8D]"
              >
                이미지 업로드
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 px-5 pb-10">
              <HexColorPicker color={colorPickerValue} onChange={handleSelectColor} style={{ width: '100%' }} />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowBackgroundOptions(false);
                    setBackgroundOptionsSource(null);
                  }}
                  className="w-full py-4 rounded-lg flex items-center justify-center text-[#222222] leading-none font-bold bg-[#B1FF8D]"
                >
                  적용하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
