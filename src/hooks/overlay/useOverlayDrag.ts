import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Overlay } from '../../types/overlay';

type UseOverlayDragOptions = {
  overlays: Overlay[];
  editingOverlayId: string | null;
  setOverlays: Dispatch<SetStateAction<Overlay[]>>;
  getContainerRect?: () => DOMRect | null;
};

export function useOverlayDrag({ overlays, editingOverlayId, setOverlays, getContainerRect }: UseOverlayDragOptions) {
  const DRAG_START_THRESHOLD_PX = 5;
  const draggingOverlayId = useRef<string | null>(null);
  const pendingDragRef = useRef<{
    overlayId: string;
    pointerType: 'mouse' | 'touch';
    startX: number;
    startY: number;
  } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
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
      if (!target) return false;

      draggingOverlayId.current = overlayId;
      setActiveDragId(overlayId);
      dragOffsetRef.current = {
        x: pointerX - target.x,
        y: pointerY - target.y,
      };
      return true;
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
    pendingDragRef.current = null;
    setActiveDragId(null);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const point = getPointerPosition(event.clientX, event.clientY);
      if (draggingOverlayId.current) {
        event.preventDefault();
        updateOverlayPosition(point.x, point.y);
        return;
      }
      const pending = pendingDragRef.current;
      if (!pending || pending.pointerType !== 'mouse') return;
      const hasMovedEnough =
        Math.hypot(point.x - pending.startX, point.y - pending.startY) >= DRAG_START_THRESHOLD_PX;
      if (!hasMovedEnough) return;
      const didStart = startDrag(pending.overlayId, pending.startX, pending.startY);
      pendingDragRef.current = null;
      if (!didStart) return;
      event.preventDefault();
      updateOverlayPosition(point.x, point.y);
    };

    const handleMouseUp = () => {
      if (!draggingOverlayId.current && !pendingDragRef.current) return;
      stopDrag();
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const point = getPointerPosition(touch.clientX, touch.clientY);
      if (draggingOverlayId.current) {
        if (event.cancelable) event.preventDefault();
        updateOverlayPosition(point.x, point.y);
        return;
      }
      const pending = pendingDragRef.current;
      if (!pending || pending.pointerType !== 'touch') return;
      const hasMovedEnough =
        Math.hypot(point.x - pending.startX, point.y - pending.startY) >= DRAG_START_THRESHOLD_PX;
      if (!hasMovedEnough) return;
      const didStart = startDrag(pending.overlayId, pending.startX, pending.startY);
      pendingDragRef.current = null;
      if (!didStart) return;
      if (event.cancelable) event.preventDefault();
      updateOverlayPosition(point.x, point.y);
    };

    const handleTouchEnd = () => {
      if (!draggingOverlayId.current && !pendingDragRef.current) return;
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
  }, [getPointerPosition, startDrag, stopDrag, updateOverlayPosition]);

  const handleOverlayMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, overlayId: string, shouldPreventDefault = true) => {
      if (shouldPreventDefault) {
        event.preventDefault();
      }
      const point = getPointerPosition(event.clientX, event.clientY);
      pendingDragRef.current = {
        overlayId,
        pointerType: 'mouse',
        startX: point.x,
        startY: point.y,
      };
    },
    [getPointerPosition]
  );

  const handleOverlayTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>, overlayId: string) => {
      const touch = event.touches[0];
      if (!touch) return;
      const point = getPointerPosition(touch.clientX, touch.clientY);
      pendingDragRef.current = {
        overlayId,
        pointerType: 'touch',
        startX: point.x,
        startY: point.y,
      };
    },
    [getPointerPosition]
  );

  return {
    handleOverlayMouseDown,
    handleOverlayTouchStart,
    draggingOverlayId: activeDragId,
  };
}
