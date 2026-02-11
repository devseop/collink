import { useCallback, useEffect, useState } from 'react';
import { computeBaseDimensions, IMAGE_SCALE_PERCENT_MIN } from '../../utils/overlayMath';
import { safeRandomUUID } from '../../utils/random';
import type { Overlay, TextOverlay } from '../../types/overlay';
import { useOverlayDrag } from './useOverlayDrag';
import { useOverlayFiles } from './useOverlayFiles';

type UseOverlayEditorOptions = {
  maxOverlays?: number;
  initialBackgroundImageUrl?: string | null;
  initialBackgroundColor?: string | null;
  initialOverlays?: Overlay[];
  initialIsBackgroundColored?: boolean;
  getContainerRect?: () => DOMRect | null;
  getVerticalDragBounds?: () => { top: number; bottom: number } | null;
};

const DEFAULT_MAX_OVERLAYS = 5;

const overlaysEqual = (left: Overlay[], right: Overlay[]) => {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];

    if (a.type !== b.type || a.id !== b.id || a.x !== b.x || a.y !== b.y) {
      return false;
    }

    if (a.type === 'image' && b.type === 'image') {
      if (
        a.image !== b.image ||
        a.file !== b.file ||
        a.rotation !== b.rotation ||
        a.baseWidth !== b.baseWidth ||
        a.baseHeight !== b.baseHeight ||
        a.scalePercent !== b.scalePercent ||
        a.linkUrl !== b.linkUrl ||
        a.linkDescription !== b.linkDescription
      ) {
        return false;
      }
      continue;
    }

    if (a.type === 'text' && b.type === 'text') {
      if (
        a.text !== b.text ||
        a.fontSize !== b.fontSize ||
        a.fontWeight !== b.fontWeight ||
        a.fontFamily !== b.fontFamily ||
        a.rotation !== b.rotation ||
        a.scalePercent !== b.scalePercent ||
        a.textColor !== b.textColor ||
        a.boxStyle !== b.boxStyle ||
        a.underline !== b.underline ||
        a.strikethrough !== b.strikethrough
      ) {
        return false;
      }
    }
  }

  return true;
};

