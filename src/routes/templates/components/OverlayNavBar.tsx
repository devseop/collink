import NavigationButton from '../../../components/NavigationButton';
import IconImage from '../../../assets/icons/ic_image.svg?react';
import IconSticker from '../../../assets/icons/ic_sticker.svg?react';
import IconText from '../../../assets/icons/ic_text.svg?react';
import IconMotion from '../../../assets/icons/ic_motion.svg?react';

type OverlayNavBarProps = {
  isOverlayFocused: boolean;
  showBackgroundOptions: boolean;
  isEmptyState: boolean;
  onOpenBackgroundOptions: () => void;
  onTriggerOverlaySelect: () => void;
  onAddTextOverlay: () => void;
  onOpenMotionOptions: () => void;
};

export default function OverlayNavBar({
  isOverlayFocused,
  showBackgroundOptions,
  isEmptyState,
  onOpenBackgroundOptions,
  onTriggerOverlaySelect,
  onAddTextOverlay,
  onOpenMotionOptions,
}: OverlayNavBarProps) {
  if (isOverlayFocused || showBackgroundOptions || isEmptyState) return null;

  return (
    <div className="fixed inset-x-0 bottom-10 z-50 grid place-items-center">
      <div className="flex gap-2 w-fit px-4 rounded-xl bg-white shadow-lg">
        <NavigationButton onClick={onOpenBackgroundOptions} aria-label="배경 이미지 추가">
          <IconImage className="w-6 h-6 text-[#222222]" aria-hidden />
          <span className="text-xs font-medium text-[#222222] leading-none">배경</span>
        </NavigationButton>
        <NavigationButton onClick={onTriggerOverlaySelect} aria-label="스티커 추가">
          <IconSticker className="w-6 h-6 text-[#222222]" aria-hidden />
          <span className="text-xs font-medium text-[#222222] leading-none">스티커</span>
        </NavigationButton>
        <NavigationButton onClick={() => onAddTextOverlay()} aria-label="텍스트 추가">
          <IconText className="w-6 h-6 text-[#222222]" aria-hidden />
          <span className="text-xs font-medium text-[#222222] leading-none">텍스트</span>
        </NavigationButton>
        <NavigationButton onClick={onOpenMotionOptions} aria-label="모션 추가">
          <IconMotion className="w-6 h-6 text-[#222222]" aria-hidden />
          <span className="text-xs font-medium text-[#222222] leading-none">모션</span>
        </NavigationButton>
      </div>
    </div>
  );
}
