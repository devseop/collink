import { useEffect, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { FONT_OPTIONS } from '../../../constants/fonts';
import { DropIndicator, GridList, GridListItem, useDragAndDrop, type DragAndDropHooks } from 'react-aria-components';
import { toastQueue } from '../../../components/AppToast';

import type { Overlay } from '../../../types/overlay';
import type { DroppableCollectionReorderEvent, Key, Selection } from '@react-types/shared';

import IconTextBold from '../../../assets/icons/ic_bold.svg?react';
import IconTextUnderline from '../../../assets/icons/ic_underline.svg?react';
import IconTextStrikethrough from '../../../assets/icons/ic_strikethrough.svg?react';
import IconClose from '../../../assets/icons/ic_close.svg?react';
import IconFont from '../../../assets/icons/ic_font.svg?react';
import IconCheck from '../../../assets/icons/ic_check_stroke_colored.svg?react';

type OverlayEditModalProps = {
  selectedImageOverlay: (Overlay & { type: 'image' }) | null;
  selectedTextOverlay: (Overlay & { type: 'text' }) | null;
  isImageModalOpen: boolean;
  imageOverlays: Array<Overlay & { type: 'image' }>;
  selectedImageId: string | null;
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
  onSelectImage: (overlayId: string) => void;
  onRemoveImage: (overlayId: string) => void;
  onReorderImages: (event: DroppableCollectionReorderEvent) => void;
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
  isImageModalOpen,
  imageOverlays,
  selectedImageId,
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
  onSelectImage,
  onRemoveImage,
  onReorderImages,
  showTextColorPicker,
  setShowTextColorPicker,
  textColorValue,
  handleTextColorChange,
  handleTextStyleChange,
}: OverlayEditModalProps) {
  const shouldShowImageModal = Boolean(selectedImageOverlay && isImageModalOpen);
  const shouldShowTextModal = Boolean(selectedTextOverlay && !editingOverlayId);

  if (!shouldShowImageModal && !shouldShowTextModal) return null;

  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const selectedFontLabel =
    FONT_OPTIONS.find((option) => option.family === selectedTextOverlay?.fontFamily)?.label ??
    selectedTextOverlay?.fontFamily ??
    '폰트 선택';

  const { dragAndDropHooks } = useDragAndDrop<Overlay & { type: 'image' }>({
    getItems: (keys, items) =>
      items
        .filter((item) => keys.has(item.id))
        .map((item) => ({
          'text/plain': String(item.id),
          'overlay-image': JSON.stringify({ id: item.id }),
        })),
    onReorder: onReorderImages,
    renderDropIndicator: (target) => <DropIndicator target={target} className="w-full h-full rounded-lg bg-[#98FF7C]/50" />,
    renderDragPreview: (items) => {
      const first = items[0] as Record<string, string> | undefined;
      const raw = first?.['overlay-image'] ?? first?.['text/plain'] ?? '';
      let previewId = '';
      try {
        previewId = typeof raw === 'string' && raw.startsWith('{') ? JSON.parse(raw).id ?? '' : raw;
      } catch {
        previewId = raw;
      }
      const previewImage = imageOverlays.find((overlay) => overlay.id === previewId)?.image ?? '';

      return (
        <div className="pointer-events-none h-14 w-14 overflow-hidden rounded-lg bg-transparent">
          {previewImage ? (
            <img src={previewImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-transparent" />
          )}
        </div>
      );
    },
  });

  const selectedKeys = useMemo<Selection>(() => {
    if (!selectedImageId) return new Set<Key>();
    return new Set<Key>([selectedImageId]);
  }, [selectedImageId]);

  const handleSelectionChange = (keys: Selection) => {
    if (keys === 'all') return;

    const nextKey = Array.from(keys)[0];

    if (!nextKey) return;

    onSelectImage(String(nextKey));
  };

  useEffect(() => {
    setIsFontMenuOpen(false);
  }, [selectedTextOverlay, editingOverlayId]);

  return (
    <>
      {shouldShowImageModal && selectedImageOverlay && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/75" aria-hidden />
          <div
            className="relative z-10 h-full w-full bg-white rounded-t-2xl mt-8 overflow-y-auto overscroll-contain"
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
              <div className="px-5 flex flex-col gap-4 pb-5">
                {imageOverlays.length > 0 && (
                  <GridList
                    aria-label="스티커 목록"
                    items={imageOverlays}
                    selectionMode="single"
                    selectionBehavior="replace"
                    selectedKeys={selectedKeys}
                    onSelectionChange={handleSelectionChange}
                    onAction={(key) => onSelectImage(String(key))}
                    dragAndDropHooks={dragAndDropHooks as unknown as DragAndDropHooks<Overlay & { type: 'image' }>}
                    layout="grid"
                    className="grid grid-cols-[repeat(4,56px)] gap-2 overflow-visible"
                  >
                    {(item) => {
                      return (
                        <GridListItem id={item.id} textValue="스티커" className="w-fit overflow-visible bg-transparent">
                          {({ isSelected }) => (
                            <div className="relative h-14 w-14">
                              <div
                                className={`relative h-14 w-14 overflow-hidden rounded-lg border box-border bg-[#F4F4F4] ${isSelected ? 'border-2 border-[#98FF7C]' : 'border-transparent'}`}
                              >
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <IconCheck className="h-8 w-8 z-10" aria-hidden />
                                    <div className="absolute inset-0 bg-black/60" />
                                  </div>
                                )}
                                <img
                                  src={item.image}
                                  alt="스티커"
                                  className="h-full w-full object-cover"
                                  draggable={false}
                                />
                              </div>
                              {!isSelected && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onRemoveImage(item.id);
                                  }}
                                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-[#222222] shadow"
                                  aria-label="스티커 삭제"
                                >
                                  <IconClose className="h-3 w-3" aria-hidden />
                                </button>
                              )}
                            </div>
                          )}
                        </GridListItem>
                      );
                    }}
                  </GridList>
                )}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-[#222222]">링크</p>
                  <div className="flex gap-2">
                    <div className="flex items-center rounded-lg bg-[#F4F4F4] px-4 py-3 w-full">
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
                  <span className="text-[11px] text-[#666666] leading-none">이 페이지를 방문하는 사람이 스티커를 누르면 이 링크로 이동할 수 있어요</span>
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
                    className="w-full rounded-lg bg-[#F4F4F4] px-4 py-3 text-[16px] focus:outline-none leading-none placeholder:text-[#929292] placeholder:font-sm touch-manipulation"
                  />
                </div>
                <span className="text-[11px] text-[#666666] leading-none">설명을 입력하지 않으면 링크가 대신 보여요</span>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleLinkUrlConfirm();
                  handleClose();
                  toastQueue.add({ title: '스티커 정보가 저장되었습니다' }, { timeout: 2000 });
                }}
                disabled={!linkInputValue}
                className={`w-calc(100% - 2rem) mx-5 py-4 rounded-lg transition-colors text-base font-semibold leading-none ${linkInputValue ? 'bg-[#B1FF8D] text-black' : 'bg-[#E5E5E5] text-[#B2B2B2] cursor-not-allowed'}`}
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {shouldShowTextModal && selectedTextOverlay && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 w-fit max-w-[92vw] rounded-2xl bg-white shadow-lg transition-[bottom] duration-200"
          style={{
            bottom: isTextModalFloating ? '2.5rem' : `${keyboardInset + 16}px`,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 px-4 h-14 items-center justify-center">

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
