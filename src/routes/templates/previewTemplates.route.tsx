import { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoute } from '@tanstack/react-router';
import templatesRoute from './templates.route';
import router from '../router';
import { useTemplateEditorStore } from '../../stores/templateEditorStore';
import { useAuth } from '../../hooks/useAuth';
import { uploadTemplateAsset } from '../../api/storageAPI';
import { createCustomTemplate } from '../../api/templateAPI';
import type { TemplateItem } from '../../types/templates';
import type { Overlay } from '../../types/overlay';
import { safeRandomUUID } from '../../utils/random';
import { mapOverlayToTemplateItem } from '../../utils/editorOverlayMapper';

type AnimationType = 'default' | 'spread' | 'collage';

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

const previewTemplatesRoute = createRoute({
  path: 'preview',
  getParentRoute: () => templatesRoute,
  component: function PreviewTemplatesPage() {
    const committed = useTemplateEditorStore((state) => state.committed);
    const resetAll = useTemplateEditorStore((state) => state.resetAll);
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [didSave, setDidSave] = useState(false);
    const [animationType, setAnimationType] = useState<AnimationType>(
      (committed?.animationType as AnimationType | undefined) ?? 'default'
    );
    const [isAnimationActive, setIsAnimationActive] = useState(false);
    const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });

    useEffect(() => {
      if (!committed && !didSave) {
        router.navigate({ to: '/templates/edit' });
      }
    }, [committed, didSave]);

    const canSave = useMemo(() => Boolean(user) && Boolean(committed) && (committed?.overlays?.length ?? 0) > 0 && !isSaving, [
      user,
      committed,
      isSaving,
    ]);

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

    const triggerAnimation = useCallback(
      (nextType?: AnimationType) => {
        if (nextType) {
          setAnimationType(nextType);
        }
        setIsAnimationActive(false);
        // allow initial state to render, then activate transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsAnimationActive(true));
        });
      },
      []
    );

    const computePositionStyle = useCallback(
      (overlay: Overlay, index: number) => {
        const rotation = overlay.type === 'image' ? overlay.rotation ?? 0 : 0;
        const target = {
          left: `${overlay.x}px`,
          top: `${overlay.y}px`,
          opacity: 1,
          transform: `rotate(${rotation}deg)`,
        } as const;

        if (animationType === 'default') {
          return target;
        }

        if (animationType === 'spread') {
          const transition = 'left 700ms ease, top 700ms ease, opacity 700ms ease, transform 700ms ease';
          if (!isAnimationActive) {
            return {
              left: `${viewportCenter.x}px`,
              top: `${viewportCenter.y}px`,
              opacity: 0,
              transform: `scale(0.9) rotate(${rotation}deg)`,
            };
          }
          return { ...target, transition };
        }

        // collage
        const delayMs = index * 160;
        const transition = `opacity 500ms ease ${delayMs}ms, transform 500ms ease ${delayMs}ms`;
        if (!isAnimationActive) {
          return {
            ...target,
            opacity: 0,
            transform: `scale(0.95) rotate(${rotation}deg)`,
          };
        }
        return { ...target, transition };
      },
      [animationType, isAnimationActive, viewportCenter.x, viewportCenter.y]
    );

    const normalizeLinkUrl = useCallback((value?: string | null) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      return `https://${trimmed}`;
    }, []);

    const handleSave = useCallback(async () => {
      if (!committed || !user) {
        setSaveError('저장할 템플릿이 없거나 로그인이 필요합니다.');
        setDidSave(false);
        return;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        const backgroundImageUrl = committed.backgroundFile
          ? await uploadTemplateAsset({
              file: committed.backgroundFile,
              userId: user.id,
              folder: 'backgrounds',
            })
          : committed.backgroundImageUrl ?? undefined;
        const shouldUseColor = Boolean(committed.isBackgroundColored && committed.backgroundColor && !backgroundImageUrl);

        const items: TemplateItem[] = await Promise.all(
          committed.overlays.map(async (overlay, index) => {
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
          backgroundColor: shouldUseColor ? committed.backgroundColor ?? undefined : undefined,
          isBackgroundColored: shouldUseColor,
          items,
          isPublished: true,
          animationType,
        });

        setDidSave(true);
        resetAll();

        console.log(customTemplateId);
        router.navigate({ to: `/templates/completed` });
      } catch (error) {
        setDidSave(false);
        setSaveError(error instanceof Error ? error.message : '템플릿 저장에 실패했습니다.');
      } finally {
        setIsSaving(false);
      }
    }, [animationType, committed, normalizeLinkUrl, resetAll, user]);

    if (!committed) {
      return null;
    }

    return (
      <div className="relative w-full h-screen overflow-hidden bg-black/5">
        {committed.backgroundImageUrl && (
          <div className="fixed inset-0 z-0">
            <img src={committed.backgroundImageUrl} alt="배경" className="w-full h-full object-cover" />
          </div>
        )}
        {!committed.backgroundImageUrl && committed.isBackgroundColored && committed.backgroundColor && (
          <div
            className="fixed inset-0 z-0"
            style={{ backgroundColor: committed.backgroundColor }}
          />
        )}

        {committed.overlays.map((overlay, index) => {
          const isText = overlay.type === 'text';
          const textBoxStyles = isText
            ? getTextBoxStyles(overlay.textColor ?? '#222222', overlay.boxStyle ?? 0)
            : null;

          const positionStyle = computePositionStyle(overlay, index);

          return (
            <div
              key={overlay.id}
              className="fixed z-20 touch-none"
              style={{
                ...positionStyle,
                touchAction: 'none',
              }}
            >
              <div className="relative">
                {isText ? (
                  <div
                    className="min-w-[140px] min-h-[48px] rounded-lg bg-white/60 backdrop-blur-sm border border-white px-4 py-3 shadow-lg text-center"
                    style={{
                      fontSize: `${overlay.fontSize}px`,
                      fontWeight: overlay.fontWeight,
                      fontFamily: overlay.fontFamily,
                      color: textBoxStyles?.color ?? overlay.textColor ?? '#222222',
                      textDecoration: getTextDecorationValue(overlay.underline, overlay.strikethrough),
                      transform: `rotate(${overlay.rotation ?? 0}deg) scale(${(overlay.scalePercent ?? 100) / 100})`,
                      transformOrigin: 'center',
                      backgroundColor: textBoxStyles?.backgroundColor,
                    }}
                  >
                    {overlay.text || '텍스트를 입력하세요'}
                  </div>
                ) : (
                  <img
                    src={overlay.image}
                    alt={`오버레이 ${index + 1}`}
                    className="object-cover rounded-lg shadow-lg border-2 border-white pointer-events-none"
                    style={{
                      width: (overlay.baseWidth * overlay.scalePercent) / 100,
                      height: (overlay.baseHeight * overlay.scalePercent) / 100,
                      transform: `rotate(${overlay.rotation ?? 0}deg)`,
                    }}
                    draggable={false}
                  />
                )}
              </div>
            </div>
          );
        })}

        <div className="fixed left-0 right-0 bottom-0 z-50">
          <div className="bg-white/95 backdrop-blur-sm shadow-[0_-8px_24px_rgba(0,0,0,0.08)] border border-black/5 px-4 py-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            {/* bottom UI */}
            <div className="flex flex-col text-xs text-[#4B4B4B]">
              {saveError && <span className="text-red-500">{saveError}</span>}
              {didSave && !saveError && <span className="text-emerald-600">저장되었습니다.</span>}
            </div>
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => router.navigate({ to: '/templates/edit' })}
                className="px-4 py-2 rounded-lg border border-[#D9D9D9] text-sm text-[#4B4B4B] hover:border-black w-full"
                disabled={isSaving}
              >
                돌아가기
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="px-4 py-2 bg-[#b1ff8d] text-black font-semibold rounded-lg disabled:bg-[#FFC6A3] disabled:cursor-not-allowed transition-colors w-full"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  },
});

export default previewTemplatesRoute;
