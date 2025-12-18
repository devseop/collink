import { createRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import templatesRoute from './templates.route';
import { useOverlayEditor, DEFAULT_IMAGE_SIZE, getImageScalePercentMax } from '../../hooks/overlay/useOverlayEditor';
import type { DefaultTemplate } from '../../types/templates';
import type { Overlay } from '../../types/overlay';
import { useAuth } from '../../hooks/useAuth';
import router from '../router';
import { useTemplateSelectionStore } from '../../stores/templateSelectionStore';
import { HexColorPicker } from 'react-colorful';
import { useTemplateEditorStore, type TemplateEditorSnapshot } from '../../stores/templateEditorStore';
import {
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_TEXT_FONT_WEIGHT,
  FALLBACK_POSITION,
  IMAGE_SCALE_DEFAULT_PERCENT,
  TEXT_FONT_FAMILIES,
  TEXT_FONT_SIZES,
  TEXT_FONT_WEIGHTS,
} from '../../constants/templates';
import IconArrowRight from '../../assets/icons/ic_arrow_right.svg?react';
import IconBackground from '../../assets/icons/ic_background.svg?react';
import IconLink from '../../assets/icons/ic_link.svg?react';
import IconImage from '../../assets/icons/ic_image.svg?react';
import Header from '../../components/Header';


const clampScalePercent = (value: number, maxPercent: number, minPercent = IMAGE_SCALE_DEFAULT_PERCENT) =>
  Math.max(minPercent, Math.min(value, Math.max(maxPercent, minPercent)));

const computeBaseDimensions = (width?: number, height?: number) => {
  const safeWidth = width ?? DEFAULT_IMAGE_SIZE;
  const safeHeight = height ?? DEFAULT_IMAGE_SIZE;
  const maxDimension = Math.max(safeWidth, safeHeight);
  if (maxDimension === 0) {
    return {
      baseWidth: DEFAULT_IMAGE_SIZE,
      baseHeight: DEFAULT_IMAGE_SIZE,
    };
  }
  const normalizationScale = DEFAULT_IMAGE_SIZE / maxDimension;
  return {
    baseWidth: safeWidth * normalizationScale,
    baseHeight: safeHeight * normalizationScale,
  };
};

const deriveScalePercentFromSize = (width: number, height: number, maxPercent: number) => {
  const maxDimension = Math.max(width, height, 1);
  const rawPercent = (maxDimension / DEFAULT_IMAGE_SIZE) * 100;
  return clampScalePercent(Math.round(rawPercent), maxPercent);
};

const getTextDecorationValue = (underline?: boolean, strikethrough?: boolean) => {
  const parts = [];
  if (underline) parts.push('underline');
  if (strikethrough) parts.push('line-through');
  return parts.length ? parts.join(' ') : 'none';
};

type EditorInitialState = {
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  isBackgroundColored: boolean;
  overlays: Overlay[];
};

const mapTemplateToEditorState = (template: DefaultTemplate | null): EditorInitialState => {
  if (!template) {
    return {
      backgroundImageUrl: null,
      backgroundColor: null,
      isBackgroundColored: false,
      overlays: [],
    };
  }

  const overlays: Overlay[] = [];
    const items = template.items ?? [];

    items.forEach((item) => {
      const basePosition = {
        x: item.coordinates?.x ?? FALLBACK_POSITION.x,
        y: item.coordinates?.y ?? FALLBACK_POSITION.y,
      };

    if (item.imageUrl) {
      const templateWidth = item.size?.width ?? DEFAULT_IMAGE_SIZE;
      const templateHeight = item.size?.height ?? DEFAULT_IMAGE_SIZE;
      const { baseWidth, baseHeight } = computeBaseDimensions(templateWidth, templateHeight);
      const maxScalePercent = getImageScalePercentMax(baseWidth, baseHeight);
      const scalePercent = deriveScalePercentFromSize(templateWidth, templateHeight, maxScalePercent);
      overlays.push({
        id: crypto.randomUUID(),
        type: 'image',
        image: item.imageUrl,
        file: null,
        ...basePosition,
        rotation: item.rotation ?? 0,
        baseWidth,
        baseHeight,
        scalePercent,
        linkUrl: item.linkUrl ?? undefined,
      });
      return;
    }

    if (item.text || item.font) {
      overlays.push({
        id: crypto.randomUUID(),
        type: 'text',
        text: item.text ?? '',
        fontSize: item.font?.size ?? DEFAULT_TEXT_FONT_SIZE,
        fontWeight: item.font?.weight ?? DEFAULT_TEXT_FONT_WEIGHT,
        fontFamily: item.font?.family ?? DEFAULT_TEXT_FONT_FAMILY,
        underline: item.font?.decoration?.includes('underline'),
        strikethrough: item.font?.decoration?.includes('line-through'),
        ...basePosition,
      });
    }
  });

  console.log('mapTemplateToEditorState', template);

  return {
    backgroundImageUrl: template.backgroundImageUrl ?? null,
    backgroundColor: template.backgroundColor ?? null,
    isBackgroundColored: Boolean(template.isBackgroundColored),
    overlays,
  };
};

const overlaysEqual = (a: Overlay[], b: Overlay[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left.type !== right.type) return false;
    if (left.id !== right.id || left.x !== right.x || left.y !== right.y) return false;
    if (left.type === 'image' && right.type === 'image') {
      if (
        left.image !== right.image ||
        left.file !== right.file ||
        left.rotation !== right.rotation ||
        left.baseWidth !== right.baseWidth ||
        left.baseHeight !== right.baseHeight ||
        left.scalePercent !== right.scalePercent ||
        left.linkUrl !== right.linkUrl
      ) {
        return false;
      }
    } else if (left.type === 'text' && right.type === 'text') {
      if (
        left.text !== right.text ||
        left.fontSize !== right.fontSize ||
        left.fontWeight !== right.fontWeight ||
        left.fontFamily !== right.fontFamily ||
        left.underline !== right.underline ||
        left.strikethrough !== right.strikethrough
      ) {
        return false;
      }
    }
  }
  return true;
};

