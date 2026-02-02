import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Overlay } from '../../types/overlay';

type UseOverlayDragOptions = {
  overlays: Overlay[];
  editingOverlayId: string | null;
  setOverlays: Dispatch<SetStateAction<Overlay[]>>;
  getContainerRect?: () => DOMRect | null;
};

export function useOverlayDrag({ overlays, editingOverlayId, setOverlays, getContainerRect }: UseOverlayDragOptions) {
  const draggingOverlayId = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const getPointerPosition = useCallback(
    (clientX: number, clientY: number) => {
      const rect = getContainerRect?.();
      if (!rect) {
        return { x: clientX, y: clientY };
      }
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [getContainerRect]
  );

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
  }, [setOverlays]);

  const stopDrag = useCallback(() => {
    draggingOverlayId.current = null;
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingOverlayId.current) return;
      event.preventDefault();
      const point = getPointerPosition(event.clientX, event.clientY);
      updateOverlayPosition(point.x, point.y);
    };

    const handleMouseUp = () => {
      if (!draggingOverlayId.current) return;
      stopDrag();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!draggingOverlayId.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      const point = getPointerPosition(touch.clientX, touch.clientY);
      updateOverlayPosition(point.x, point.y);
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
  }, [getPointerPosition, stopDrag, updateOverlayPosition]);

  const handleOverlayMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, overlayId: string) => {
      event.preventDefault();
      const point = getPointerPosition(event.clientX, event.clientY);
      startDrag(overlayId, point.x, point.y);
    },
    [getPointerPosition, startDrag]
  );

  const handleOverlayTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>, overlayId: string) => {
      const touch = event.touches[0];
      if (!touch) return;
      const point = getPointerPosition(touch.clientX, touch.clientY);
      startDrag(overlayId, point.x, point.y);
    },
    [getPointerPosition, startDrag]
  );

  return {
    handleOverlayMouseDown,
    handleOverlayTouchStart,
  };
}
