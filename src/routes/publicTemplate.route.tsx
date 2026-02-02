import { createRoute, useNavigate } from '@tanstack/react-router';
import rootRoute from './root';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { mapTemplateItemsToRender, type MappedTemplateItem } from '../utils/templateRender';
import { DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_FONT_SIZE, DEFAULT_TEXT_FONT_WEIGHT } from '../constants/templates';
import { useGetPublishedTemplateByUser } from '../hooks/templates/useGetPublishedTemplateByUser';
import { useGetProfileByUsername } from '../hooks/users/useGetProfile';
import IconHome from '../assets/icons/ic_home_filled.svg?react';
import IconList from '../assets/icons/ic_listed_stroke.svg?react';

type AnimationType = 'default' | 'spread' | 'collage';

const DEFAULT_CANVAS_WIDTH = 390;
const DEFAULT_CANVAS_HEIGHT = 844;

const getTextDecorationValue = (decoration?: string | null) => {
  if (!decoration || decoration === 'none') return 'none';
  return decoration;
};

type LinkItem = Extract<MappedTemplateItem, { type: 'image' }>;

const LinkBadge = () => (
  <span className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full bg-[#222222] text-white text-[10px] flex items-center justify-center shadow-md">
    링크
  </span>
);

const LinkList = ({ items }: { items: LinkItem[] }) => (
  <div className="fixed left-0 right-0 bottom-12 z-40 px-4">
    <div className="bg-white/95 backdrop-blur-sm border border-black/5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] rounded-2xl p-4 flex flex-col gap-3 max-h-[40vh] overflow-auto">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3 border-b border-black/5 pb-3 last:border-b-0 last:pb-0">
          <img src={item.src} alt="링크 스티커" className="h-12 w-12 rounded-md object-cover" />
          <div className="flex-1">
            <p className="text-sm text-[#222222] font-medium">{item.linkDescription || '링크 스티커'}</p>
            <p className="text-xs text-[#6B6B6B] break-all">{item.linkUrl}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const publicTemplateRoute = createRoute({
  path: '$username',
  getParentRoute: () => rootRoute,
  component: function PublicTemplatePage() {
    const navigate = useNavigate();
    const { username } = publicTemplateRoute.useParams();
    const profile = useGetProfileByUsername(username);
    const { data: template, isLoading, error } = useGetPublishedTemplateByUser(profile?.data?.id ?? '');
    const [animationType, setAnimationType] = useState<AnimationType>('default');
    const [isAnimationActive, setIsAnimationActive] = useState(false);
    const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [showLinkList, setShowLinkList] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const node = containerRef.current;
      const updateFromRect = (rect: DOMRectReadOnly) => {
        setViewportCenter({ x: rect.width / 2, y: rect.height / 2 });
        setViewportSize({ width: rect.width, height: rect.height });
      };

      if (!node) {
        setViewportCenter({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        setViewportSize({ width: window.innerWidth, height: window.innerHeight });
        return;
      }

      updateFromRect(node.getBoundingClientRect());
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) updateFromRect(entry.contentRect);
      });
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const nextType = (template?.animationType as AnimationType | undefined) ?? 'default';
      setAnimationType(nextType);
      setIsAnimationActive(false);
      // defer to next paint to let initial state render
      requestAnimationFrame(() => requestAnimationFrame(() => setIsAnimationActive(true)));
    }, [template?.animationType, template?.items]);

    const { canvasScale, canvasOffsetX, canvasOffsetY } = useMemo(() => {
      const baseWidth = template?.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
      const baseHeight = template?.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
      const viewportWidth = viewportSize.width || baseWidth;
      const viewportHeight = viewportSize.height || baseHeight;
      const safeBaseWidth = baseWidth || DEFAULT_CANVAS_WIDTH;
      const safeBaseHeight = baseHeight || DEFAULT_CANVAS_HEIGHT;
      const scale = Math.min(viewportWidth / safeBaseWidth, viewportHeight / safeBaseHeight);
      return {
        canvasScale: Number.isFinite(scale) ? scale : 1,
        canvasOffsetX: (viewportWidth - safeBaseWidth * scale) / 2,
        canvasOffsetY: (viewportHeight - safeBaseHeight * scale) / 2,
      };
    }, [template?.canvasWidth, template?.canvasHeight, viewportSize.height, viewportSize.width]);

    const computePositionStyle = useCallback(
      (item: ReturnType<typeof mapTemplateItemsToRender>[number], index: number) => {
        const rotation = item.style.rotation ?? 0;
        const baseScale = item.type === 'text' ? (item.style.scalePercent ?? 100) / 100 : 1;
        const scaledLeft = canvasOffsetX + item.style.left * canvasScale;
        const scaledTop = canvasOffsetY + item.style.top * canvasScale;
        const targetBase = {
          left: `${scaledLeft}px`,
          top: `${scaledTop}px`,
          opacity: 1,
          transform: `scale(${baseScale}) rotate(${rotation}deg)`,
        };
        const sizeStyle =
          item.type === 'image'
            ? {
                width: item.style.width ? `${item.style.width * canvasScale}px` : undefined,
                height: item.style.height ? `${item.style.height * canvasScale}px` : undefined,
              }
            : {};

        if (animationType === 'default') {
          return { ...targetBase, ...sizeStyle };
        }

        if (animationType === 'spread') {
          const transition = 'left 700ms ease, top 700ms ease, opacity 700ms ease, transform 700ms ease';
          if (!isAnimationActive) {
            return {
              left: `${viewportCenter.x}px`,
              top: `${viewportCenter.y}px`,
              opacity: 0,
              transform: `scale(${baseScale * 0.9}) rotate(${rotation}deg)`,
              ...sizeStyle,
            };
          }
          return { ...targetBase, ...sizeStyle, transition };
        }

        // collage
        const delayMs = index * 160;
        const transition = `opacity 500ms ease ${delayMs}ms, transform 500ms ease ${delayMs}ms`;
        if (!isAnimationActive) {
          return {
            ...targetBase,
            ...sizeStyle,
            opacity: 0,
            transform: `scale(${baseScale * 0.95}) rotate(${rotation}deg)`,
          };
        }
        return { ...targetBase, ...sizeStyle, transition };
      },
      [
        animationType,
        canvasOffsetX,
        canvasOffsetY,
        canvasScale,
        isAnimationActive,
        viewportCenter.x,
        viewportCenter.y,
      ]
    );

    const renderedItems = useMemo(() => mapTemplateItemsToRender(template?.items ?? []), [template?.items]);
    const linkItems = useMemo(
      () => renderedItems.filter((item): item is LinkItem => item.type === 'image' && Boolean(item.linkUrl)),
      [renderedItems]
    );

    // todo: loading gif 추가 필요
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[#757575] text-sm">템플릿을 불러오는 중입니다</p>
        </div>
      )
    }

    if (error?.message) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[#757575] text-sm">{error.message}</p>
        </div>
      )
    }

    return (
      <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden bg-[#000]">
        <div className="fixed p-5 z-50 w-full flex justify-between">
          <button onClick={() => navigate({ to: '/', search: {} })} className='w-10 h-10 bg-white/70 rounded-full flex items-center justify-center'>
            <IconHome className="w-[22px] h-[22px] text-black" />
          </button>
          <button onClick={() => setShowLinkList((prev) => !prev)} className='w-10 h-10 bg-white/70 rounded-full flex items-center justify-center'>
            <IconList className="w-[22px] h-[22px] text-black" />
          </button>
        </div>
        {template && (
          <>
            {template.isBackgroundColored && template.backgroundColor ? (
              <div className="absolute inset-0" style={{ backgroundColor: template.backgroundColor }} />
            ) : template.backgroundImageUrl ? (
              <img
                src={template.backgroundImageUrl}
                alt="템플릿 배경"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-white" />
            )}

            <div className="absolute inset-0 overflow-hidden">
              {!showLinkList &&
                renderedItems.map((item, index) => {
                  const positionStyle = computePositionStyle(item, index);

                  if (item.type === 'image') {
                    const imageWrapperStyle = {
                      ...positionStyle,
                      transform: positionStyle.transform ?? `rotate(${item.style.rotation}deg)`,
                      transformOrigin: 'center',
                      zIndex: item.style.zIndex,
                    };
                    const imageElement = (
                      <div className="relative">
                        <img
                          src={item.src}
                          alt="사용자 이미지"
                          className="w-full h-full object-cover rounded-2xl"
                          style={{
                            width: item.style.width ? '100%' : undefined,
                            height: item.style.height ? '100%' : undefined,
                          }}
                          draggable={false}
                        />
                        {item.linkUrl && <LinkBadge />}
                      </div>
                    );

                    if (item.linkUrl) {
                      return (
                        <a
                          key={item.key}
                          href={item.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute block"
                          style={imageWrapperStyle}
                        >
                          {imageElement}
                        </a>
                      );
                    }

                    return (
                      <div key={item.key} className="absolute" style={imageWrapperStyle}>
                        {imageElement}
                      </div>
                    );
                  }

                  return (
                    <p
                      key={item.key}
                      className="absolute text-center"
                      style={{
                        ...positionStyle,
                        fontSize: `${(item.font?.size ?? DEFAULT_TEXT_FONT_SIZE) * canvasScale}px`,
                        fontWeight: item.font?.weight ?? DEFAULT_TEXT_FONT_WEIGHT,
                        color: item.font?.color ?? '#FFFFFF',
                        fontFamily: item.font?.family ?? DEFAULT_TEXT_FONT_FAMILY,
                        textDecoration: getTextDecorationValue(item.font?.decoration),
                        transform: positionStyle.transform ?? `rotate(${item.style.rotation}deg)`,
                        transformOrigin: 'center',
                        zIndex: item.style.zIndex,
                      }}
                    >
                      {item.text}
                    </p>
                  );
                })}
            </div>
            {showLinkList && <LinkList items={linkItems} />}
          </>
        )}
        <div className='absolute bottom-5 w-full text-center'>
          <p className='text-black/70 text-xs'>Created by {`${username === 'dress_up' ? 'linkku' : username}`}</p>
        </div>
      </div>
    );
  },
  });

export default publicTemplateRoute;
