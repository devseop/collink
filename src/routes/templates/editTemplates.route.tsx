import { createRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import templatesRoute from './templates.route';
import { useOverlayEditor, IMAGE_SCALE_PERCENT_MIN } from '../../hooks/overlay/useOverlayEditor';
import type { Overlay } from '../../types/overlay';
import type { DroppableCollectionReorderEvent } from '@react-types/shared';
import { useAuth } from '../../hooks/useAuth';
import router from '../router';
import { useTemplateSelectionStore } from '../../stores/templateSelectionStore';
import { useTemplateEditorStore, type TemplateEditorSnapshot } from '../../stores/templateEditorStore';
import { IMAGE_SCALE_DEFAULT_PERCENT } from '../../constants/templates';
import Header from '../../components/Header';
import { uploadTemplateAsset, uploadTemplateThumbnail } from '../../api/storageAPI';
import { createCustomTemplate, updateCustomTemplate } from '../../api/templateAPI';
import EmptyState from './components/EmptyState';
import OverlayCanvas from './components/OverlayCanvas';
import OverlayEditModal from './components/OverlayEditModal';
import BackgroundOptionsModal from './components/BackgroundOptionsModal';
import OverlayNavBar from './components/OverlayNavBar';
import { useOverlaySelectionState } from '../../hooks/templates/useOverlaySelectionState';
import { useGetTemplateById } from '../../hooks/templates/useGetTemplateById';
import { mapOverlayToTemplateItem, mapTemplateToEditorState } from '../../utils/editorOverlayMapper';
import AnimationSelector from './components/AnimationSelector';
import { safeRandomUUID } from '../../utils/random';
import { loadFonts } from '../../utils/loadFonts';
import { FONT_OPTIONS } from '../../constants/fonts';
import { useScreenshot } from 'use-react-screenshot';


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

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });

