import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import type { ChangeEvent } from 'react';
import type { ImageOverlay, Overlay } from '../../types/overlay';
import { DEFAULT_IMAGE_SIZE, computeBaseDimensions } from '../../utils/overlayMath';

type UseOverlayFilesOptions = {
  maxOverlays: number;
  setPreviewImage: (value: string | null) => void;
  setBackgroundColor: (value: string | null) => void;
  setIsBackgroundColored: (value: boolean) => void;
  setBackgroundFile: (file: File | null) => void;
  setLastAddedImageOverlayId: (value: string | null) => void;
  setOverlays: Dispatch<SetStateAction<Overlay[]>>;
  overlayCount: number;
};

const readFileAsDataURL = (file: File, onLoad: (result: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      onLoad(reader.result);
    }
  };
  reader.readAsDataURL(file);
};

export function useOverlayFiles({
  maxOverlays,
  setPreviewImage,
  setBackgroundColor,
  setIsBackgroundColored,
  setBackgroundFile,
  setLastAddedImageOverlayId,
  setOverlays,
  overlayCount,
}: UseOverlayFilesOptions) {
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);

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
    [setPreviewImage, setBackgroundColor, setIsBackgroundColored, setBackgroundFile]
  );

  const handleOverlayChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (overlayCount >= maxOverlays) return;
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
    [overlayCount, maxOverlays, setLastAddedImageOverlayId, setOverlays]
  );

  const triggerBackgroundSelect = useCallback(() => {
    backgroundInputRef.current?.click();
  }, []);

  const triggerOverlaySelect = useCallback(() => {
    if (overlayCount >= maxOverlays) return;
    overlayInputRef.current?.click();
  }, [maxOverlays, overlayCount]);

  return {
    backgroundInputRef,
    overlayInputRef,
    handleBackgroundChange,
    handleOverlayChange,
    triggerBackgroundSelect,
    triggerOverlaySelect,
  };
}
