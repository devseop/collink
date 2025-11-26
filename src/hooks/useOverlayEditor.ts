import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';

type BaseOverlay = {
  id: string;
  x: number;
  y: number;
};

export const DEFAULT_IMAGE_SIZE = 80;
export const IMAGE_SCALE_PERCENT_MIN = 50;

const DEFAULT_VIEWPORT_WIDTH = 390;
const DEFAULT_VIEWPORT_HEIGHT = 844;

const clampScalePercent = (value: number, maxPercent: number) =>
  Math.max(IMAGE_SCALE_PERCENT_MIN, Math.min(value, Math.max(maxPercent, IMAGE_SCALE_PERCENT_MIN)));

const getViewportSize = (viewportWidth?: number, viewportHeight?: number) => {
  if (typeof viewportWidth === 'number' && typeof viewportHeight === 'number') {
    return { width: viewportWidth, height: viewportHeight };
  }
  if (typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT };
};

export const getImageScalePercentMax = (
  baseWidth: number,
  baseHeight: number,
  viewportWidth?: number,
  viewportHeight?: number
) => {
  const { width, height } = getViewportSize(viewportWidth, viewportHeight);
  const safeBaseWidth = baseWidth || DEFAULT_IMAGE_SIZE;
  const safeBaseHeight = baseHeight || DEFAULT_IMAGE_SIZE;
  const maxPercent = Math.max(
    (width / safeBaseWidth) * 100,
    (height / safeBaseHeight) * 100,
    IMAGE_SCALE_PERCENT_MIN
  );
  return Math.round(maxPercent);
};

const computeBaseDimensions = (width: number, height: number) => {
  const safeWidth = width || DEFAULT_IMAGE_SIZE;
  const safeHeight = height || DEFAULT_IMAGE_SIZE;
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

// const deriveScalePercentFromSize = (width: number, height: number, maxPercent: number) => {
//   const maxDimension = Math.max(width, height, 1);
//   const rawPercent = (maxDimension / DEFAULT_IMAGE_SIZE) * 100;
//   return clampScalePercent(Math.round(rawPercent), maxPercent);
// };

export type ImageOverlay = BaseOverlay & {
  type: 'image';
  image: string;
  file?: File | null;
  rotation: number;
  baseWidth: number;
  baseHeight: number;
  scalePercent: number;
};

export type TextOverlay = BaseOverlay & {
  type: 'text';
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
};

export type Overlay = ImageOverlay | TextOverlay;

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
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const draggingOverlayId = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const readFileAsDataURL = useCallback((file: File, onLoad: (result: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoad(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleBackgroundChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      readFileAsDataURL(file, setPreviewImage);
      setBackgroundColor(null);
      setIsBackgroundColored(false);
      setBackgroundFile(file);
      event.target.value = '';
    },
    [readFileAsDataURL]
  );

  const handleOverlayChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      readFileAsDataURL(file, (dataUrl) => {
        const imageElement = new Image();
        imageElement.onload = () => {
          const { baseWidth, baseHeight } = computeBaseDimensions(
            imageElement.naturalWidth,
            imageElement.naturalHeight
          );
          setOverlays((prev) => {
            const newOverlay: ImageOverlay = {
              id: crypto.randomUUID(),
              type: 'image',
              image: dataUrl,
              file,
              x: 120 + prev.length * 30,
              y: 120 + prev.length * 30,
              rotation: 0,
              baseWidth,
              baseHeight,
              scalePercent: 100,
            };
            setLastAddedImageOverlayId(newOverlay.id);
            return [...prev, newOverlay];
          });
        };
        imageElement.onerror = () => {
          setOverlays((prev) => {
            const newOverlay: ImageOverlay = {
              id: crypto.randomUUID(),
              type: 'image',
              image: dataUrl,
              file,
              x: 120 + prev.length * 30,
              y: 120 + prev.length * 30,
              rotation: 0,
              baseWidth: DEFAULT_IMAGE_SIZE,
              baseHeight: DEFAULT_IMAGE_SIZE,
              scalePercent: 100,
            };
            setLastAddedImageOverlayId(newOverlay.id);
            return [...prev, newOverlay];
          });
        };
        imageElement.src = dataUrl;
      });
      event.target.value = '';
    },
    [readFileAsDataURL]
  );

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

  const startDrag = useCallback(
    (overlayId: string, pointerX: number, pointerY: number) => {
      if (editingOverlayId && editingOverlayId === overlayId) return;
      const target = overlays.find((overlay) => overlay.id === overlayId);
      if (!target) return;

      draggingOverlayId.current = overlayId;
      dragOffsetRef.current = {
        x: pointerX - target.x,
        y: pointerY - target.y,
      };
    },
    [overlays, editingOverlayId]
  );

  const updateOverlayPosition = useCallback((pointerX: number, pointerY: number) => {
    if (!draggingOverlayId.current) return;

    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === draggingOverlayId.current
          ? {
              ...overlay,
              x: pointerX - dragOffsetRef.current.x,
              y: pointerY - dragOffsetRef.current.y,
            }
          : overlay
      )
    );
  }, []);

  const stopDrag = useCallback(() => {
    draggingOverlayId.current = null;
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingOverlayId.current) return;
      event.preventDefault();
      updateOverlayPosition(event.clientX, event.clientY);
    };

    const handleMouseUp = () => {
      if (!draggingOverlayId.current) return;
      stopDrag();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!draggingOverlayId.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      updateOverlayPosition(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      if (!draggingOverlayId.current) return;
      stopDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [stopDrag, updateOverlayPosition]);

  const handleOverlayMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, overlayId: string) => {
      event.preventDefault();
      startDrag(overlayId, event.clientX, event.clientY);
    },
    [startDrag]
  );

  const handleOverlayTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>, overlayId: string) => {
      const touch = event.touches[0];
      if (!touch) return;
      startDrag(overlayId, touch.clientX, touch.clientY);
    },
    [startDrag]
  );

  const triggerBackgroundSelect = useCallback(() => {
    backgroundInputRef.current?.click();
  }, []);

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

  const triggerOverlaySelect = useCallback(() => {
    if (overlays.length >= maxOverlays) return;
    overlayInputRef.current?.click();
  }, [maxOverlays, overlays.length]);

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
