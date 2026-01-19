import { createRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import templatesRoute from './templates.route';
import { useOverlayEditor, IMAGE_SCALE_PERCENT_MIN } from '../../hooks/overlay/useOverlayEditor';
import type { Overlay } from '../../types/overlay';
import { useAuth } from '../../hooks/useAuth';
import router from '../router';
import { useTemplateSelectionStore } from '../../stores/templateSelectionStore';
import { useTemplateEditorStore, type TemplateEditorSnapshot } from '../../stores/templateEditorStore';
import { IMAGE_SCALE_DEFAULT_PERCENT } from '../../constants/templates';
import Header from '../../components/Header';
import { uploadTemplateAsset } from '../../api/storageAPI';
import { createCustomTemplate } from '../../api/templateAPI';
import EmptyState from './components/EmptyState';
import OverlayCanvas from './components/OverlayCanvas';
import OverlayEditModal from './components/OverlayEditModal';
import BackgroundOptionsModal from './components/BackgroundOptionsModal';
import OverlayNavBar from './components/OverlayNavBar';
import { useOverlaySelectionState } from '../../hooks/templates/useOverlaySelectionState';
import { mapOverlayToTemplateItem, mapTemplateToEditorState } from '../../utils/editorOverlayMapper';
import AnimationSelector from './components/AnimationSelector';
import { safeRandomUUID } from '../../utils/random';


const getTextDecorationValue = (underline?: boolean, strikethrough?: boolean) => {
  const parts = [];
  if (underline) parts.push('underline');
  if (strikethrough) parts.push('line-through');
  return parts.length ? parts.join(' ') : 'none';
};

const parseHexColor = (value: string) => {
  const raw = value.replace('#', '').trim();
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const toRgba = (hex: string, alpha: number) => {
  const rgb = parseHexColor(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const getTextBoxStyles = (color: string, boxStyle?: number) => {
  const baseColor = color || '#222222';
  const faded = toRgba(baseColor, 0.1);
  if (boxStyle === 1) {
    return { color: baseColor, backgroundColor: faded };
  }
  if (boxStyle === 2) {
    return { color: faded, backgroundColor: baseColor };
  }
  return { color: baseColor, backgroundColor: 'transparent' };
};

const getEventPoint = (event: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent) => {
  if ('touches' in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
  }
  return { x: event.clientX, y: event.clientY };
};

const normalizeLinkUrl = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const normalizeRotation = (value: number) => {
  const mod = value % 360;
  return mod < 0 ? mod + 360 : mod;
};

type AnimationType = 'default' | 'spread' | 'collage';

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
        left.linkUrl !== right.linkUrl ||
        left.linkDescription !== right.linkDescription
      ) {
        return false;
      }
    } else if (left.type === 'text' && right.type === 'text') {
      if (
        left.text !== right.text ||
        left.fontSize !== right.fontSize ||
        left.fontWeight !== right.fontWeight ||
        left.fontFamily !== right.fontFamily ||
        left.textColor !== right.textColor ||
        left.boxStyle !== right.boxStyle ||
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
    const resetAll = useTemplateEditorStore((state) => state.resetAll);
    const draftSnapshot = useTemplateEditorStore((state) => state.draft);
    const committedSnapshot = useTemplateEditorStore((state) => state.committed);
    const initialSnapshotRef = useRef<TemplateEditorSnapshot | null>(null);
    const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
    const [backgroundMode, setBackgroundMode] = useState<'image' | 'color'>('image');
    const [backgroundOptionsSource, setBackgroundOptionsSource] = useState<'empty' | 'navbar' | null>(null);
    const initialAnimationType = useMemo<AnimationType>(
      () => (committedSnapshot?.animationType as AnimationType | undefined) ?? (draftSnapshot?.animationType as AnimationType | undefined) ?? 'default',
      [committedSnapshot, draftSnapshot]
    );
    const [animationType, setAnimationType] = useState<AnimationType>(initialAnimationType);
    const [animationPreviewType, setAnimationPreviewType] = useState<AnimationType>(initialAnimationType);
    const [isAnimationPreviewActive, setIsAnimationPreviewActive] = useState(false);
    const [isAnimationPreviewing, setIsAnimationPreviewing] = useState(false);
    const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });
    const [showMotionOptions, setShowMotionOptions] = useState(false);
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
      // maxOverlays,
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
        animationType,
      };
    }, [backgroundColor, backgroundFile, isBackgroundColored, overlays, previewImage, animationType]);

    const hasChanges = useMemo(() => {
      const initial = initialSnapshotRef.current;
      if (!initial) return false;
      const current: TemplateEditorSnapshot = {
        backgroundImageUrl: previewImage,
        backgroundFile,
        backgroundColor,
        isBackgroundColored,
        overlays,
        animationType,
      };
      const backgroundDiff =
        initial.backgroundImageUrl !== current.backgroundImageUrl ||
        initial.backgroundFile !== current.backgroundFile ||
        initial.backgroundColor !== current.backgroundColor ||
        initial.isBackgroundColored !== current.isBackgroundColored;
      const overlayDiff = !overlaysEqual(initial.overlays, current.overlays);
      const animationDiff = initial.animationType !== current.animationType;
      return backgroundDiff || overlayDiff || animationDiff;
    }, [backgroundColor, backgroundFile, isBackgroundColored, overlays, previewImage, animationType]);

    useEffect(() => {
      setAnimationType(initialAnimationType);
    }, [initialAnimationType]);

    useEffect(() => {
      setAnimationPreviewType(animationType);
    }, [animationType]);

    useEffect(() => {
      const updateCenter = () => {
        if (typeof window === 'undefined') return;
        setViewportCenter({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      };
      updateCenter();
      window.addEventListener('resize', updateCenter);
      return () => window.removeEventListener('resize', updateCenter);
    }, []);

    const triggerAnimationPreview = useCallback((nextType?: AnimationType) => {
      if (nextType) {
        setAnimationPreviewType(nextType);
      }
      setIsAnimationPreviewing(true);
      setIsAnimationPreviewActive(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimationPreviewActive(true));
      });
      window.setTimeout(() => setIsAnimationPreviewing(false), 900);
    }, []);

    const [, setIsSaving] = useState(false);
    const [, setSaveError] = useState<string | null>(null);
    const [, setDidSave] = useState(false);

    const {
      selectedImageId,
      setSelectedImageId,
      selectedTextId,
      setSelectedTextId,
      selectedImageOverlay,
      selectedTextOverlay,
      isOverlayFocused,
      isTextModalFloating,
      linkInputValue,
      setLinkInputValue,
      linkDescriptionInputValue,
      setLinkDescriptionInputValue,
      setIsLinkInputFocused,
      showTextColorPicker,
      setShowTextColorPicker,
      textColorValue,
      setTextColorValue,
      keyboardInset,
      handleBackgroundPointerDown,
      handleTextOverlayTouchStart,
      handleTextOverlayTouchMove,
      handleTextOverlayTouchEnd,
    } = useOverlaySelectionState({
      overlays,
      editingOverlayId,
      lastAddedImageOverlayId,
      finishEditingTextOverlay,
      startEditingTextOverlay,
    });

    useEffect(() => {
      if (typeof document === 'undefined') return;
      document.body.style.overflow = isOverlayFocused ? 'hidden' : '';
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOverlayFocused]);

    const selectedImageIndex = useMemo(
      () => (selectedImageOverlay ? overlays.findIndex((overlay) => overlay.id === selectedImageOverlay.id) : -1),
      [overlays, selectedImageOverlay]
    );
    const canMoveImageUp = selectedImageIndex >= 0 && selectedImageIndex < overlays.length - 1;
    const canMoveImageDown = selectedImageIndex > 0;

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
          animationType,
        };

        replaceDraft(snapshot, selectedTemplate?.id ?? null);
        commitDraft(selectedTemplate?.id ?? null);

        const backgroundImageUrl = backgroundFile
          ? await uploadTemplateAsset({
              file: backgroundFile,
              userId: user.id,
              folder: 'backgrounds',
            })
          : previewImage ?? undefined;
        const shouldUseColor = Boolean(isBackgroundColored && backgroundColor && !backgroundImageUrl);

        const items = await Promise.all(
          overlays.map(async (overlay, index) => {
            if (overlay.type === 'image') {
              const imageUrl =
                overlay.file && user
                  ? await uploadTemplateAsset({
                      file: overlay.file,
                      userId: user.id,
                      folder: 'overlays',
                    })
                  : overlay.image;
              const linkUrl = normalizeLinkUrl(overlay.linkUrl);
              return mapOverlayToTemplateItem(overlay, index, { imageUrl, linkUrl });
            }
            return mapOverlayToTemplateItem(overlay, index);
          })
        );

        const customTemplateId = safeRandomUUID();
        await createCustomTemplate({
          customTemplateId,
          userId: user.id,
          backgroundImageUrl,
          backgroundColor: shouldUseColor ? backgroundColor ?? undefined : undefined,
          isBackgroundColored: shouldUseColor,
          items,
          isPublished: true,
          animationType,
        });

        setDidSave(true);
        resetAll();
        router.navigate({ to: '/templates/completed' });
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
      animationType,
      replaceDraft,
      commitDraft,
      resetAll,
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

    const handleRemoveOverlayElement = useCallback(
      (overlayId: string) => {
        removeOverlay(overlayId);
        setSelectedImageId((current) => (current === overlayId ? null : current));
        setSelectedTextId((current) => (current === overlayId ? null : current));
      },
      [removeOverlay]
    );

    const overlayElementRefs = useRef<Record<string, HTMLElement | null>>({});
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


    const handleLinkUrlConfirm = useCallback(() => {
      if (!selectedImageOverlay) return;
      const trimmed = linkInputValue.trim();
      const descriptionTrimmed = linkDescriptionInputValue.trim();
      if (!trimmed) {
        updateImageLink(selectedImageOverlay.id, undefined, undefined);
        return;
      }
      updateImageLink(selectedImageOverlay.id, trimmed, descriptionTrimmed || undefined);
    }, [linkInputValue, linkDescriptionInputValue, selectedImageOverlay, updateImageLink]);

    const handleOverlayModalClose = useCallback(() => {
      setSelectedImageId(null);
      setSelectedTextId(null);
      finishEditingTextOverlay();
    }, [finishEditingTextOverlay, setSelectedImageId, setSelectedTextId]);

    const handleTextStyleChange = useCallback(
      (style: { fontFamily?: string; fontSize?: number; fontWeight?: number; underline?: boolean; strikethrough?: boolean; textColor?: string }) => {
        if (!selectedTextId) return;
        updateTextStyle(selectedTextId, style);
      },
      [selectedTextId, updateTextStyle]
    );

    const handleTextColorChange = useCallback(
      (color: string) => {
        setTextColorValue(color);
        if (!selectedTextId) return;
        updateTextStyle(selectedTextId, { textColor: color });
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
          <EmptyState
            onSelectImage={triggerBackgroundSelect}
            onSelectColor={() => {
              setBackgroundOptionsSource('empty');
              setBackgroundMode('color');
              setShowBackgroundOptions(true);
            }}
          />
        )}

        <OverlayCanvas
          overlays={overlays}
          selectedImageId={selectedImageId}
          selectedTextId={selectedTextId}
          editingOverlayId={editingOverlayId}
          overlayElementRefs={overlayElementRefs}
          imageScaleDefaultPercent={IMAGE_SCALE_DEFAULT_PERCENT}
          animationPreviewType={animationPreviewType}
          isAnimationPreviewActive={isAnimationPreviewActive}
          isAnimationPreviewing={isAnimationPreviewing}
          viewportCenter={viewportCenter}
          handleOverlayMouseDown={handleOverlayMouseDown}
          handleOverlayTouchStart={handleOverlayTouchStart}
          handleTextOverlayTouchStart={handleTextOverlayTouchStart}
          handleTextOverlayTouchMove={handleTextOverlayTouchMove}
          handleTextOverlayTouchEnd={handleTextOverlayTouchEnd}
          updateTextOverlay={updateTextOverlay}
          startEditingTextOverlay={startEditingTextOverlay}
          finishEditingTextOverlay={finishEditingTextOverlay}
          onSelectImage={(overlayId) => {
            setSelectedImageId(overlayId);
            setSelectedTextId(null);
          }}
          onSelectText={(overlayId) => {
            setSelectedImageId(null);
            setSelectedTextId(overlayId);
          }}
          handleRemoveOverlayElement={handleRemoveOverlayElement}
          startTransform={startTransform}
          getTextDecorationValue={getTextDecorationValue}
          getTextBoxStyles={getTextBoxStyles}
        />

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

        <OverlayEditModal
          selectedImageOverlay={selectedImageOverlay}
          selectedTextOverlay={selectedTextOverlay}
          editingOverlayId={editingOverlayId}
          isTextModalFloating={isTextModalFloating}
          keyboardInset={keyboardInset}
          linkInputValue={linkInputValue}
          setLinkInputValue={setLinkInputValue}
          linkDescriptionInputValue={linkDescriptionInputValue}
          setLinkDescriptionInputValue={setLinkDescriptionInputValue}
          setIsLinkInputFocused={setIsLinkInputFocused}
          handleLinkUrlConfirm={handleLinkUrlConfirm}
          handleClose={handleOverlayModalClose}
          moveUp={moveUp}
          moveDown={moveDown}
          canMoveImageUp={canMoveImageUp}
          canMoveImageDown={canMoveImageDown}
          showTextColorPicker={showTextColorPicker}
          setShowTextColorPicker={setShowTextColorPicker}
          textColorValue={textColorValue}
          handleTextColorChange={handleTextColorChange}
          handleTextStyleChange={handleTextStyleChange}
        />

        <BackgroundOptionsModal
          showBackgroundOptions={showBackgroundOptions}
          showBackgroundToggle={showBackgroundToggle}
          backgroundMode={backgroundMode}
          setBackgroundMode={setBackgroundMode}
          setShowBackgroundOptions={setShowBackgroundOptions}
          setBackgroundOptionsSource={setBackgroundOptionsSource}
          triggerBackgroundSelect={triggerBackgroundSelect}
          setIsBackgroundColored={setIsBackgroundColored}
          colorPickerValue={colorPickerValue}
          handleSelectColor={handleSelectColor}
        />

        {showMotionOptions && (
          <AnimationSelector
            animationType={animationType}
            onSelect={(value) => {
              setAnimationType(value);
              setAnimationPreviewType(value);
            }}
            onPreview={(value) => triggerAnimationPreview(value)}
            onApply={() => setShowMotionOptions(false)}
            onClose={() => setShowMotionOptions(false)}
          />
        )}
        
        {!showMotionOptions && (
          <OverlayNavBar
            isOverlayFocused={isOverlayFocused}
            showBackgroundOptions={showBackgroundOptions}
            isEmptyState={isEmptyState}
            onOpenBackgroundOptions={() => {
              setBackgroundOptionsSource('navbar');
              setBackgroundMode('image');
              setShowBackgroundOptions(true);
            }}
            onTriggerOverlaySelect={triggerOverlaySelect}
            onAddTextOverlay={addTextOverlay}
            onOpenMotionOptions={() => setShowMotionOptions(true)}
          />
        )}
        <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
          <button
            onClick={handleSaveTemplate}
            disabled={Boolean(editingOverlayId)}
            className="px-3 py-3 bg-[#B1FF8D] text-white font-semibold rounded-full shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="다음"
          >
            <p>다음</p>
          </button>
        </div>
      </div>
    );
  },
});

export default editTemplatesRoute;