const editTemplatesRoute = createRoute({
  path: 'edit',
  getParentRoute: () => templatesRoute,
  component: function EditTemplatesPage() {
    const selectedTemplate = useTemplateSelectionStore((state) => state.selectedTemplate);
    const replaceDraft = useTemplateEditorStore((state) => state.replaceDraft);
    const commitDraft = useTemplateEditorStore((state) => state.commitDraft);
    const draftSnapshot = useTemplateEditorStore((state) => state.draft);
    const committedSnapshot = useTemplateEditorStore((state) => state.committed);
    const initialSnapshotRef = useRef<TemplateEditorSnapshot | null>(null);
    const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
    const [backgroundMode, setBackgroundMode] = useState<'image' | 'color'>('image');
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    
    const initialEditorState = useMemo(() => {
      const hasCommitted =
        committedSnapshot &&
        (committedSnapshot.overlays.length > 0 ||
          committedSnapshot.backgroundImageUrl ||
          committedSnapshot.isBackgroundColored);
      if (hasCommitted) {
        return {
          backgroundImageUrl: committedSnapshot!.backgroundImageUrl,
          backgroundColor: committedSnapshot!.backgroundColor,
          isBackgroundColored: committedSnapshot!.isBackgroundColored,
          overlays: committedSnapshot!.overlays.map((overlay) => ({ ...overlay })),
        };
      }
      const hasDraft =
        draftSnapshot &&
        (draftSnapshot.overlays.length > 0 ||
          draftSnapshot.backgroundImageUrl ||
          draftSnapshot.isBackgroundColored);
      if (hasDraft) {
        return {
          backgroundImageUrl: draftSnapshot!.backgroundImageUrl,
          backgroundColor: draftSnapshot!.backgroundColor,
          isBackgroundColored: draftSnapshot!.isBackgroundColored,
          overlays: draftSnapshot!.overlays.map((overlay) => ({ ...overlay })),
        };
      }
      return mapTemplateToEditorState(selectedTemplate);
    }, [committedSnapshot, draftSnapshot, selectedTemplate]);

    const { user } = useAuth();
    const {
      previewImage,
      backgroundFile,
      overlays,
      maxOverlays,
      backgroundInputRef,
      overlayInputRef,
      handleBackgroundChange,
      handleOverlayChange,
      addTextOverlay,
      updateTextOverlay,
      removeOverlay,
      handleOverlayMouseDown,
      handleOverlayTouchStart,
      triggerBackgroundSelect,
      triggerOverlaySelect,
      editingOverlayId,
      startEditingTextOverlay,
      finishEditingTextOverlay,
      backgroundColor,
      isBackgroundColored,
      setBackgroundColor,
      setIsBackgroundColored,
      resetBackgroundImage,
      updateImageRotation,
      updateTextStyle,
      updateImageScalePercent,
      lastAddedImageOverlayId,
      updateImageLink,
      moveUp,
      moveDown,
    } = useOverlayEditor({
      initialBackgroundImageUrl: initialEditorState.backgroundImageUrl,
      initialBackgroundColor: initialEditorState.backgroundColor,
      initialIsBackgroundColored: initialEditorState.isBackgroundColored,
      initialOverlays: initialEditorState.overlays,
    });

    const colorPickerValue = backgroundColor ?? '#FFFFFF';
    // Capture initial editor state once for change detection
    useEffect(() => {
      if (initialSnapshotRef.current) return;
      initialSnapshotRef.current = {
        backgroundImageUrl: previewImage,
        backgroundFile,
        backgroundColor,
        isBackgroundColored,
        overlays: overlays.map((overlay) => ({ ...overlay })),
      };
    }, [backgroundColor, backgroundFile, isBackgroundColored, overlays, previewImage]);

    const hasChanges = useMemo(() => {
      const initial = initialSnapshotRef.current;
      if (!initial) return false;
      const current: TemplateEditorSnapshot = {
        backgroundImageUrl: previewImage,
        backgroundFile,
        backgroundColor,
        isBackgroundColored,
        overlays,
      };
      const backgroundDiff =
        initial.backgroundImageUrl !== current.backgroundImageUrl ||
        initial.backgroundFile !== current.backgroundFile ||
        initial.backgroundColor !== current.backgroundColor ||
        initial.isBackgroundColored !== current.isBackgroundColored;
      const overlayDiff = !overlaysEqual(initial.overlays, current.overlays);
      return backgroundDiff || overlayDiff;
    }, [backgroundColor, backgroundFile, isBackgroundColored, overlays, previewImage]);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [didSave, setDidSave] = useState(false);

    const selectedImageOverlay = useMemo(
      () =>
        overlays.find(
          (overlay): overlay is Overlay & { type: 'image' } =>
            overlay.type === 'image' && overlay.id === selectedImageId
        ) ?? null,
      [overlays, selectedImageId]
    );

    const selectedTextOverlay = useMemo(
      () =>
        overlays.find(
      (overlay): overlay is Overlay & { type: 'text' } =>
        overlay.type === 'text' && overlay.id === selectedTextId
    ) ?? null,
      [overlays, selectedTextId]
    );

    const [linkInputValue, setLinkInputValue] = useState('');
    const selectedImageScaleMax = selectedImageOverlay
      ? getImageScalePercentMax(selectedImageOverlay.baseWidth, selectedImageOverlay.baseHeight)
      : IMAGE_SCALE_DEFAULT_PERCENT;
    const selectedImageSizePercent = selectedImageOverlay
      ? clampScalePercent(selectedImageOverlay.scalePercent, selectedImageScaleMax)
      : IMAGE_SCALE_DEFAULT_PERCENT;

    const selectedImageIndex = useMemo(
      () => (selectedImageOverlay ? overlays.findIndex((overlay) => overlay.id === selectedImageOverlay.id) : -1),
      [overlays, selectedImageOverlay]
    );
    const selectedTextIndex = useMemo(
      () => (selectedTextOverlay ? overlays.findIndex((overlay) => overlay.id === selectedTextOverlay.id) : -1),
      [overlays, selectedTextOverlay]
    );
    const canMoveImageUp = selectedImageIndex >= 0 && selectedImageIndex < overlays.length - 1;
    const canMoveImageDown = selectedImageIndex > 0;
    const canMoveTextUp = selectedTextIndex >= 0 && selectedTextIndex < overlays.length - 1;
    const canMoveTextDown = selectedTextIndex > 0;

    useEffect(() => {
      if (!editingOverlayId) return;
      const editingOverlay = overlays.find((overlay) => overlay.id === editingOverlayId);
      if (editingOverlay?.type === 'text') {
        setSelectedTextId(editingOverlay.id);
        setSelectedImageId(null);
      }
    }, [editingOverlayId, overlays]);

    useEffect(() => {
      if (!lastAddedImageOverlayId) return;
      setSelectedImageId(lastAddedImageOverlayId);
      setSelectedTextId(null);
    }, [lastAddedImageOverlayId]);

    useEffect(() => {
      setLinkInputValue(selectedImageOverlay?.linkUrl ?? '');
    }, [selectedImageOverlay]);

    const handleSaveTemplate = useCallback(async () => {
      if (!user) {
        setSaveError('로그인 후 저장할 수 있어요.');
        setDidSave(false);
        return;
      }

      if (overlays.length === 0) {
        setSaveError('최소 한 개 이상의 요소를 추가해주세요.');
        setDidSave(false);
        return;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        const snapshot: TemplateEditorSnapshot = {
          backgroundImageUrl: previewImage,
          backgroundFile,
          backgroundColor,
          isBackgroundColored,
          overlays: overlays.map((overlay) => ({ ...overlay })),
        };

        replaceDraft(snapshot, selectedTemplate?.id ?? null);
        commitDraft(selectedTemplate?.id ?? null);

        setDidSave(true);
        router.navigate({ to: '/templates/preview' });
      } catch (error) {
        setDidSave(false);
        setSaveError(error instanceof Error ? error.message : '템플릿 저장에 실패했습니다.');
      } finally {
        setIsSaving(false);
      }
    }, [
      user,
      overlays,
      previewImage,
      backgroundFile,
      isBackgroundColored,
      backgroundColor,
      replaceDraft,
      commitDraft,
      selectedTemplate?.id,
    ]);

    const handleSelectColor = useCallback(
      (color: string) => {
        resetBackgroundImage();
        setIsBackgroundColored(true);
        setBackgroundColor(color);
      },
      [resetBackgroundImage, setBackgroundColor, setIsBackgroundColored]
    );

    const canSave = Boolean(user) && overlays.length > 0 && !isSaving;

    const handleBackgroundPointerDown = useCallback(() => {
      finishEditingTextOverlay();
      setSelectedImageId(null);
      setSelectedTextId(null);
    }, [finishEditingTextOverlay]);

    const handleRemoveOverlayElement = useCallback(
      (overlayId: string) => {
        removeOverlay(overlayId);
        setSelectedImageId((current) => (current === overlayId ? null : current));
        setSelectedTextId((current) => (current === overlayId ? null : current));
      },
      [removeOverlay]
    );

    const handleRotationChange = useCallback(
      (rotation: number) => {
        if (!selectedImageId) return;
        updateImageRotation(selectedImageId, rotation);
      },
      [selectedImageId, updateImageRotation]
    );

    const handleImageScaleChange = useCallback(
      (sizePercent: number) => {
        if (!selectedImageId) return;
        const clampedValue = clampScalePercent(sizePercent, selectedImageScaleMax);
        updateImageScalePercent(selectedImageId, clampedValue);
      },
      [selectedImageId, selectedImageScaleMax, updateImageScalePercent]
    );

    const handleLinkUrlConfirm = useCallback(() => {
      if (!selectedImageOverlay) return;
      const trimmed = linkInputValue.trim();
      updateImageLink(selectedImageOverlay.id, trimmed || undefined);
    }, [linkInputValue, selectedImageOverlay, updateImageLink]);

    const handleTextStyleChange = useCallback(
      (style: { fontFamily?: string; fontSize?: number; fontWeight?: number; underline?: boolean; strikethrough?: boolean }) => {
        if (!selectedTextId) return;
        updateTextStyle(selectedTextId, style);
      },
      [selectedTextId, updateTextStyle]
    );

  return (
      <div
        className="relative w-full h-screen overflow-hidden"
        onMouseDown={handleBackgroundPointerDown}
        onTouchStart={handleBackgroundPointerDown}
      >
        <Header useConfirmOnBack={hasChanges} />
        {previewImage && (
          <div className="fixed inset-0 z-0">
            <img src={previewImage} alt="미리보기" className="w-full h-full object-cover" />
          </div>
        )}
        {!previewImage && isBackgroundColored && backgroundColor && (
          <div
            className="fixed inset-0 z-0"
            style={{ backgroundColor }}
          />
        )}

        {overlays.map((overlay, index) => {
          const isText = overlay.type === 'text';
          const isEditing = isText && editingOverlayId === overlay.id;

            return (
              <div
                key={overlay.id}
                className={`fixed z-20 touch-none ${
                  selectedImageId === overlay.id || selectedTextId === overlay.id ? 'ring-2 ring-[#FF5C00]' : ''
                }`}
                style={{
                  left: `${overlay.x}px`,
                  top: `${overlay.y}px`,
                  touchAction: 'none',
                }}
                onMouseDown={
                  !isEditing ? (event) => handleOverlayMouseDown(event, overlay.id) : undefined
                }
                onTouchStart={
                  !isEditing ? (event) => handleOverlayTouchStart(event, overlay.id) : undefined
                }
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isText) {
                    setSelectedImageId(overlay.id);
                    setSelectedTextId(null);
                  } else {
                    setSelectedImageId(null);
                    setSelectedTextId(overlay.id);
                  }
                }}
              >
              <div className="relative">
                {isText ? (
                  isEditing ? (
                    <textarea
                      autoFocus
                      value={overlay.text}
                      onChange={(event) => updateTextOverlay(overlay.id, event.target.value)}
                      onBlur={() => finishEditingTextOverlay()}
                      onMouseDown={(event) => event.stopPropagation()}
                      className="min-w-[140px] min-h-[48px] rounded-lg bg-white/90 border border-black/20 px-3 py-2 shadow-lg text-center focus:outline-none focus:ring-2 focus:ring-black"
                      style={{
                        fontSize: `${overlay.fontSize}px`,
                        fontWeight: overlay.fontWeight,
                        fontFamily: overlay.fontFamily,
                        textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                      }}
                      placeholder="텍스트를 입력하세요"
                    />
                  ) : (
                    <div
                      className="min-w-[140px] min-h-[48px] rounded-lg bg-white/40 backdrop-blur-sm border border-white px-4 py-3 shadow-lg text-center cursor-text"
                      style={{
                        fontSize: `${overlay.fontSize}px`,
                        fontWeight: overlay.fontWeight,
                        fontFamily: overlay.fontFamily,
                        textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditingTextOverlay(overlay.id);
                        setSelectedTextId(overlay.id);
                      }}
                    >
                      {overlay.text || '텍스트를 입력하세요'}
                    </div>
                  )
                ) : (
                  <img
                    src={overlay.image}
                    alt={`오버레이 ${index + 1}`}
                    className="object-cover rounded-lg shadow-lg border-2 border-white pointer-events-none"
                    style={{
                      width: (overlay.baseWidth * overlay.scalePercent) / 100,
                      height: (overlay.baseHeight * overlay.scalePercent) / 100,
                      transform: `rotate(${overlay.rotation ?? 0}deg)`,
                    }}
                    draggable={false}
                  />
                )}
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveOverlayElement(overlay.id);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs z-40"
                  aria-label="요소 제거"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}

        <input
          type="file"
          accept="image/*"
          ref={backgroundInputRef}
          className="hidden"
          onChange={handleBackgroundChange}
        />
        <input
          type="file"
          accept="image/*"
          ref={overlayInputRef}
          className="hidden"
          onChange={handleOverlayChange}
        />

        {selectedImageOverlay && (
          <div
            className="fixed left-4 right-4 bottom-28 z-50 bg-white rounded-2xl shadow-xl border border-black/5 p-4 flex flex-col gap-2"
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#101010]">이미지 회전</p>
              <span className="text-xs text-[#6B6B6B]">{Math.round(selectedImageOverlay.rotation ?? 0)}°</span>
            </div>
            <input
              type="range"
              min={-90}
              max={90}
              value={selectedImageOverlay.rotation}
              onChange={(event) => handleRotationChange(Number(event.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-[#A0A0A0]">
              <span>-90°</span>
              <span>0°</span>
              <span>90°</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm font-semibold text-[#101010]">이미지 크기</p>
              <span className="text-xs text-[#6B6B6B]">{selectedImageSizePercent}%</span>
            </div>
            <input
              type="range"
              min={IMAGE_SCALE_DEFAULT_PERCENT}
              max={selectedImageScaleMax}
              value={selectedImageSizePercent}
              onChange={(event) => handleImageScaleChange(Number(event.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-[#A0A0A0]">
              <span>default</span>
              <span>max</span>
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
        {selectedTextOverlay && (
          <div
            className="fixed left-4 right-4 bottom-28 z-50 bg-white rounded-2xl shadow-xl border border-black/5 p-4 flex flex-col gap-4"
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
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
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#101010]">폰트 스타일</p>
              <div className="flex gap-2">
                {TEXT_FONT_FAMILIES.map((family) => (
                  <button
                    key={family.value}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      selectedTextOverlay.fontFamily === family.value
                        ? 'bg-black text-white border-black'
                        : 'bg-[#F5F5F5] text-[#5E5E5E] border-transparent'
                    }`}
                    onClick={() => handleTextStyleChange({ fontFamily: family.value })}
                  >
                    {family.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#101010]">크기</p>
              <div className="grid grid-cols-3 gap-2">
                {TEXT_FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    className={`px-3 py-2 rounded-lg border text-xs ${
                      selectedTextOverlay.fontSize === size.value
                        ? 'bg-black text-white border-black'
                        : 'bg-[#F5F5F5] text-[#5E5E5E] border-transparent'
                    }`}
                    onClick={() => handleTextStyleChange({ fontSize: size.value })}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#101010]">굵기</p>
              <div className="grid grid-cols-3 gap-2">
                {TEXT_FONT_WEIGHTS.map((weight) => (
                  <button
                    key={weight.value}
                    className={`px-3 py-2 rounded-lg border text-xs ${
                      selectedTextOverlay.fontWeight === weight.value
                        ? 'bg-black text-white border-black'
                        : 'bg-[#F5F5F5] text-[#5E5E5E] border-transparent'
                    }`}
                    onClick={() => handleTextStyleChange({ fontWeight: weight.value })}
                  >
                    {weight.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#101010]">꾸미기</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`px-3 py-2 rounded-lg border text-xs ${
                    selectedTextOverlay.underline
                      ? 'bg-black text-white border-black'
                      : 'bg-[#F5F5F5] text-[#5E5E5E] border-transparent'
                  }`}
                  onClick={() => handleTextStyleChange({ underline: !selectedTextOverlay.underline })}
                >
                  밑줄
                </button>
                <button
                  className={`px-3 py-2 rounded-lg border text-xs ${
                    selectedTextOverlay.strikethrough
                      ? 'bg-black text-white border-black'
                      : 'bg-[#F5F5F5] text-[#5E5E5E] border-transparent'
                  }`}
                  onClick={() => handleTextStyleChange({ strikethrough: !selectedTextOverlay.strikethrough })}
                >
                  취소선
                </button>
              </div>
            </div>
          </div>
        )}
        {showBackgroundOptions && (
          <div className="fixed left-4 bottom-24 z-50 w-[280px] rounded-2xl bg-white shadow-xl border border-black/5 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setBackgroundMode('image')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    backgroundMode === 'image' ? 'bg-black text-white' : 'bg-[#F3F3F3] text-[#6B6B6B]'
                  }`}
                >
                  이미지
                </button>
                <button
                  onClick={() => setBackgroundMode('color')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    backgroundMode === 'color' ? 'bg-black text-white' : 'bg-[#F3F3F3] text-[#6B6B6B]'
                  }`}
                >
                  단색
                </button>
              </div>
              <button
                onClick={() => setShowBackgroundOptions(false)}
                className="text-xs text-[#6B6B6B] hover:text-black"
              >
                닫기
              </button>
            </div>
            {backgroundMode === 'image' ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[#6B6B6B]">이미지를 업로드해 배경으로 사용할 수 있어요.</p>
                <button
                  onClick={() => {
                    triggerBackgroundSelect();
                    setIsBackgroundColored(false);
                    setShowBackgroundOptions(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-black text-white text-sm font-semibold"
                >
                  이미지 업로드
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <HexColorPicker color={colorPickerValue} onChange={handleSelectColor} className="w-full" />
                <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                  <span className="font-mono">{colorPickerValue.toUpperCase()}</span>
                  <button
                    onClick={() => setShowBackgroundOptions(false)}
                    className="px-2 py-1 rounded-md bg-black text-white text-xs"
                  >
                    적용
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="fixed left-4 bottom-4 z-50 flex gap-2">
          <button
            onClick={() => {
              setBackgroundMode('image');
              setShowBackgroundOptions((prev) => !prev);
            }}
            className="px-3 py-3 transition-colors"
            aria-label="배경 이미지 추가"
          >
            <IconBackground className="w-5 h-5" aria-hidden />
          </button>
          <button
            onClick={triggerOverlaySelect}
            disabled={overlays.length >= maxOverlays}
            className="px-3 py-3 transition-colors"
            aria-label="링크 추가"
          >
            <IconLink className="w-5 h-5" aria-hidden />
          </button>
          <button
            onClick={triggerOverlaySelect}
            disabled={overlays.length >= maxOverlays}
            className="px-3 py-3 transition-colors"
            aria-label="이미지 추가"
          >
            <IconImage className="w-5 h-5" aria-hidden />
          </button>
          <button
            onClick={() => addTextOverlay()}
            disabled={overlays.length >= maxOverlays}
            className="px-3 py-3 transition-colors font-medium text-md"
          >
            Aa
          </button>

          <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
            <button
              onClick={handleSaveTemplate}
              disabled={!canSave || Boolean(editingOverlayId)}
              className="px-3 py-3 bg-[#B1FF8D] text-white font-semibold rounded-full shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="다음"
            >
              <IconArrowRight className="w-5 h-5" aria-hidden />
            </button>
            {!user && <p className="text-xs text-red-500">로그인이 필요합니다.</p>}
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            {didSave && !saveError && (
              <p className="text-xs text-emerald-600">저장되었습니다. 선택 화면으로 이동합니다.</p>
            )}
          </div>
        </div>

        
      </div>
    );
  },
});

export default editTemplatesRoute;
