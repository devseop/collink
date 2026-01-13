import IconImage from '../../../assets/icons/ic_image.svg?react';

type EmptyStateProps = {
  onSelectImage: () => void;
  onSelectColor: () => void;
};

export default function EmptyState({ onSelectImage, onSelectColor }: EmptyStateProps) {
  return (
    <div className="flex justify-center items-center px-5 pt-[68px] pb-12 h-dvh">
      <div className="w-full h-full min-w-[320px] border border-dashed border-[#CFCFCF] rounded-2xl text-center bg-white/70">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <IconImage className="h-14 w-14 text-[#222222]" aria-hidden />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 mt-3 mb-6">
            <p className="text-sm font-medium text-[#222222] leading-none">
              원하는 이미지나 배경색을 선택해주세요.
            </p>
            <p className="text-xs font-regular text-[#7A7A7A] leading-none">
              50MB 이하의 JPEG, PNG, and MP4만 가능해요.
            </p>
          </div>
          <div className="flex flex-row gap-3 justify-center">
            <button
              onClick={onSelectImage}
              className="w-fit rounded-lg border border-[#D3D3D3] px-4 py-[10px] text-sm font-medium text-[#222222] leading-none"
            >
              이미지 고르기
            </button>
            <button
              onClick={onSelectColor}
              className="w-fit rounded-lg border border-[#D3D3D3] px-4 py-[10px] text-sm font-medium text-[#222222] leading-none"
            >
              배경색 고르기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
