import { createRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import templatesRoute from './templates.route';
import { useDebounce } from '../../hooks/useDebounce';
import router from '../router';
import { useDefaultTemplates } from '../../hooks/useDefaultTemplates';
import { useTemplateSelectionStore } from '../../stores/templateSelectionStore';
import { useTemplateEditorStore, type TemplateEditorSnapshot } from '../../stores/templateEditorStore';
import { mapTemplateToEditorState } from '../../utils/editorOverlayMapper';
import Header from '../../components/Header';

const selectTemplatesRoute = createRoute({
  path: 'select',
  getParentRoute: () => templatesRoute,
  component: function SelectTemplatesPage() {
    const { templates, isLoading, error: fetchError } = useDefaultTemplates();
    const setSelectedTemplate = useTemplateSelectionStore((state) => state.setSelectedTemplate);
    const replaceDraft = useTemplateEditorStore((state) => state.replaceDraft);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [scrollLeft, setScrollLeft] = useState(0);
    const debouncedScrollLeft = useDebounce(scrollLeft, 150);

    const navigateToEdit = useCallback(() => {
      router.navigate({ to: '/templates/edit', search: { templateId: undefined } });
    }, []);

    const scrollToIndex = useCallback(
      (index: number, behavior: ScrollBehavior = 'smooth') => {
        const container = scrollContainerRef.current;
        const targetItem = itemRefs.current[index];

        if (!container || !targetItem) return;

        const containerWidth = container.clientWidth;
        const itemWidth = targetItem.clientWidth;
        const targetLeft = targetItem.offsetLeft - (containerWidth - itemWidth) / 2;

        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior,
        });
      },
      []
    );

    const handleScroll = useCallback(() => {
      if (!scrollContainerRef.current) return;
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }, []);

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      container.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }, [handleScroll, scrollToIndex]);

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = activeIndex;
      let minDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.left + rect.width / 2;
        const distance = Math.abs(itemCenter - containerCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== activeIndex) {
        setActiveIndex(closestIndex);
      }
    }, [debouncedScrollLeft, activeIndex]);

    useEffect(() => {
      if (templates.length === 0) return;
      scrollToIndex(0, 'auto');
      setActiveIndex(0);
    }, [templates.length, scrollToIndex]);

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
      <>
        <Header
          templateTabs={{
            selectedKey: 'select',
            onSelectionChange: (key) => {
              if (key === 'select') return;
              navigateToEdit();
            },
          }}
        />
        <div className="flex flex-col gap-[48px] w-full pt-[calc(env(safe-area-inset-top)+6rem)]">
          <div>
            <div className="flex flex-col gap-3 mb-[48px]">
              <p className="text-[32px] font-extrabold text-center">템플릿을 선택하세요</p>
              <div>
                <p className="text-[15px] font-medium text-[#757575] text-center">원하는 스타일을 선택하세요</p>
                <p className="text-[15px] font-medium text-[#757575] text-center">콘텐츠는 언제든 변경이 가능해요</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {isLoading && (
                <p className="text-center text-[#757575]">템플릿을 불러오는 중...</p>
              )}
              {fetchError && (
                <p className="text-center text-red-500">템플릿을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
              )}
              <div
                ref={scrollContainerRef}
                className="w-full overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollPadding: '0 calc(50% - 135px)' }}
              >
                <div className="flex flex-row gap-4 min-w-max" style={{ paddingLeft: 'calc(50% - 135px)', paddingRight: 'calc(50% - 135px)' }}>
                  {templates.map((template, idx) => (
                    <div
                      key={template.id ?? idx}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      className="w-[270px] h-[482px] rounded-lg bg-[#F5F5F5] flex-shrink-0 flex items-center justify-center snap-center snap-always"
                    >
                      {template.isBackgroundColored && template.backgroundColor ? (
                        <div
                          className="w-full h-full rounded-lg"
                          style={{ backgroundColor: template.backgroundColor }}
                        />
                      ) : (
                        <img
                          src={template.thumbnailUrl ?? template.backgroundImageUrl}
                          alt={`${template.category ?? '템플릿'} 미리보기`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-row items-center justify-center gap-2">
                {templates.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      scrollToIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeIndex === index
                        ? 'bg-[#000000] w-6'
                        : 'bg-[#D9D9D9]'
                    }`}
                    aria-label={`템플릿 ${index + 1}로 이동`}
                  />
                ))}
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 px-5 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] z-10">
              <button
                className="w-full py-4 rounded-lg flex items-center justify-center text-[#222222] leading-none font-bold bg-[#B1FF8D]"
                onClick={handleSelectTemplate}
              >
                템플릿 선택하기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
});

export default selectTemplatesRoute;
