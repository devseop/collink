import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { Overlay } from '../../../types/overlay';
import IconTextBold from '../../../assets/icons/ic_bold.svg?react';
import IconTextUnderline from '../../../assets/icons/ic_underline.svg?react';
import IconTextStrikethrough from '../../../assets/icons/ic_strikethrough.svg?react';
import IconClose from '../../../assets/icons/ic_close.svg?react';
import IconFont from '../../../assets/icons/ic_font.svg?react';
import { FONT_OPTIONS } from '../../../constants/fonts';

type OverlayEditModalProps = {
  selectedImageOverlay: (Overlay & { type: 'image' }) | null;
  selectedTextOverlay: (Overlay & { type: 'text' }) | null;
  editingOverlayId: string | null;
  isTextModalFloating: boolean;
  keyboardInset: number;
  linkInputValue: string;
  setLinkInputValue: (value: string) => void;
  linkDescriptionInputValue: string;
  setLinkDescriptionInputValue: (value: string) => void;
  setIsLinkInputFocused: (value: boolean) => void;
  handleLinkUrlConfirm: () => void;
  handleClose: () => void;
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
  linkDescriptionInputValue,
  setLinkDescriptionInputValue,
  setIsLinkInputFocused,
  handleLinkUrlConfirm,
  handleClose,
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

  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const selectedFontLabel =
    FONT_OPTIONS.find((option) => option.family === selectedTextOverlay?.fontFamily)?.label ??
    selectedTextOverlay?.fontFamily ??
    '폰트 선택';

  useEffect(() => {
    setIsFontMenuOpen(false);
  }, [selectedTextOverlay, editingOverlayId]);

  return (
    <>
      {selectedImageOverlay && (
        <div
          className="fixed left-0 right-0 z-50 w-full bg-white backdrop-blur-sm border-t border-black/5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] max-h-[70vh] overflow-y-auto overscroll-contain transition-[bottom] duration-200"
          style={{
            bottom: editingOverlayId ? `${keyboardInset + 16}px` : '0px',
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
        <div className="flex flex-col gap-5 mb-6">
          <div className="flex items-center justify-between border-b border-[#d3d3d3] px-4 py-5">
            <p className="text-lg font-semibold text-[#222222] leading-none text-left">스티커 설정</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleClose();
              }}
              aria-label="닫기"
            >
              <IconClose className="h-4 w-4 text-[#222222]" aria-hidden />
            </button>
          </div>
          <div className="px-5 flex flex-col gap-6 pb-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#222222]">순서</p>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 rounded-lg border text-xs disabled:opacity-40"
                  onClick={(event) => {
                    event.stopPropagation();
                    moveDown(selectedImageOverlay.id);
                  }}
                  disabled={!canMoveImageDown}
                >
                  뒤로
                </button>
                <button
                  className="px-2 py-1 rounded-lg border text-xs disabled:opacity-40"
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
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#222222]">링크</p>
              <div className="flex gap-2">
                <div className="flex items-center rounded-lg bg-[#F4F4F4] px-3 w-full h-10">
                  <span className="text-sm text-[#313131] mr-[1px]">https://</span>
                <input
                  type="text"
                  value={linkInputValue}
                  onChange={(event) => setLinkInputValue(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onFocus={() => setIsLinkInputFocused(true)}
                  onBlur={() => setIsLinkInputFocused(false)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleLinkUrlConfirm();
                    }
                  }}
                  placeholder="example.com"
                  className="flex-1 text-[16px] bg-transparent focus:outline-none leading-none touch-manipulation"
                />
                </div>
              </div>
              <p className="text-[11px] text-[#666666] leading-none">이 페이지를 방문하는 사람이 스티커를 누르면 이 링크로 이동할 수 있어요</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#222222]">설명</p>
            <input
              type="text"
              value={linkDescriptionInputValue}
              onChange={(event) => setLinkDescriptionInputValue(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onFocus={() => setIsLinkInputFocused(true)}
              onBlur={() => setIsLinkInputFocused(false)}
              placeholder="링크를 간단하게 설명할 문구를 입력해주세요"
              className="w-full rounded-lg bg-[#F4F4F4] px-3 h-10 text-[16px] focus:outline-none leading-none placeholder:text-[#929292] placeholder:font-sm touch-manipulation"
            />
            </div>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleLinkUrlConfirm();
            }}
            className="w-calc(100% - 2rem) mx-5 py-4 rounded-lg bg-[#B1FF8D] text-black text-base font-semibold leading-none"
          >
            추가하기
          </button>
        </div>
        </div>
      )}

      {selectedTextOverlay && !editingOverlayId && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 w-fit max-w-[92vw] rounded-2xl bg-white shadow-lg transition-[bottom] duration-200"
          style={{
            bottom: isTextModalFloating ? '2.5rem' : `${keyboardInset + 16}px`,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 px-4 h-14 items-center justify-center">
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

          <div className="flex gap-2 w-fit items-center">
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
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setIsFontMenuOpen((prev) => !prev)}
                className={`h-8 w-8 rounded-md items-center justify-center flex ${
                  isFontMenuOpen ? 'bg-[#F4F4F4]' : 'bg-white'
                }`}
                aria-label={`폰트 선택: ${selectedFontLabel}`}
              >
                <IconFont className="w-6 h-6 text-[#222222]" aria-hidden />
              </button>
            </div>
          </div>

          {showTextColorPicker && (
            <div className="pt-2">
              <HexColorPicker color={textColorValue} onChange={handleTextColorChange} style={{ width: '100%' }} />
            </div>
          )}
        </div>
        </div>
      )}
      {isFontMenuOpen && selectedTextOverlay && !editingOverlayId && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(2.5rem+32px)] z-50 w-fit">
          <div className="flex items-center gap-2 overflow-x-auto">
            {FONT_OPTIONS.map((option) => {
              const isSelected = option.family === selectedTextOverlay.fontFamily;
              return (
                <button
                  key={option.family}
                  type="button"
                  onClick={() => {
                    handleTextStyleChange({ fontFamily: option.family });
                    setIsFontMenuOpen(false);
                  }}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected ? 'bg-[#222222] text-white' : 'bg-[#F4F4F4] text-[#222222]'
                  }`}
                  style={{ fontFamily: option.family }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
