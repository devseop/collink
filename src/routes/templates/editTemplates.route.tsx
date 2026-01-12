import { createRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import templatesRoute from './templates.route';
import { useOverlayEditor, DEFAULT_IMAGE_SIZE, IMAGE_SCALE_PERCENT_MIN } from '../../hooks/overlay/useOverlayEditor';
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
import IconSticker from '../../assets/icons/ic_sticker.svg?react';
import IconLink from '../../assets/icons/ic_link.svg?react';
import IconImage from '../../assets/icons/ic_image.svg?react';
import IconClose from '../../assets/icons/ic_close.svg?react';
import IconDelete from '../../assets/icons/ic_delete_white.svg?react';
import IconText from '../../assets/icons/ic_text.svg?react';
import IconPaint from '../../assets/icons/ic_paint.svg?react';
import IconMotion from '../../assets/icons/ic_motion.svg?react';
import IconCloseWhite from '../../assets/icons/ic_close_white.svg?react';
import IconRotateWhite from '../../assets/icons/ic_rotate_white.svg?react';
import IconScaleWhite from '../../assets/icons/ic_scale_white.svg?react';
import { safeRandomUUID } from '../../utils/random';
import Header from '../../components/Header';
import NavigationButton from '../../components/NavigationButton';


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

const deriveScalePercentFromSize = (width: number, height: number) => {
  const maxDimension = Math.max(width, height, 1);
  const rawPercent = (maxDimension / DEFAULT_IMAGE_SIZE) * 100;
  return Math.max(IMAGE_SCALE_PERCENT_MIN, Math.round(rawPercent));
};

const getTextDecorationValue = (underline?: boolean, strikethrough?: boolean) => {
  const parts = [];
  if (underline) parts.push('underline');
  if (strikethrough) parts.push('line-through');
  return parts.length ? parts.join(' ') : 'none';
};

const getEventPoint = (event: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent) => {
  if ('touches' in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
  }
  return { x: event.clientX, y: event.clientY };
};

const normalizeRotation = (value: number) => {
  const mod = value % 360;
  return mod < 0 ? mod + 360 : mod;
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
      const scalePercent = deriveScalePercentFromSize(templateWidth, templateHeight);
      overlays.push({
        id: safeRandomUUID(),
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
        id: safeRandomUUID(),
        type: 'text',
        text: item.text ?? '',
        fontSize: item.font?.size ?? DEFAULT_TEXT_FONT_SIZE,
        fontWeight: item.font?.weight ?? DEFAULT_TEXT_FONT_WEIGHT,
        fontFamily: item.font?.family ?? DEFAULT_TEXT_FONT_FAMILY,
        rotation: item.rotation ?? 0,
        scalePercent: IMAGE_SCALE_DEFAULT_PERCENT,
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
        left.rotation !== right.rotation ||
        left.scalePercent !== right.scalePercent ||
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
    const [backgroundOptionsSource, setBackgroundOptionsSource] = useState<'empty' | 'navbar' | null>(null);
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
    const isOverlayFocused = Boolean(selectedImageId || selectedTextId || editingOverlayId);
    const isEmptyState = !previewImage && !isBackgroundColored && overlays.length === 0;
    const showBackgroundToggle = backgroundOptionsSource === 'navbar';
    const colorPickerValue = backgroundColor ?? '#FFFFFF';
    
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

    const overlayElementRefs = useRef<Record<string, HTMLElement | null>>({});
    const textTapRef = useRef<{ id: string | null; time: number }>({ id: null, time: 0 });
    const textTouchRef = useRef<{ id: string | null; x: number; y: number; moved: boolean }>({
      id: null,
      x: 0,
      y: 0,
      moved: false,
    });
    const transformRef = useRef<{
      mode: 'rotate' | 'scale';
      overlayId: string;
      centerX: number;
      centerY: number;
      startAngle: number;
      startRotation: number;
      startDistance: number;
      startScale: number;
    } | null>(null);
    const transformMoveRef = useRef<(event: MouseEvent | TouchEvent) => void>(() => {});
    const transformEndRef = useRef<(event?: Event) => void>(() => {});

    const stopTransform = useCallback(() => {
      const moveHandler = transformMoveRef.current;
      const endHandler = transformEndRef.current;
      if (moveHandler) {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('touchmove', moveHandler);
      }
      if (endHandler) {
        window.removeEventListener('mouseup', endHandler);
        window.removeEventListener('touchend', endHandler);
        window.removeEventListener('touchcancel', endHandler);
      }
      transformMoveRef.current = () => {};
      transformEndRef.current = () => {};
      transformRef.current = null;
    }, []);

    const handleTransformMove = useCallback(
      (event: MouseEvent | TouchEvent) => {
        const active = transformRef.current;
        if (!active) return;
        if ('preventDefault' in event && event.cancelable) {
          event.preventDefault();
        }
        const point = getEventPoint(event);
        if (active.mode === 'rotate') {
          const angle = Math.atan2(point.y - active.centerY, point.x - active.centerX);
          const delta = angle - active.startAngle;
          const nextRotation = normalizeRotation(active.startRotation + (delta * 180) / Math.PI);
          updateImageRotation(active.overlayId, nextRotation);
          return;
        }
        if (active.startDistance === 0) return;
        const distance = Math.hypot(point.x - active.centerX, point.y - active.centerY);
        const nextScale = Math.max(
          IMAGE_SCALE_PERCENT_MIN,
          Math.round(active.startScale * (distance / active.startDistance))
        );
        updateImageScalePercent(active.overlayId, nextScale);
      },
      [updateImageRotation, updateImageScalePercent]
    );

    const startTransform = useCallback(
      (event: ReactMouseEvent | ReactTouchEvent, overlay: Overlay, mode: 'rotate' | 'scale') => {
        const overlayElement = overlayElementRefs.current[overlay.id];
        if (!overlayElement) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = overlayElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const point = getEventPoint(event);
        const startAngle = Math.atan2(point.y - centerY, point.x - centerX);
        const startDistance = Math.hypot(point.x - centerX, point.y - centerY);
        transformRef.current = {
          mode,
          overlayId: overlay.id,
          centerX,
          centerY,
          startAngle,
          startRotation: overlay.rotation ?? 0,
          startDistance,
          startScale: overlay.scalePercent ?? IMAGE_SCALE_DEFAULT_PERCENT,
        };

        const moveHandler = (moveEvent: MouseEvent | TouchEvent) => handleTransformMove(moveEvent);
        const endHandler = () => stopTransform();
        transformMoveRef.current = moveHandler;
        transformEndRef.current = endHandler;
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', endHandler);
        window.addEventListener('touchmove', moveHandler, { passive: false });
        window.addEventListener('touchend', endHandler);
        window.addEventListener('touchcancel', endHandler);
      },
      [handleTransformMove, stopTransform]
    );

    useEffect(() => stopTransform, [stopTransform]);

    const handleTextOverlayTouchEnd = useCallback(
      (event: ReactTouchEvent, overlayId: string) => {
        const now = Date.now();
        if (textTouchRef.current.id === overlayId && textTouchRef.current.moved) {
          textTouchRef.current = { id: null, x: 0, y: 0, moved: false };
          return;
        }
        const last = textTapRef.current;
        const isDoubleTap = last.id === overlayId && now - last.time < 280;
        textTapRef.current = { id: overlayId, time: now };
        if (!isDoubleTap) return;
        event.preventDefault();
        event.stopPropagation();
        startEditingTextOverlay(overlayId);
        setSelectedTextId(overlayId);
      },
      [startEditingTextOverlay]
    );

    const handleTextOverlayTouchStart = useCallback((event: ReactTouchEvent, overlayId: string) => {
      const touch = event.touches[0];
      if (!touch) return;
      textTouchRef.current = { id: overlayId, x: touch.clientX, y: touch.clientY, moved: false };
    }, []);

    const handleTextOverlayTouchMove = useCallback((event: ReactTouchEvent, overlayId: string) => {
      if (textTouchRef.current.id !== overlayId) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - textTouchRef.current.x;
      const deltaY = touch.clientY - textTouchRef.current.y;
      if (Math.hypot(deltaX, deltaY) > 6) {
        textTouchRef.current.moved = true;
      }
    }, []);

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

        {isEmptyState && (
          <div className='flex justify-center items-center px-5 pt-[68px] pb-12 h-dvh'>
          <div className="w-full h-full min-w-[320px] border border-dashed border-[#CFCFCF] rounded-2xl  text-center bg-white/70">
            <div className='flex flex-col items-center justify-center h-full'>
                <div className="mx-auto mb-4 flex items-center justify-center">
                  <IconImage className="h-14 w-14 text-[#222222]" aria-hidden />
                </div>
                <div className='flex flex-col items-center justify-center gap-2 mt-3 mb-6'>
                  <p className="text-sm font-medium text-[#222222] leading-none">원하는 이미지나 배경색을 선택해주세요.</p>
                  <p className="text-xs font-regular text-[#7A7A7A] leading-none">50MB 이하의 JPEG, PNG, and MP4만 가능해요.</p>
                </div>
                <div className="flex flex-row gap-3 justify-center">
                  <button
                    onClick={() => triggerBackgroundSelect()}
                    className="w-fit rounded-lg border border-[#D3D3D3] px-4 py-[10px] text-sm font-medium text-[#222222] leading-none"
                  >
                    이미지 고르기
                  </button>
                  <button
                    onClick={() => {
                      setBackgroundOptionsSource('empty');
                      setBackgroundMode('color');
                      setShowBackgroundOptions(true);
                    }}
                    className="w-fit rounded-lg border border-[#D3D3D3] px-4 py-[10px] text-sm font-medium text-[#222222] leading-none"
                  >
                    배경색 고르기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {overlays.map((overlay, index) => {
          const isText = overlay.type === 'text';
          const isEditing = isText && editingOverlayId === overlay.id;
          const isSelected = selectedImageId === overlay.id || selectedTextId === overlay.id;

            return (
              <div
                key={overlay.id}
                className={`fixed z-20 touch-none ${isSelected ? 'p-2' : ''}`}
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
                          textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                          transform: `rotate(${overlay.rotation ?? 0}deg) scale(${(overlay.scalePercent ?? IMAGE_SCALE_DEFAULT_PERCENT) / 100})`,
                          transformOrigin: 'center',
                        }}
                        placeholder=""
                        />
                    ) : (
                      // focused state
                      <div
                        ref={(node) => {
                          overlayElementRefs.current[overlay.id] = node;
                        }}
                        className="w-[140px] min-h-[24px] text-shadow-lg/30 text-center cursor-text touch-manipulation"
                        style={{
                          fontSize: `${overlay.fontSize}px`,
                          fontWeight: overlay.fontWeight,
                          fontFamily: overlay.fontFamily,
                          textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                          transform: `rotate(${overlay.rotation ?? 0}deg) scale(${(overlay.scalePercent ?? IMAGE_SCALE_DEFAULT_PERCENT) / 100})`,
                          transformOrigin: 'center',
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedTextId(overlay.id);
                        }}
                        onTouchStart={(event) => handleTextOverlayTouchStart(event, overlay.id)}
                        onTouchMove={(event) => handleTextOverlayTouchMove(event, overlay.id)}
                        onTouchEnd={(event) => handleTextOverlayTouchEnd(event, overlay.id)}
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          startEditingTextOverlay(overlay.id);
                          setSelectedTextId(overlay.id);
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

        {/* 오버레이 수정 모달 */}
        {(selectedImageOverlay || selectedTextOverlay) && (
          <div
            className="fixed left-0 right-0 bottom-0 z-50 bg-white/95 backdrop-blur-sm border-t border-black/5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-4 py-4"
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            {/* 이미지 오버레이 수정 모달 */}
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

            {/* 텍스트 오버레이 수정 모달 */}
            {selectedTextOverlay && (
              <div className="flex flex-col gap-3">
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
          </div>
        )}

        {/* 이미지 추가 모달 */}
        {showBackgroundOptions && (
          <div className="fixed left-0 right-0 bottom-0 z-50">
            <div
              className={`mb-0 bg-white backdrop-blur-sm shadow-[0_-1px_12px_rgba(0,0,0,0.2)] flex flex-col  rounded-t-lg ${showBackgroundToggle ? 'gap-2 rounded-b-lg' : 'gap-5'}`}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
            >
              <div className={`grid grid-cols-[1fr_auto_1fr] items-center px-5 py-5 ${!showBackgroundToggle && 'border-b border-[#D3D3D3]'}`}>
                <p className="col-start-2 text-base font-semibold text-[#222222] leading-none text-center">
                  {!showBackgroundToggle ? '배경색 고르기' : '배경 수정'}
                </p>
                <button
                  onClick={() => {
                    setShowBackgroundOptions(false);
                    setBackgroundOptionsSource(null);
                  }}
                  className="col-start-3 justify-self-end"
                >
                  <IconClose className="h-4 w-4 text-[#222222]" aria-hidden />
                </button>
              </div>
              <div className="flex flex-col gap-4">
              {showBackgroundToggle && (
                <div className="flex items-center justify-between ">
                  <div className="flex w-full">
                    <button
                      onClick={() => setBackgroundMode('image')}
                      className={`w-full text-base pb-2 border-b ${
                        backgroundMode === 'image' ? 'font-bold text-[#222222] border-[#222222] border-b-2 border-b-solid' : 'text-[#6B6B6B] border-[#D3D3D3]'
                      }`}
                    >
                      이미지
                    </button>
                    <button
                      onClick={() => setBackgroundMode('color')}
                      className={`w-full text-base pb-2 border-b ${
                        backgroundMode === 'color' ? 'font-bold text-[#222222] border-[#222222] border-b-2 border-b-solid' : 'text-[#6B6B6B] border-[#D3D3D3]'
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
                    <div className='flex flex-col items-center justify-center gap-2 mt-3 mb-6'>
                      <p className="text-sm font-medium text-[#222222] leading-none">원하는 이미지나 배경색을 선택해주세요.</p>
                      <p className="text-xs font-regular text-[#7A7A7A] leading-none">50MB 이하의 JPEG, PNG, and MP4만 가능해요.</p>
                    </div>
                    </div>
                  <button
                    onClick={() => {
                      triggerBackgroundSelect();
                      setIsBackgroundColored(false);
                      setShowBackgroundOptions(false);
                      setBackgroundOptionsSource(null);
                    }}
                    className='w-full py-4 rounded-lg flex items-center justify-center text-[#222222] leading-none font-bold bg-[#B1FF8D]'
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
                      className='w-full py-4 rounded-lg flex items-center justify-center text-[#222222] leading-none font-bold bg-[#B1FF8D]'
                    >
                      적용하기
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        {/* 오버레이 추가 nav bar */}
        {!isOverlayFocused && !showBackgroundOptions && !isEmptyState && (
          <div className="fixed inset-x-0 bottom-10 z-50 grid place-items-center">
            <div className="flex gap-2 w-fit px-4 rounded-xl bg-white shadow-lg">
              <NavigationButton 
                onClick={() => {
                  setBackgroundOptionsSource('navbar');
                  setBackgroundMode('image');
                  setShowBackgroundOptions(true);
                }}
                aria-label="배경 이미지 추가"
              >
                <IconImage className="w-6 h-6 text-[#222222]" aria-hidden />
                <span className="text-xs font-medium text-[#222222] leading-none">배경</span>
              </NavigationButton>
              <NavigationButton 
                onClick={triggerOverlaySelect}
                aria-label="스티커 추가"
              >
                <IconSticker className="w-6 h-6 text-[#222222]" aria-hidden />
                <span className="text-xs font-medium text-[#222222] leading-none">스티커</span>
              </NavigationButton>
              <NavigationButton 
                onClick={triggerOverlaySelect}
                aria-label="링크 추가"
              >
                <IconLink className="w-6 h-6 text-[#222222]" aria-hidden />
                <span className="text-xs font-medium text-[#222222] leading-none">링크</span>
              </NavigationButton> 
              <NavigationButton 
                onClick={() => addTextOverlay()}
                aria-label="텍스트 추가"
              >
                <IconText className="w-6 h-6 text-[#222222]" aria-hidden />
                <span className="text-xs font-medium text-[#222222] leading-none">텍스트</span>
              </NavigationButton> 
              <NavigationButton 
                onClick={() => console.log('모션 추가')}
                aria-label="모션 추가"
              >
                <IconMotion className="w-6 h-6 text-[#222222]" aria-hidden />
                <span className="text-xs font-medium text-[#222222] leading-none">모션</span>
              </NavigationButton> 
            </div>
          </div>
        )}
        {/* next button */}
        {/* <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
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
        </div> */}
      </div>
    );
  },
});

export default editTemplatesRoute;
