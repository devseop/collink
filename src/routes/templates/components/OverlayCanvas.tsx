import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Overlay } from '../../../types/overlay';
import IconCloseWhite from '../../../assets/icons/ic_close_white.svg?react';
import IconRotateWhite from '../../../assets/icons/ic_rotate_white.svg?react';
import IconScaleWhite from '../../../assets/icons/ic_scale_white.svg?react';

type TextBoxStyles = {
  color: string;
  backgroundColor: string;
};

type OverlayCanvasProps = {
  overlays: Overlay[];
  selectedImageId: string | null;
  selectedTextId: string | null;
  editingOverlayId: string | null;
  overlayElementRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  imageScaleDefaultPercent: number;
  handleOverlayMouseDown: (event: ReactMouseEvent<HTMLDivElement>, overlayId: string) => void;
  handleOverlayTouchStart: (event: ReactTouchEvent<HTMLDivElement>, overlayId: string) => void;
  handleTextOverlayTouchStart: (event: ReactTouchEvent, overlayId: string) => void;
  handleTextOverlayTouchMove: (event: ReactTouchEvent, overlayId: string) => void;
  handleTextOverlayTouchEnd: (event: ReactTouchEvent, overlayId: string) => void;
  updateTextOverlay: (overlayId: string, value: string) => void;
  startEditingTextOverlay: (overlayId: string) => void;
  finishEditingTextOverlay: () => void;
  onSelectImage: (overlayId: string) => void;
  onSelectText: (overlayId: string) => void;
  handleRemoveOverlayElement: (overlayId: string) => void;
  startTransform: (event: ReactMouseEvent | ReactTouchEvent, overlay: Overlay, mode: 'rotate' | 'scale') => void;
  getTextDecorationValue: (underline?: boolean, strikethrough?: boolean) => string;
  getTextBoxStyles: (color: string, boxStyle?: number) => TextBoxStyles;
};

