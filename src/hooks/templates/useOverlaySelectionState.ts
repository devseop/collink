import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Overlay } from '../../types/overlay';

type UseOverlaySelectionStateOptions = {
  overlays: Overlay[];
  editingOverlayId: string | null;
  lastAddedImageOverlayId: string | null;
  finishEditingTextOverlay: () => void;
};

export function useOverlaySelectionState({
  overlays,
  editingOverlayId,
  lastAddedImageOverlayId,
  finishEditingTextOverlay,
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

  const isOverlayFocused = Boolean(selectedImageId || selectedTextId || editingOverlayId);
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

  const handleBackgroundPointerDown = useCallback((event: ReactMouseEvent | ReactTouchEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest('[data-overlay-frame="true"]')) {
      return;
    }
    finishEditingTextOverlay();
    setSelectedImageId(null);
    setSelectedTextId(null);
  }, [finishEditingTextOverlay]);

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
  };
}
