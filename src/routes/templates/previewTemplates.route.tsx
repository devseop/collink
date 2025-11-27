import { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoute } from '@tanstack/react-router';
import templatesRoute from './templates.route';
import router from '../router';
import { useTemplateEditorStore } from '../../stores/templateEditorStore';
import { useAuth } from '../../hooks/useAuth';
import { uploadTemplateAsset } from '../../api/storageAPI';
import { createCustomTemplate } from '../../api/templateAPI';
import type { TemplateItem } from '../../types/templates';

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

    useEffect(() => {
      if (!committed && !didSave) {
        router.navigate({ to: '/templates/edit' });
      }
    }, [committed, didSave]);

    const overlayImageCount = committed?.overlays.filter((overlay) => overlay.type === 'image').length ?? 0;

    const canSave = useMemo(() => Boolean(user) && Boolean(committed) && (committed?.overlays?.length ?? 0) > 0 && !isSaving, [
      user,
      committed,
      isSaving,
    ]);

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
            const base = {
              index,
              coordinates: { x: overlay.x, y: overlay.y },
            };

            if (overlay.type === 'image') {
              const imageUrl =
                overlay.file && user
                  ? await uploadTemplateAsset({
                      file: overlay.file,
                      userId: user.id,
                      folder: 'overlays',
                    })
                  : overlay.image;

              return {
                ...base,
                imageUrl,
                rotation: overlay.rotation ?? 0,
                size: {
                  width: (overlay.baseWidth * overlay.scalePercent) / 100,
                  height: (overlay.baseHeight * overlay.scalePercent) / 100,
                },
              };
            }

            return {
              ...base,
              text: overlay.text,
              font: {
                size: overlay.fontSize,
                weight: overlay.fontWeight,
                color: '#000000',
                family: overlay.fontFamily ?? 'classic',
              },
            };
          })
        );

        const customTemplateId = crypto.randomUUID();
        await createCustomTemplate({
          customTemplateId,
          userId: user.id,
          backgroundImageUrl,
          backgroundColor: shouldUseColor ? committed.backgroundColor ?? undefined : undefined,
          isBackgroundColored: shouldUseColor,
          items,
          isPublished: true,
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
    }, [committed, resetAll, user]);

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

          return (
            <div
              key={overlay.id}
              className="fixed z-20 touch-none"
              style={{
                left: `${overlay.x}px`,
                top: `${overlay.y}px`,
                touchAction: 'none',
              }}
            >
              <div className="relative">
                {isText ? (
                  <div
                    className="min-w-[140px] min-h-[48px] rounded-lg bg-white/60 backdrop-blur-sm border border-white px-4 py-3 shadow-lg text-center"
                    style={{ fontSize: `${overlay.fontSize}px`, fontWeight: overlay.fontWeight, fontFamily: overlay.fontFamily }}
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

        <div className="fixed left-4 right-4 bottom-8 z-50 flex items-center justify-between bg-white/90 rounded-2xl shadow-lg border border-black/5 px-4 py-3">
          <div className="flex flex-col text-xs text-[#4B4B4B]">
            <span>{committed.backgroundImageUrl ? '배경 이미지 적용됨' : committed.isBackgroundColored ? '단색 배경 적용됨' : '배경 없음'}</span>
            <span>링크/이미지 {overlayImageCount}개, 텍스트 {committed.overlays.length - overlayImageCount}개</span>
            {saveError && <span className="text-red-500">{saveError}</span>}
            {didSave && !saveError && <span className="text-emerald-600">저장되었습니다.</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.navigate({ to: '/templates/edit' })}
              className="px-4 py-2 rounded-lg border border-[#D9D9D9] text-sm text-[#4B4B4B] hover:border-black"
              disabled={isSaving}
            >
              돌아가기
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-6 py-3 bg-[#FF5C00] text-white font-semibold rounded-full shadow-lg disabled:bg-[#FFC6A3] disabled:cursor-not-allowed transition-colors"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    );
  },
});

export default previewTemplatesRoute;
