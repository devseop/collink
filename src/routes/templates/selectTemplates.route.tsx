import { createRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import templatesRoute from './templates.route';
import router from '../router';
import { useDefaultTemplates } from '../../hooks/useDefaultTemplates';
import { useTemplateSelectionStore } from '../../stores/templateSelectionStore';
import { useTemplateEditorStore, type TemplateEditorSnapshot } from '../../stores/templateEditorStore';
import { mapTemplateToEditorState } from '../../utils/editorOverlayMapper';
import type { DefaultTemplate } from '../../types/templates';
import IconImage from '../../assets/icons/ic_image_stroke.svg?react';
import Header from '../../components/Header';

const CATEGORY_LABEL_MAP: Record<NonNullable<DefaultTemplate['category']>, string> = {
  folder: '폴더',
  schedule: '달력',
  shop: '아카이브',
};

const getTemplateLabel = (template: DefaultTemplate, index: number) => {
  if (template.category) {
    return CATEGORY_LABEL_MAP[template.category] ?? '템플릿';
  }
  return `템플릿 ${index + 1}`;
};

const selectTemplatesRoute = createRoute({
  path: 'select',
  getParentRoute: () => templatesRoute,
  component: function SelectTemplatesPage() {
    const { templates, isLoading, error: fetchError } = useDefaultTemplates();
    const setSelectedTemplate = useTemplateSelectionStore((state) => state.setSelectedTemplate);
    const replaceDraft = useTemplateEditorStore((state) => state.replaceDraft);
    const [activeIndex, setActiveIndex] = useState(0);

    const navigateToEdit = useCallback(() => {
      router.navigate({ to: '/templates/edit', search: { templateId: undefined } });
    }, []);

    useEffect(() => {
      if (templates.length === 0) return;
      setActiveIndex((current) => {
        if (current < templates.length) return current;
        return 0;
      });
    }, [templates.length]);

    const handleSelectTemplate = useCallback(() => {
      const selectedTemplate = templates[activeIndex];
      if (!selectedTemplate) return;

      setSelectedTemplate(selectedTemplate);

      const editorState = mapTemplateToEditorState(selectedTemplate);
      const snapshot: TemplateEditorSnapshot = {
        backgroundImageUrl: editorState.backgroundImageUrl,
        backgroundFile: null,
        backgroundColor: editorState.backgroundColor,
        isBackgroundColored: editorState.isBackgroundColored,
        overlays: editorState.overlays.map((overlay) => ({ ...overlay })),
        animationType: selectedTemplate.animationType ?? 'default',
      };

      replaceDraft(snapshot, selectedTemplate.id ?? null);
      navigateToEdit();
    }, [activeIndex, navigateToEdit, replaceDraft, setSelectedTemplate, templates]);

    return (
      <div className="relative min-h-full bg-[#F3F3F3]">
        <Header
          templateTabs={{
            selectedKey: 'select',
            onSelectionChange: (key) => {
              if (key === 'select') return;
              navigateToEdit();
            },
          }}
        />

        <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-[calc(env(safe-area-inset-top)+6rem)]">
          {isLoading && (
            <p className="pb-4 text-center text-[#757575]">템플릿을 불러오는 중...</p>
          )}
          {fetchError && (
            <p className="pb-4 text-center text-red-500">템플릿을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
          )}
          <div className="grid grid-cols-2 gap-x-[18px] gap-y-6">
            {templates.map((template, idx) => {
              const thumbnailSource = template.thumbnailUrl ?? template.backgroundImageUrl;
              const isActive = activeIndex === idx;
              return (
                <button
                  type="button"
                  key={template.id ?? idx}
                  onClick={() => setActiveIndex(idx)}
                  className="text-left"
                  aria-pressed={isActive}
                >
                  <div
                    className={`relative aspect-[270/482] w-full overflow-hidden rounded-lg bg-[#E5E5E5] ${
                      isActive ? 'ring-2 ring-[#B1FF8D]' : ''
                    }`}
                  >
                    {template.isBackgroundColored && template.backgroundColor ? (
                      <div className="h-full w-full" style={{ backgroundColor: template.backgroundColor }} />
                    ) : thumbnailSource ? (
                      <img
                        src={thumbnailSource}
                        alt={`${getTemplateLabel(template, idx)} 미리보기`}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <IconImage className="h-20 w-20 opacity-30" aria-hidden />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[15px] font-medium leading-none text-[#222222]">
                    {getTemplateLabel(template, idx)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#F3F3F3] via-[#F3F3F3] to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg bg-[#A6EA82] py-4 text-[16px] font-semibold leading-none text-[#222222] disabled:bg-[#E5E5E5] disabled:text-[#9F9F9F]"
            onClick={handleSelectTemplate}
            disabled={templates.length === 0}
          >
            적용하기
          </button>
        </div>
      </div>
    );
  }
});

export default selectTemplatesRoute;