export default function OverlayCanvas({
  overlays,
  selectedImageId,
  selectedTextId,
  editingOverlayId,
  overlayElementRefs,
  imageScaleDefaultPercent,
  handleOverlayMouseDown,
  handleOverlayTouchStart,
  handleTextOverlayTouchStart,
  handleTextOverlayTouchMove,
  handleTextOverlayTouchEnd,
  updateTextOverlay,
  startEditingTextOverlay,
  finishEditingTextOverlay,
  onSelectImage,
  onSelectText,
  handleRemoveOverlayElement,
  startTransform,
  getTextDecorationValue,
  getTextBoxStyles,
}: OverlayCanvasProps) {
  return (
    <>
      {overlays.map((overlay, index) => {
        const isText = overlay.type === 'text';
        const isEditing = isText && editingOverlayId === overlay.id;
        const isSelected = selectedImageId === overlay.id || selectedTextId === overlay.id;
        const textBoxStyles = isText
          ? getTextBoxStyles(overlay.textColor ?? '#222222', overlay.boxStyle ?? 0)
          : null;

        return (
          <div
            key={overlay.id}
            className={`fixed z-20 touch-none ${isSelected ? 'p-2' : ''}`}
            style={{
              left: `${overlay.x}px`,
              top: `${overlay.y}px`,
              touchAction: 'none',
            }}
            onMouseDown={!isEditing ? (event) => handleOverlayMouseDown(event, overlay.id) : undefined}
            onTouchStart={!isEditing ? (event) => handleOverlayTouchStart(event, overlay.id) : undefined}
            onClick={(event) => {
              event.stopPropagation();
              if (!isText) {
                onSelectImage(overlay.id);
              } else {
                onSelectText(overlay.id);
              }
            }}
          >
            <div className="relative p-2">
              {isSelected && (
                <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
                  <div className="absolute -inset-1.5 border-2 border-dashed border-[#B1FF8D]" />
                  <span className="absolute -top-1.5 -left-1.5 h-1 w-1 bg-[#B1FF8D]" />
                  <span className="absolute -top-1.5 -right-1.5 h-1 w-1 bg-[#B1FF8D]" />
                  <span className="absolute -bottom-1.5 -left-1.5 h-1 w-1 bg-[#B1FF8D]" />
                  <span className="absolute -bottom-1.5 -right-1.5 h-1 w-1 bg-[#B1FF8D]" />
                </div>
              )}
              <div className="relative z-20">
                {isText ? (
                  isEditing ? (
                    <textarea
                      autoFocus
                      ref={(node) => {
                        overlayElementRefs.current[overlay.id] = node;
                      }}
                      value={overlay.text}
                      onChange={(event) => updateTextOverlay(overlay.id, event.target.value)}
                      onBlur={() => finishEditingTextOverlay()}
                      onMouseDown={(event) => event.stopPropagation()}
                      className="min-w-[140px] min-h-[24px] bg-transparent p-2 text-center focus:outline-none touch-manipulation"
                      style={{
                        fontSize: `${overlay.fontSize}px`,
                        fontWeight: overlay.fontWeight,
                        fontFamily: overlay.fontFamily,
                        color: textBoxStyles?.color ?? overlay.textColor ?? '#222222',
                        textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                        transform: `rotate(${overlay.rotation ?? 0}deg) scale(${(overlay.scalePercent ?? imageScaleDefaultPercent) / 100})`,
                        transformOrigin: 'center',
                        caretColor: '#B1FF8D',
                        backgroundColor: textBoxStyles?.backgroundColor,
                      }}
                      placeholder=""
                    />
                  ) : (
                    <div
                      ref={(node) => {
                        overlayElementRefs.current[overlay.id] = node;
                      }}
                      className="w-[140px] min-h-[24px] text-shadow-lg/30 text-center cursor-text touch-manipulation"
                      style={{
                        fontSize: `${overlay.fontSize}px`,
                        fontWeight: overlay.fontWeight,
                        fontFamily: overlay.fontFamily,
                        color: textBoxStyles?.color ?? overlay.textColor ?? '#222222',
                        textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                        transform: `rotate(${overlay.rotation ?? 0}deg) scale(${(overlay.scalePercent ?? imageScaleDefaultPercent) / 100})`,
                        transformOrigin: 'center',
                        backgroundColor: textBoxStyles?.backgroundColor,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectText(overlay.id);
                      }}
                      onTouchStart={(event) => handleTextOverlayTouchStart(event, overlay.id)}
                      onTouchMove={(event) => handleTextOverlayTouchMove(event, overlay.id)}
                      onTouchEnd={(event) => handleTextOverlayTouchEnd(event, overlay.id)}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        startEditingTextOverlay(overlay.id);
                        onSelectText(overlay.id);
                      }}
                    >
                      {overlay.text || ''}
                    </div>
                  )
                ) : (
                  <img
                    ref={(node) => {
                      overlayElementRefs.current[overlay.id] = node;
                    }}
                    src={overlay.image}
                    alt={`오버레이 ${index + 1}`}
                    className="object-cover rounded-md shadow-md pointer-events-none"
                    style={{
                      width: (overlay.baseWidth * overlay.scalePercent) / 100,
                      height: (overlay.baseHeight * overlay.scalePercent) / 100,
                      transform: `rotate(${overlay.rotation ?? 0}deg)`,
                    }}
                    draggable={false}
                  />
                )}
              </div>
              {isSelected && (
                <div className="pointer-events-none absolute inset-0 z-30">
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onTouchStart={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveOverlayElement(overlay.id);
                    }}
                    className="pointer-events-auto absolute -top-3 -left-3 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF4D4D] text-xs text-white transition-colors hover:bg-red-600"
                    aria-label="요소 제거"
                  >
                    <IconCloseWhite className="h-4 w-4" aria-hidden />
                  </button>
                  <>
                    <button
                      type="button"
                      onMouseDown={(event) => startTransform(event, overlay, 'rotate')}
                      onTouchStart={(event) => startTransform(event, overlay, 'rotate')}
                      className="pointer-events-auto absolute -top-3 -right-3 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[#222222] text-xs text-white transition-colors hover:bg-[#111111]"
                      aria-label="요소 회전"
                    >
                      <IconRotateWhite className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => startTransform(event, overlay, 'scale')}
                      onTouchStart={(event) => startTransform(event, overlay, 'scale')}
                      className="pointer-events-auto absolute -bottom-3 -right-3 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[#222222] text-xs text-white transition-colors hover:bg-[#111111]"
                      aria-label="요소 크기 조절"
                    >
                      <IconScaleWhite className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