const createThumbnailBlob = async (dataUrl: string, targetWidth = 270) => {
  const img = await loadImageElement(dataUrl);
  const width = Math.min(targetWidth, img.width);
  const scale = width / img.width;
  const height = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
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
  validateSearch: (search: Record<string, unknown>) => ({
    templateId: typeof search.templateId === 'string' ? search.templateId : undefined,
  }),
  component: function EditTemplatesPage() {
    const { templateId } = editTemplatesRoute.useSearch();
    const selectedTemplate = useTemplateSelectionStore((state) => state.selectedTemplate);
    const queryClient = useQueryClient();
    const setDraft = useTemplateEditorStore((state) => state.setDraft);
    const replaceDraft = useTemplateEditorStore((state) => state.replaceDraft);
    const commitDraft = useTemplateEditorStore((state) => state.commitDraft);
    const resetAll = useTemplateEditorStore((state) => state.resetAll);
    const draftSnapshot = useTemplateEditorStore((state) => state.draft);
    const committedSnapshot = useTemplateEditorStore((state) => state.committed);
    const initialSnapshotRef = useRef<TemplateEditorSnapshot | null>(null);
    const { data: editingTemplate, isLoading: isEditingTemplateLoading } = useGetTemplateById(templateId);
    const captureRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
    const [backgroundMode, setBackgroundMode] = useState<'image' | 'color'>('image');
    const [backgroundOptionsSource, setBackgroundOptionsSource] = useState<'empty' | 'navbar' | null>(null);
    const initialAnimationType = useMemo<AnimationType>(
      () =>
        (committedSnapshot?.animationType as AnimationType | undefined) ??
        (draftSnapshot?.animationType as AnimationType | undefined) ??
        (templateId ? (editingTemplate?.animationType as AnimationType | undefined) : undefined) ??
        'default',
      [committedSnapshot, draftSnapshot, templateId, editingTemplate?.animationType]
    );
    const [animationType, setAnimationType] = useState<AnimationType>(initialAnimationType);
    const [animationPreviewType, setAnimationPreviewType] = useState<AnimationType>(initialAnimationType);
    const [isAnimationPreviewActive, setIsAnimationPreviewActive] = useState(false);
    const [isAnimationPreviewing, setIsAnimationPreviewing] = useState(false);
    const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });
    const [showMotionOptions, setShowMotionOptions] = useState(false);
    const [, takeScreenshot] = useScreenshot({ type: 'image/jpeg', quality: 0.92 });
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
      if (templateId) {
        return mapTemplateToEditorState(editingTemplate ?? null);
      }
      return mapTemplateToEditorState(selectedTemplate);
    }, [committedSnapshot, draftSnapshot, selectedTemplate, templateId, editingTemplate]);

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
      draggingOverlayId,
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
      reorderImageOverlays,
    } = useOverlayEditor({
      initialBackgroundImageUrl: initialEditorState.backgroundImageUrl,
      initialBackgroundColor: initialEditorState.backgroundColor,
      initialIsBackgroundColored: initialEditorState.isBackgroundColored,
      initialOverlays: initialEditorState.overlays,
      getContainerRect: () => contentRef.current?.getBoundingClientRect() ?? null,
    });
    const persistDraftSnapshot = useCallback(() => {
      setDraft({
        backgroundImageUrl: previewImage,
        backgroundFile,
        backgroundColor,
        isBackgroundColored,
        overlays: overlays.map((overlay) => ({ ...overlay })),
        animationType,
      });
    }, [setDraft, previewImage, backgroundFile, backgroundColor, isBackgroundColored, overlays, animationType]);

    useEffect(() => {
      persistDraftSnapshot();
    }, [persistDraftSnapshot]);

    const isEmptyState = !previewImage && !isBackgroundColored && overlays.length === 0;
    const showBackgroundToggle = backgroundOptionsSource === 'navbar';
    const colorPickerValue = backgroundColor ?? '#FFFFFF';
    const imageOverlays = useMemo(
      () => overlays.filter((overlay): overlay is Overlay & { type: 'image' } => overlay.type === 'image'),
      [overlays]
    );

    useEffect(() => {
      initialSnapshotRef.current = null;
    }, [templateId]);
    
    useEffect(() => {
      if (templateId && isEditingTemplateLoading) return;
      if (initialSnapshotRef.current) return;
      initialSnapshotRef.current = {
        backgroundImageUrl: previewImage,
        backgroundFile,
        backgroundColor,
        isBackgroundColored,
        overlays: overlays.map((overlay) => ({ ...overlay })),
        animationType,
      };
    }, [backgroundColor, backgroundFile, isBackgroundColored, overlays, previewImage, animationType, templateId, isEditingTemplateLoading]);

    useEffect(() => {
      loadFonts(FONT_OPTIONS).catch(() => {});
    }, []);

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

    if (templateId && !isEditingTemplateLoading && !editingTemplate) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          404 not found
        </div>
      );
    }

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const node = contentRef.current;
      const updateFromRect = (rect: DOMRectReadOnly) => {
        setViewportCenter({ x: rect.width / 2, y: rect.height / 2 });
      };

      if (!node) {
        setViewportCenter({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        return;
      }

      updateFromRect(node.getBoundingClientRect());
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) updateFromRect(entry.contentRect);
      });
      observer.observe(node);
      return () => observer.disconnect();
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

    const [isStickerSheetOpen, setIsStickerSheetOpen] = useState(false);


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
      if (templateId && !editingTemplate) {
        setSaveError('편집할 템플릿을 찾을 수 없어요.');
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

        const sourceTemplateId = templateId ?? selectedTemplate?.id ?? null;
        replaceDraft(snapshot, sourceTemplateId);
        commitDraft(sourceTemplateId);

        let thumbnailUrl: string | undefined;
        
        if (captureRef.current) {
          try {
            setSelectedImageId(null);
            setSelectedTextId(null);
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });
            const screenshot = await takeScreenshot(captureRef.current);
            if (screenshot) {
              const blob = await createThumbnailBlob(screenshot);
              if (blob) {
                thumbnailUrl = await uploadTemplateThumbnail({ file: blob, userId: user.id });
              }
            }
          } catch {
            thumbnailUrl = undefined;
          }
        }

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
        const canvasRect = captureRef.current?.getBoundingClientRect();
        const canvasWidth = Math.round(canvasRect?.width ?? window.innerWidth);
        const canvasHeight = Math.round(canvasRect?.height ?? window.innerHeight);

        if (templateId) {
          await updateCustomTemplate({
            templateId,
            userId: user.id,
            backgroundImageUrl,
            backgroundColor: shouldUseColor ? backgroundColor ?? undefined : undefined,
            isBackgroundColored: shouldUseColor,
            thumbnailUrl,
            items,
            isPublished: editingTemplate?.isPublished ?? false,
            animationType,
            category: editingTemplate?.category ?? undefined,
            canvasWidth,
            canvasHeight,
          });
          await queryClient.invalidateQueries({ queryKey: ['templatesByUser', user.id] });
          await queryClient.invalidateQueries({ queryKey: ['publishedTemplate', user.id] });
          setDidSave(true);
          resetAll();
          router.navigate({
            to: '/users/$userId/profile',
            params: { userId: user.id },
            search: { toast: 'updated' },
            replace: true,
          });
        } else {
          const customTemplateId = safeRandomUUID();
          await createCustomTemplate({
            customTemplateId,
            userId: user.id,
            backgroundImageUrl,
            backgroundColor: shouldUseColor ? backgroundColor ?? undefined : undefined,
            isBackgroundColored: shouldUseColor,
            thumbnailUrl,
            items,
            isPublished: true,
            animationType,
            canvasWidth,
            canvasHeight,
          });
          setDidSave(true);
          resetAll();
          router.navigate({ to: '/templates/completed', search: { mode: 'create' } });
        }
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
      templateId,
      editingTemplate,
      queryClient,
      setSelectedImageId,
      setSelectedTextId,
      replaceDraft,
      commitDraft,
      resetAll,
      selectedTemplate?.id,
      takeScreenshot,
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

    const handleRemoveImageFromSheet = useCallback(
      (overlayId: string) => {
        const currentIndex = imageOverlays.findIndex((overlay) => overlay.id === overlayId);
        const remaining = imageOverlays.filter((overlay) => overlay.id !== overlayId);
        const fallbackIndex = Math.min(currentIndex, Math.max(remaining.length - 1, 0));
        const fallbackId = remaining[fallbackIndex]?.id ?? null;

        removeOverlay(overlayId);
        setSelectedTextId((current) => (current === overlayId ? null : current));
        setSelectedImageId((current) => {
          if (current !== overlayId) return current;
          return fallbackId;
        });
      },
      [imageOverlays, removeOverlay, setSelectedImageId, setSelectedTextId]
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
      setIsStickerSheetOpen(false);
      setSelectedImageId(null);
      setSelectedTextId(null);
      finishEditingTextOverlay();
    }, [finishEditingTextOverlay, setSelectedImageId, setSelectedTextId]);

    useEffect(() => {
      if (!selectedImageId) {
        setIsStickerSheetOpen(false);
      }
    }, [selectedImageId]);

    const handleOpenStickerSheet = useCallback(
      (overlayId: string) => {
        setSelectedImageId(overlayId);
        setSelectedTextId(null);
        setIsStickerSheetOpen(true);
      },
      [setSelectedImageId, setSelectedTextId]
    );

    const handleReorderImages = useCallback(
      (event: DroppableCollectionReorderEvent) => {
        const { keys, target } = event;
        const imageIds = imageOverlays.map((overlay) => overlay.id);
        const movingIds = imageIds.filter((id) => keys.has(id));
        if (movingIds.length === 0) return;
        const next = imageIds.filter((id) => !movingIds.includes(id));
        const targetKey = String(target.key);
        let insertIndex = next.indexOf(targetKey);
        if (insertIndex < 0) {
          next.push(...movingIds);
        } else {
          if (target.dropPosition === 'after') {
            insertIndex += 1;
          }
          next.splice(insertIndex, 0, ...movingIds);
        }
        reorderImageOverlays(next);
      },
      [imageOverlays, reorderImageOverlays]
    );

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
        className="relative w-full h-[100dvh] overflow-hidden"
        onMouseDown={handleBackgroundPointerDown}
        onTouchStart={handleBackgroundPointerDown}
      >
        <Header
          useConfirmOnBack={hasChanges}
          templateTabs={{
            selectedKey: 'edit',
            onSelectionChange: (key) => {
              if (key === 'edit') return;
              persistDraftSnapshot();
              router.navigate({ to: '/templates/select' });
            },
          }}
          rightAction={{
            label: '공유',
            onClick: handleSaveTemplate,
            disabled: Boolean(editingOverlayId),
          }}
        />
        <div ref={captureRef} className="inset-0 z-0 w-full h-full object-cover">
          {previewImage && (
            <div className="inset-0 z-0 w-full h-full object-cover">
              <img src={previewImage} alt="미리보기" className="w-full h-full object-cover" />
            </div>
          )}
          {!previewImage && isBackgroundColored && backgroundColor && (
            <div
              className="inset-0 z-0 w-full h-full object-cover"
              style={{ backgroundColor }}
            />
          )}

          <div
            ref={contentRef}
            className="absolute left-[env(safe-area-inset-left)] right-[env(safe-area-inset-right)] top-[env(safe-area-inset-top)] bottom-[env(safe-area-inset-bottom)] overflow-hidden"
          >
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
              draggingOverlayId={draggingOverlayId}
              onOpenImageEdit={handleOpenStickerSheet}
              getTextDecorationValue={getTextDecorationValue}
              getTextBoxStyles={getTextBoxStyles}
            />
          </div>
        </div>

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
          isImageModalOpen={isStickerSheetOpen}
          imageOverlays={imageOverlays}
          selectedImageId={selectedImageId}
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
          onSelectImage={handleOpenStickerSheet}
          onRemoveImage={handleRemoveImageFromSheet}
          onReorderImages={handleReorderImages}
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
        
        {!showMotionOptions && !isStickerSheetOpen && !selectedTextId && (
          <OverlayNavBar
            isOverlayFocused={false}
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
      </div>
    );
  },
});

export default editTemplatesRoute;
