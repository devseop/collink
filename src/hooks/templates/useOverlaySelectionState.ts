import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import type { Overlay } from '../../types/overlay';

type UseOverlaySelectionStateOptions = {
  overlays: Overlay[];
  editingOverlayId: string | null;
  lastAddedImageOverlayId: string | null;
  finishEditingTextOverlay: () => void;
  startEditingTextOverlay: (overlayId: string) => void;
};

export function useOverlaySelectionState({
  overlays,
  editingOverlayId,
  lastAddedImageOverlayId,
  finishEditingTextOverlay,
  startEditingTextOverlay,
}: UseOverlaySelectionStateOptions) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [linkDescriptionInputValue, setLinkDescriptionInputValue] = useState('');
  const [isLinkInputFocused, setIsLinkInputFocused] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [textColorValue, setTextColorValue] = useState('#222222');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const keyboardBaselineRef = useRef<number | null>(null);
  const textTapRef = useRef<{ id: string | null; time: number }>({ id: null, time: 0 });
  const textTouchRef = useRef<{ id: string | null; x: number; y: number; moved: boolean }>({
    id: null,
    x: 0,
    y: 0,
    moved: false,
  });

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

  const isOverlayFocused = Boolean(selectedImageId || selectedTextId || editingOverlayId || isLinkInputFocused);
  const isTextModalFloating = Boolean(selectedTextOverlay && !editingOverlayId);

  useEffect(() => {
    if (!editingOverlayId) return;
    const editingOverlay = overlays.find((overlay) => overlay.id === editingOverlayId);
    if (editingOverlay?.type === 'text') {
      setSelectedTextId(editingOverlay.id);
      setSelectedImageId(null);
    }
  }, [editingOverlayId, overlays]);

  useEffect(() => {
    if (!editingOverlayId && !isLinkInputFocused) {
      setKeyboardInset(0);
      keyboardBaselineRef.current = null;
      return;
    }
    const updateInset = () => {
      if (window.visualViewport) {
        const visualViewport = window.visualViewport;
        const inset = Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop);
        setKeyboardInset(inset);
        return;
      }
      if (keyboardBaselineRef.current === null) {
        keyboardBaselineRef.current = window.innerHeight;
      }
      const inset = Math.max(0, (keyboardBaselineRef.current ?? window.innerHeight) - window.innerHeight);
      setKeyboardInset(inset);
    };

    updateInset();
    window.visualViewport?.addEventListener('resize', updateInset);
    window.visualViewport?.addEventListener('scroll', updateInset);
    window.addEventListener('resize', updateInset);
    window.addEventListener('orientationchange', updateInset);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateInset);
      window.visualViewport?.removeEventListener('scroll', updateInset);
      window.removeEventListener('resize', updateInset);
      window.removeEventListener('orientationchange', updateInset);
    };
  }, [editingOverlayId, isLinkInputFocused]);

  useEffect(() => {
    if (!lastAddedImageOverlayId) return;
    setSelectedImageId(lastAddedImageOverlayId);
    setSelectedTextId(null);
  }, [lastAddedImageOverlayId]);

  useEffect(() => {
    setLinkInputValue(selectedImageOverlay?.linkUrl ?? '');
    setLinkDescriptionInputValue(selectedImageOverlay?.linkDescription ?? '');
    if (!selectedImageOverlay) {
      setIsLinkInputFocused(false);
    }
  }, [selectedImageOverlay]);

  useEffect(() => {
    if (!selectedTextOverlay) {
      setShowTextColorPicker(false);
      return;
    }
    setTextColorValue(selectedTextOverlay.textColor ?? '#222222');
  }, [selectedTextOverlay]);

  const handleBackgroundPointerDown = useCallback(() => {
    finishEditingTextOverlay();
    setSelectedImageId(null);
    setSelectedTextId(null);
  }, [finishEditingTextOverlay]);

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

  return {
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
    isLinkInputFocused,
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
  };
}
