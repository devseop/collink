import { useEffect, useState } from 'react';
import IconClose from '../../../assets/icons/ic_close.svg?react';

type AnimationType = 'default' | 'spread' | 'collage';

type AnimationSelectorProps = {
  animationType: AnimationType;
  onSelect: (value: AnimationType) => void;
  onPreview: (value: AnimationType) => void;
  onApply: () => void;
  onClose: () => void;
};

export default function AnimationSelector({
  animationType,
  onSelect,
  onPreview,
  onApply,
  onClose,
}: AnimationSelectorProps) {
  const [pendingType, setPendingType] = useState<AnimationType>(animationType);

  useEffect(() => {
    setPendingType(animationType);
  }, [animationType]);

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50">
      <div
        className="mb-0 bg-white backdrop-blur-sm shadow-[0_-1px_12px_rgba(0,0,0,0.2)] flex flex-col rounded-t-lg gap-5"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#D3D3D3]">
          <p className="text-lg font-semibold text-[#222222] leading-none text-left">모션 선택</p>
          <button onClick={onClose} aria-label="모션 선택 닫기">
            <IconClose className="h-4 w-4 text-[#222222]" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-5 pb-8">
          <div className="flex w-full gap-3">
            {[
              { value: 'default', label: '기본' },
              { value: 'spread', label: '퍼짐' },
              { value: 'collage', label: '콜라주' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const nextValue = option.value as AnimationType;
                  setPendingType(nextValue);
                  onPreview(nextValue);
                }}
                className={`flex-1 p-3 rounded-lg border box-border ${
                  pendingType === option.value
                    ? 'font-bold text-[#222222] border-[#222222] border-2'
                    : 'text-[#6B6B6B] border-[#D3D3D3]'
                }`}
              >
                <div className="flex items-center justify-center bg-[#d2d2d2] h-[100px] w-full rounded-sm" />
                <p className="text-sm font-medium text-[#222222] leading-none mt-4 mb-1">{option.label}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onSelect(pendingType);
              onApply();
            }}
            className="w-full py-4 rounded-lg flex items-center justify-center text-[#222222] leading-none font-bold bg-[#B1FF8D]"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}