export function useOverlayEditor(options: UseOverlayEditorOptions = {}) {
  const {
    maxOverlays = DEFAULT_MAX_OVERLAYS,
    initialBackgroundImageUrl,
    initialBackgroundColor,
    initialIsBackgroundColored,
    initialOverlays,
    getContainerRect,
    getVerticalDragBounds,
  } = options;

  const [previewImage, setPreviewImage] = useState<string | null>(initialBackgroundImageUrl ?? null);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(
    initialIsBackgroundColored ? initialBackgroundColor ?? '#FFFFFF' : null
  );
  const [isBackgroundColored, setIsBackgroundColored] = useState<boolean>(Boolean(initialIsBackgroundColored));
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const normalizeOverlay = useCallback((overlay: Overlay): Overlay => {
    if (overlay.type === 'image') {
      const { baseWidth, baseHeight } = computeBaseDimensions(overlay.baseWidth, overlay.baseHeight);
      return {
        ...overlay,
        baseWidth,
        baseHeight,
        scalePercent: Math.max(IMAGE_SCALE_PERCENT_MIN, overlay.scalePercent ?? 100),
      };
    }
    return {
      ...overlay,
      rotation: overlay.rotation ?? 0,
      scalePercent: Math.max(IMAGE_SCALE_PERCENT_MIN, overlay.scalePercent ?? 100),
      textColor: overlay.textColor ?? '#222222',
      boxStyle: overlay.boxStyle ?? 0,
    };
  }, []);
  const [overlays, setOverlays] = useState<Overlay[]>(() =>
    initialOverlays ? initialOverlays.map(normalizeOverlay) : []
  );
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [lastAddedImageOverlayId, setLastAddedImageOverlayId] = useState<string | null>(null);
  const overlayCount = overlays.length;

  const {
    backgroundInputRef,
    overlayInputRef,
    handleBackgroundChange,
    handleOverlayChange,
    triggerBackgroundSelect,
    triggerOverlaySelect,
  } = useOverlayFiles({
    maxOverlays,
    setPreviewImage,
    setBackgroundColor,
    setIsBackgroundColored,
    setBackgroundFile,
    setLastAddedImageOverlayId,
    setOverlays,
    overlayCount,
  });

  const addTextOverlay = useCallback((initialText = '') => {
    setOverlays((prev) => {
      const newOverlay: TextOverlay = {
        id: safeRandomUUID(),
        type: 'text',
        text: initialText,
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'classic',
        textColor: '#222222',
        boxStyle: 0,
        rotation: 0,
        scalePercent: 100,
        underline: false,
        strikethrough: false,
        x: 140 + prev.length * 20,
        y: 140 + prev.length * 20,
      };
      setEditingOverlayId(newOverlay.id);
      return [...prev, newOverlay];
    });
  }, []);

  const updateTextOverlay = useCallback((overlayId: string, text: string) => {
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId && overlay.type === 'text'
          ? {
              ...overlay,
              text,
            }
          : overlay
      )
    );
  }, []);
  const updateTextStyle = useCallback(
    (
      overlayId: string,
      style: Partial<Pick<TextOverlay, 'fontFamily' | 'fontSize' | 'fontWeight' | 'underline' | 'strikethrough' | 'textColor' | 'boxStyle'>>
    ) => {
      setOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId && overlay.type === 'text'
            ? {
                ...overlay,
                ...style,
              }
            : overlay
        )
      );
    },
    []
  );

  const removeOverlay = useCallback((overlayId: string) => {
    setOverlays((prev) => prev.filter((overlay) => overlay.id !== overlayId));
    setEditingOverlayId((current) => (current === overlayId ? null : current));
  }, []);

  const { handleOverlayMouseDown, handleOverlayTouchStart, draggingOverlayId } = useOverlayDrag({
    overlays,
    editingOverlayId,
    setOverlays,
    getContainerRect,
    getVerticalDragBounds,
  });

  const resetBackgroundImage = useCallback(() => {
    setPreviewImage(null);
    setBackgroundFile(null);
  }, []);

  const updateImageRotation = useCallback((overlayId: string, rotation: number) => {
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId
          ? {
              ...overlay,
              rotation,
            }
          : overlay
      )
    );
  }, []);

  const updateImageScalePercent = useCallback((overlayId: string, scalePercent: number) => {
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId
          ? {
              ...overlay,
              scalePercent: Math.max(IMAGE_SCALE_PERCENT_MIN, scalePercent),
            }
          : overlay
      )
    );
  }, []);

  const startEditingTextOverlay = useCallback((overlayId: string) => {
    setEditingOverlayId(overlayId);
  }, []);

  const finishEditingTextOverlay = useCallback(() => {
    setEditingOverlayId(null);
  }, []);

  const updateImageLink = useCallback((overlayId: string, linkUrl?: string, linkDescription?: string) => {
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId && overlay.type === 'image'
          ? {
              ...overlay,
              linkUrl,
              linkDescription,
            }
          : overlay
      )
    );
  }, []);

  useEffect(() => {
    if (initialBackgroundImageUrl !== undefined) {
      setPreviewImage(initialBackgroundImageUrl ?? null);
      if (initialBackgroundImageUrl) {
        setBackgroundColor(null);
        setIsBackgroundColored(false);
      }
    }
  }, [initialBackgroundImageUrl]);

  useEffect(() => {
    if (initialIsBackgroundColored !== undefined) {
      setIsBackgroundColored(Boolean(initialIsBackgroundColored));
      setBackgroundColor(initialIsBackgroundColored ? initialBackgroundColor ?? '#FFFFFF' : null);
      if (initialIsBackgroundColored) {
        setPreviewImage(null);
      }
    }
  }, [initialIsBackgroundColored, initialBackgroundColor]);

  useEffect(() => {
    if (initialOverlays) {
      const normalizedInitialOverlays = initialOverlays.map(normalizeOverlay);
      setOverlays((currentOverlays) =>
        overlaysEqual(currentOverlays, normalizedInitialOverlays)
          ? currentOverlays
          : normalizedInitialOverlays
      );
    }
  }, [initialOverlays, normalizeOverlay]);

  const moveOverlay = useCallback((overlayId: string, delta: 1 | -1) => {
    setOverlays((prev) => {
      const index = prev.findIndex((overlay) => overlay.id === overlayId);
      if (index < 0) return prev;
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }, []);

  const moveUp = useCallback((overlayId: string) => moveOverlay(overlayId, 1), [moveOverlay]);

  const moveDown = useCallback((overlayId: string) => moveOverlay(overlayId, -1), [moveOverlay]);

  const reorderImageOverlays = useCallback((nextImageIds: string[]) => {
    setOverlays((prev) => {
      if (nextImageIds.length === 0) return prev;
      const imageMap = new Map(
        prev.filter((overlay) => overlay.type === 'image').map((overlay) => [overlay.id, overlay])
      );
      let imageIndex = 0;
      return prev.map((overlay) => {
        if (overlay.type !== 'image') return overlay;
        const nextId = nextImageIds[imageIndex];
        imageIndex += 1;
        const nextOverlay = nextId ? imageMap.get(nextId) : undefined;
        return nextOverlay ?? overlay;
      });
    });
  }, []);

  return {
    previewImage,
    backgroundFile,
    backgroundColor,
    isBackgroundColored,
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
    draggingOverlayId,
    triggerBackgroundSelect,
    triggerOverlaySelect,
    editingOverlayId,
    startEditingTextOverlay,
    finishEditingTextOverlay,
    setBackgroundColor,
    setIsBackgroundColored,
    resetBackgroundImage,
    setPreviewImage,
    updateImageRotation,
    updateImageScalePercent,
    updateTextStyle,
    lastAddedImageOverlayId,
    updateImageLink,
    moveUp,
    moveDown,
    reorderImageOverlays,
  };
}

export { DEFAULT_IMAGE_SIZE, IMAGE_SCALE_PERCENT_MIN, getImageScalePercentMax } from '../../utils/overlayMath';
export type { Overlay, ImageOverlay, TextOverlay } from '../../types/overlay';
