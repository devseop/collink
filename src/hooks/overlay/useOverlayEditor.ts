import { useCallback, useEffect, useState } from 'react';
import { clampScalePercent, computeBaseDimensions, getImageScalePercentMax } from '../../utils/overlayMath';
import type { Overlay, TextOverlay } from '../../types/overlay';
import { useOverlayDrag } from './useOverlayDrag';
import { useOverlayFiles } from './useOverlayFiles';

type UseOverlayEditorOptions = {
  maxOverlays?: number;
  initialBackgroundImageUrl?: string | null;
  initialBackgroundColor?: string | null;
  initialOverlays?: Overlay[];
  initialIsBackgroundColored?: boolean;
};

const DEFAULT_MAX_OVERLAYS = 5;

export function useOverlayEditor(options: UseOverlayEditorOptions = {}) {
  const {
    maxOverlays = DEFAULT_MAX_OVERLAYS,
    initialBackgroundImageUrl,
    initialBackgroundColor,
    initialIsBackgroundColored,
    initialOverlays,
  } = options;

  const [previewImage, setPreviewImage] = useState<string | null>(initialBackgroundImageUrl ?? null);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(
    initialIsBackgroundColored ? initialBackgroundColor ?? '#FFFFFF' : null
  );
  const [isBackgroundColored, setIsBackgroundColored] = useState<boolean>(Boolean(initialIsBackgroundColored));
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const getOverlayMaxScalePercent = useCallback(
    (baseWidth: number, baseHeight: number) => getImageScalePercentMax(baseWidth, baseHeight),
    []
  );
  const normalizeOverlay = useCallback((overlay: Overlay): Overlay => {
    if (overlay.type === 'image') {
      const { baseWidth, baseHeight } = computeBaseDimensions(overlay.baseWidth, overlay.baseHeight);
      const maxScalePercent = getOverlayMaxScalePercent(baseWidth, baseHeight);
      return {
        ...overlay,
        baseWidth,
        baseHeight,
        scalePercent: clampScalePercent(overlay.scalePercent ?? 100, maxScalePercent),
      };
    }
    return overlay;
  }, [getOverlayMaxScalePercent]);
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
        id: crypto.randomUUID(),
        type: 'text',
        text: initialText,
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'classic',
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
    (overlayId: string, style: Partial<Pick<TextOverlay, 'fontFamily' | 'fontSize' | 'fontWeight'>>) => {
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

  const { handleOverlayMouseDown, handleOverlayTouchStart } = useOverlayDrag({
    overlays,
    editingOverlayId,
    setOverlays,
  });

  const resetBackgroundImage = useCallback(() => {
    setPreviewImage(null);
    setBackgroundFile(null);
  }, []);

  const updateImageRotation = useCallback((overlayId: string, rotation: number) => {
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId && overlay.type === 'image'
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
        overlay.id === overlayId && overlay.type === 'image'
          ? {
              ...overlay,
              scalePercent: clampScalePercent(
                scalePercent,
                getOverlayMaxScalePercent(overlay.baseWidth, overlay.baseHeight)
              ),
            }
          : overlay
      )
    );
  }, [getOverlayMaxScalePercent]);

  const startEditingTextOverlay = useCallback((overlayId: string) => {
    setEditingOverlayId(overlayId);
  }, []);

  const finishEditingTextOverlay = useCallback(() => {
    setEditingOverlayId(null);
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
      setOverlays(initialOverlays.map(normalizeOverlay));
    }
  }, [initialOverlays, normalizeOverlay]);

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
  };
}

export { DEFAULT_IMAGE_SIZE, IMAGE_SCALE_PERCENT_MIN, getImageScalePercentMax } from '../../utils/overlayMath';
export type { Overlay, ImageOverlay, TextOverlay } from '../../types/overlay';
