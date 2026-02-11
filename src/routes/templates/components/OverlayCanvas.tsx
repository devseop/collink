import type { CSSProperties, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Overlay } from '../../../types/overlay';

import IconClose from '../../../assets/icons/ic_close_stroke_black.svg?react';
import IconRotate from '../../../assets/icons/ic_rotate_stroke.svg?react';
import IconScale from '../../../assets/icons/ic_scale_stroke.svg?react';
import IconEdit from '../../../assets/icons/ic_edit_stroke.svg?react';
import IconLinkWhite from '../../../assets/icons/ic_link_stroke_white.svg?react';

const FALLBACK_TEXT_WIDTH_PER_CHAR = 0.62;
let textMeasureContext: CanvasRenderingContext2D | null = null;

const getTextMeasureContext = () => {
  if (typeof document === 'undefined') return null;
  if (textMeasureContext) return textMeasureContext;
  const canvas = document.createElement('canvas');
  textMeasureContext = canvas.getContext('2d');
  return textMeasureContext;
};

const measureTextContentWidth = ({
  text,
  fontSize,
  fontFamily,
  fontWeight,
  minWidth,
  padding,
}: {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  minWidth: number;
  padding: number;
}) => {
  const lines = (text || ' ').split('\n');
  const context = getTextMeasureContext();
  let contentWidth = 0;

  if (context) {
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    lines.forEach((line) => {
      contentWidth = Math.max(contentWidth, context.measureText(line || ' ').width);
    });
  } else {
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 1);
    contentWidth = longestLine * fontSize * FALLBACK_TEXT_WIDTH_PER_CHAR;
  }

  return Math.max(minWidth, Math.ceil(contentWidth + padding * 2));
};

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
  animationPreviewType?: 'default' | 'spread' | 'collage';
  isAnimationPreviewActive?: boolean;
  isAnimationPreviewing?: boolean;
  viewportCenter?: { x: number; y: number };
  handleOverlayMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
    overlayId: string,
    shouldPreventDefault?: boolean
  ) => void;
  handleOverlayTouchStart: (event: ReactTouchEvent<HTMLDivElement>, overlayId: string) => void;
  updateTextOverlay: (overlayId: string, value: string) => void;
  startEditingTextOverlay: (overlayId: string) => void;
  finishEditingTextOverlay: () => void;
  onSelectImage: (overlayId: string) => void;
  onSelectText: (overlayId: string) => void;
  handleRemoveOverlayElement: (overlayId: string) => void;
  startTransform: (event: ReactMouseEvent | ReactTouchEvent, overlay: Overlay, mode: 'rotate' | 'scale') => void;
  draggingOverlayId?: string | null;
  onOpenImageEdit?: (overlayId: string) => void;
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
  animationPreviewType = 'default',
  isAnimationPreviewActive = false,
  isAnimationPreviewing = false,
  viewportCenter = { x: 0, y: 0 },
  handleOverlayMouseDown,
  handleOverlayTouchStart,
  updateTextOverlay,
  startEditingTextOverlay,
  finishEditingTextOverlay,
  onSelectImage,
  onSelectText,
  handleRemoveOverlayElement,
  startTransform,
  draggingOverlayId,
  onOpenImageEdit,
  getTextDecorationValue,
  getTextBoxStyles,
}: OverlayCanvasProps) {
  const TEXT_BASE_WIDTH = 96;
  const TEXT_BASE_MIN_HEIGHT = 24;
  const TEXT_BASE_PADDING = 8;

  return (
    <>
      {overlays.map((overlay, index) => {
        const isText = overlay.type === 'text';
        const isEditing = isText && editingOverlayId === overlay.id;
        const isSelected = selectedImageId === overlay.id || selectedTextId === overlay.id;
        const isDragging = draggingOverlayId === overlay.id;
        const shouldShowFrame = isSelected || isDragging;
        const frameOpacityClass = isDragging ? 'opacity-50' : 'opacity-100';
        const shouldPreview = isAnimationPreviewing && animationPreviewType !== 'default';
        const textBoxStyles = isText
          ? getTextBoxStyles(overlay.textColor ?? '#222222', overlay.boxStyle ?? 0)
          : null;
        const textScaleFactor = isText ? (overlay.scalePercent ?? imageScaleDefaultPercent) / 100 : 1;
        const scaledTextFontSize = isText ? Math.max(1, overlay.fontSize * textScaleFactor) : 0;
        const scaledTextBaseWidth = isText ? TEXT_BASE_WIDTH * textScaleFactor : 0;
        const scaledTextMinHeight = isText ? TEXT_BASE_MIN_HEIGHT * textScaleFactor : 0;
        const scaledTextPadding = isText ? TEXT_BASE_PADDING * textScaleFactor : 0;
        const scaledTextWidth = isText
          ? measureTextContentWidth({
              text: overlay.text,
              fontSize: scaledTextFontSize,
              fontFamily: overlay.fontFamily,
              fontWeight: overlay.fontWeight,
              minWidth: scaledTextBaseWidth,
              padding: scaledTextPadding,
            })
          : 0;
        const overlayTransform = `rotate(${overlay.rotation ?? 0}deg)`;
        const positionStyle: CSSProperties = {
          left: `${overlay.x}px`,
          top: `${overlay.y}px`,
          opacity: 1,
          transform: 'scale(1)',
        };

        if (shouldPreview && animationPreviewType === 'spread') {
          if (!isAnimationPreviewActive) {
            positionStyle.left = `${viewportCenter.x}px`;
            positionStyle.top = `${viewportCenter.y}px`;
            positionStyle.opacity = 0;
            // Start from viewport center using each overlay's own center point.
            positionStyle.transform = 'translate(-50%, -50%) scale(0.9)';
          } else {
            positionStyle.transition = 'left 700ms ease, top 700ms ease, opacity 700ms ease, transform 700ms ease';
            positionStyle.transform = 'translate(0, 0) scale(1)';
          }
        }

        if (shouldPreview && animationPreviewType === 'collage') {
          const delayMs = index * 160;
          if (!isAnimationPreviewActive) {
            positionStyle.opacity = 0;
            positionStyle.transform = 'scale(0.95)';
          } else {
            positionStyle.transition = `opacity 500ms ease ${delayMs}ms, transform 500ms ease ${delayMs}ms`;
          }
        }

        const overlayZIndexClass = isDragging ? 'z-40' : 'z-20';

        return (
          <div
            key={overlay.id}
            data-overlay-frame="true"
            className={`absolute ${overlayZIndexClass} touch-none ${isSelected ? 'p-2' : ''}`}
            style={{ ...positionStyle, touchAction: 'none' }}
            onMouseDown={
              !isEditing
                ? (event) => {
                    event.stopPropagation();
                    if (!isText) {
                      onSelectImage(overlay.id);
                    } else {
                      onSelectText(overlay.id);
                    }
                    handleOverlayMouseDown(event, overlay.id, !isText);
                  }
                : undefined
            }
            onTouchStart={
              !isEditing
                ? (event) => {
                    event.stopPropagation();
                    if (!isText) {
                      onSelectImage(overlay.id);
                    } else {
                      onSelectText(overlay.id);
                    }
                    handleOverlayTouchStart(event, overlay.id);
                  }
                : undefined
            }
            onClick={(event) => {
              event.stopPropagation();
              if (!isText) {
                onSelectImage(overlay.id);
              } else {
                onSelectText(overlay.id);
              }
            }}
          >
            <div
              ref={(node) => {
                overlayElementRefs.current[overlay.id] = node;
              }}
              className="relative p-2"
              style={{
                transform: overlayTransform,
                transformOrigin: 'center',
              }}
            >
              {shouldShowFrame && (
                <div className={`pointer-events-none absolute inset-0 z-10 ${frameOpacityClass}`} aria-hidden>
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
                      value={overlay.text}
                      onChange={(event) => updateTextOverlay(overlay.id, event.target.value)}
                      onBlur={() => finishEditingTextOverlay()}
                      onMouseDown={(event) => event.stopPropagation()}
                      className="bg-transparent text-center focus:outline-none touch-manipulation"
                      style={{
                        width: `${scaledTextWidth}px`,
                        minHeight: `${scaledTextMinHeight}px`,
                        padding: `${scaledTextPadding}px`,
                        fontSize: `${scaledTextFontSize}px`,
                        fontWeight: overlay.fontWeight,
                        fontFamily: overlay.fontFamily,
                        color: textBoxStyles?.color ?? overlay.textColor ?? '#222222',
                        textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                        caretColor: '#B1FF8D',
                        backgroundColor: textBoxStyles?.backgroundColor,
                      }}
                      placeholder=""
                    />
                  ) : (
                    <div
                      className="text-shadow-lg/30 text-center cursor-text touch-manipulation"
                      style={{
                        width: `${scaledTextWidth}px`,
                        minHeight: `${scaledTextMinHeight}px`,
                        padding: `${scaledTextPadding}px`,
                        fontSize: `${scaledTextFontSize}px`,
                        fontWeight: overlay.fontWeight,
                        fontFamily: overlay.fontFamily,
                        color: textBoxStyles?.color ?? overlay.textColor ?? '#222222',
                        textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                        backgroundColor: textBoxStyles?.backgroundColor,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectText(overlay.id);
                      }}
                    >
                      {overlay.text || ''}
                    </div>
                  )
                ) : (
                  <img
                    src={overlay.image}
                    alt={`오버레이 ${index + 1}`}
                    className="object-cover pointer-events-none"
                    style={{
                      width: (overlay.baseWidth * overlay.scalePercent) / 100,
                      height: (overlay.baseHeight * overlay.scalePercent) / 100,
                    }}
                    draggable={false}
                  />
                )}
              </div>
              {!isText && shouldShowFrame && overlay.linkUrl?.trim() && (
                <div className="pointer-events-none absolute right-2 top-2 z-40" aria-hidden>
                  <IconLinkWhite
                    className="h-4 w-4"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))',
                    }}
                  />
                </div>
              )}
              {isSelected && !isDragging && (
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
                    className="pointer-events-auto absolute -top-1.5 -left-1.5 z-30 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#98FF7C]"
                    aria-label="요소 제거"
                  >
                    <IconClose className="h-[14px] w-[14px]" aria-hidden />
                  </button>
                  {!isText ? (
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
                        onOpenImageEdit?.(overlay.id);
                      }}
                      className="pointer-events-auto absolute -bottom-1.5 -left-1.5 z-30 flex h-7 w-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#98FF7C]"
                      aria-label={`${overlay.type === 'image' && overlay.linkUrl?.trim() ? '링크 설정' : '스티커 수정'}`}
                    >
                      <IconEdit className="h-4 w-4" aria-hidden />
                    </button>
                  ) : (
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
                        startEditingTextOverlay(overlay.id);
                        onSelectText(overlay.id);
                      }}
                      className="pointer-events-auto absolute -bottom-1.5 -left-1.5 z-30 flex h-7 w-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#98FF7C]"
                      aria-label="텍스트 편집"
                    >
                      <IconEdit className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <>
                    <button
                      type="button"
                      onMouseDown={(event) => startTransform(event, overlay, 'rotate')}
                      onTouchStart={(event) => startTransform(event, overlay, 'rotate')}
                      className="pointer-events-auto absolute -top-1.5 -right-1.5 z-30 flex h-7 w-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#98FF7C]"
                      aria-label="요소 회전"
                    >
                      <IconRotate className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => startTransform(event, overlay, 'scale')}
                      onTouchStart={(event) => startTransform(event, overlay, 'scale')}
                      className="pointer-events-auto absolute -bottom-1.5 -right-1.5 z-30 flex h-7 w-7 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#98FF7C]"
                      aria-label="요소 크기 조절"
                    >
                      <IconScale className="h-[14px] w-[14px]" aria-hidden />
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
