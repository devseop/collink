import { HexColorPicker } from 'react-colorful';
import type { Overlay } from '../../../types/overlay';
import IconTextBold from '../../../assets/icons/ic_bold.svg?react';
import IconTextUnderline from '../../../assets/icons/ic_underline.svg?react';
import IconTextStrikethrough from '../../../assets/icons/ic_strikethrough.svg?react';

type OverlayEditModalProps = {
  selectedImageOverlay: (Overlay & { type: 'image' }) | null;
  selectedTextOverlay: (Overlay & { type: 'text' }) | null;
  editingOverlayId: string | null;
  isTextModalFloating: boolean;
  keyboardInset: number;
  linkInputValue: string;
  setLinkInputValue: (value: string) => void;
  handleLinkUrlConfirm: () => void;
  moveUp: (overlayId: string) => void;
  moveDown: (overlayId: string) => void;
  canMoveImageUp: boolean;
  canMoveImageDown: boolean;
  showTextColorPicker: boolean;
  setShowTextColorPicker: (value: boolean | ((prev: boolean) => boolean)) => void;
  textColorValue: string;
  handleTextColorChange: (color: string) => void;
  handleTextStyleChange: (style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    underline?: boolean;
    strikethrough?: boolean;
    textColor?: string;
    boxStyle?: 0 | 1 | 2;
  }) => void;
};

export default function OverlayEditModal({
  selectedImageOverlay,
  selectedTextOverlay,
  editingOverlayId,
  isTextModalFloating,
  keyboardInset,
  linkInputValue,
  setLinkInputValue,
  handleLinkUrlConfirm,
  moveUp,
  moveDown,
  canMoveImageUp,
  canMoveImageDown,
  showTextColorPicker,
  setShowTextColorPicker,
  textColorValue,
  handleTextColorChange,
  handleTextStyleChange,
}: OverlayEditModalProps) {
  if (!selectedImageOverlay && !(selectedTextOverlay && !editingOverlayId)) return null;

  return (
    <div
      className={`z-50 transition-[bottom] duration-200 ${
        isTextModalFloating
          ? 'fixed left-1/2 -translate-x-1/2 rounded-2xl bg-white px-4 py-3 shadow-lg w-[min(92vw,420px)]'
          : 'fixed left-0 right-0 bg-white backdrop-blur-sm border-t border-black/5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-4 py-4'
      }`}
      style={{
        bottom: isTextModalFloating ? '2.5rem' : editingOverlayId ? `${keyboardInset + 16}px` : '0px',
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {selectedImageOverlay && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#101010]">순서</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
                onClick={(event) => {
                  event.stopPropagation();
                  moveDown(selectedImageOverlay.id);
                }}
                disabled={!canMoveImageDown}
              >
                뒤로
              </button>
              <button
                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
                onClick={(event) => {
                  event.stopPropagation();
                  moveUp(selectedImageOverlay.id);
                }}
                disabled={!canMoveImageUp}
              >
                앞으로
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <p className="text-sm font-semibold text-[#101010]">링크 추가</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={linkInputValue}
                onChange={(event) => setLinkInputValue(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleLinkUrlConfirm();
                  }
                }}
                placeholder="https://example.com"
                className="flex-1 rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleLinkUrlConfirm();
                }}
                className="px-3 py-2 rounded-lg bg-black text-white text-sm font-semibold"
              >
                확인
              </button>
            </div>
            <p className="text-[11px] text-[#A0A0A0]">링크가 있으면 공개 화면에서 클릭할 수 있어요.</p>
          </div>
        </div>
      )}

      {selectedTextOverlay && !editingOverlayId && (
        <div className="flex flex-col gap-3">
          {/* 순서 UI */}
          {/* <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#101010]">순서</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
                onClick={(event) => {
                  event.stopPropagation();
                  moveDown(selectedTextOverlay.id);
                }}
                disabled={!canMoveTextDown}
              >
                뒤로
              </button>
              <button
                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
                onClick={(event) => {
                  event.stopPropagation();
                  moveUp(selectedTextOverlay.id);
                }}
                disabled={!canMoveTextUp}
              >
                앞으로
              </button>
            </div>
          </div> */}

          <div className="flex gap-2 w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowTextColorPicker((prev) => !prev)}
                className="h-8 w-8 rounded-md border border-black/10"
                style={{ backgroundColor: textColorValue }}
                aria-label="텍스트 색상"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleTextStyleChange({ fontWeight: selectedTextOverlay.fontWeight === 700 ? 400 : 700 })
                  }
                  className={`h-8 w-8 rounded-md items-center justify-center flex ${
                    selectedTextOverlay.fontWeight >= 700 ? 'bg-[#F4F4F4]' : 'bg-white'
                  }`}
                  aria-label="볼드"
                >
                  <IconTextBold className="w-6 h-6 text-[#222222]" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => handleTextStyleChange({ underline: !selectedTextOverlay.underline })}
                  className={`h-8 w-8 rounded-md items-center justify-center flex ${
                    selectedTextOverlay.underline ? 'bg-[#F4F4F4]' : 'bg-white'
                  }`}
                  aria-label="언더라인"
                >
                  <IconTextUnderline className="w-6 h-6 text-[#222222]" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => handleTextStyleChange({ strikethrough: !selectedTextOverlay.strikethrough })}
                  className={`h-8 w-8 rounded-md items-center justify-center flex ${
                    selectedTextOverlay.strikethrough ? 'bg-[#F4F4F4]' : 'bg-white'
                  }`}
                  aria-label="취소선"
                >
                  <IconTextStrikethrough className="w-6 h-6 text-[#222222]" aria-hidden />
                </button>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1 rounded-md border border-black/10 px-2 py-1 text-xs text-[#6B6B6B]">
              <span>Pretendard</span>
              <span className="text-[10px]">▾</span>
            </div>
          </div>

          {showTextColorPicker && (
            <div className="pt-2">
              <HexColorPicker color={textColorValue} onChange={handleTextColorChange} style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
