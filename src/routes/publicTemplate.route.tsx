import { createRoute, useNavigate } from '@tanstack/react-router';
import rootRoute from './root';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Button, TooltipTrigger } from 'react-aria-components';
import { mapTemplateItemsToRender, type MappedTemplateItem } from '../utils/templateRender';
import { DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_FONT_SIZE, DEFAULT_TEXT_FONT_WEIGHT } from '../constants/templates';
import { useGetPublishedTemplateByUser } from '../hooks/templates/useGetPublishedTemplateByUser';
import { useGetProfileByUsername } from '../hooks/users/useGetProfile';
import { getCurrentHostname, isAuthBypassEnabled } from '../utils/authBypass';
import IconHome from '../assets/icons/ic_home_filled.svg?react';
import IconList from '../assets/icons/ic_listed_stroke.svg?react';
import IconTemplate from '../assets/icons/ic_template_filled.svg?react';
import IconLinkWhite from '../assets/icons/ic_link_stroke_white.svg?react';
import { LinkTooltip } from '../components/Tooltip';
import MockBackground from '../assets/mocking_img.png';
import IconInstagramUrl from '../assets/icons/ic_instagram_stroke.svg?url';
import IconTiktokUrl from '../assets/icons/ic_tiktok_stroke.svg?url';
import IconTwitterUrl from '../assets/icons/ic_twitter_stroke.svg?url';
import type { TemplateItem } from '../types/templates';
import type { PublicTemplate } from '../api/templateAPI';

type AnimationType = 'default' | 'spread' | 'collage';

const DEFAULT_CANVAS_WIDTH = 390;
const DEFAULT_CANVAS_HEIGHT = 844;

const PREVIEW_ITEMS: TemplateItem[] = [
  {
    text: 'DRESS UP',
    coordinates: { x: 40, y: 86 },
    font: {
      size: 34,
      weight: 700,
      color: '#111111',
      family: DEFAULT_TEXT_FONT_FAMILY,
    },
    index: 0,
  },
  {
    text: 'link in bio',
    coordinates: { x: 40, y: 132 },
    font: {
      size: 16,
      weight: 500,
      color: '#4B5563',
      family: DEFAULT_TEXT_FONT_FAMILY,
    },
    index: 1,
  },
  {
    imageUrl: IconInstagramUrl,
    linkUrl: 'https://instagram.com',
    linkDescription: 'Instagram',
    coordinates: { x: 36, y: 230 },
    size: { width: 72, height: 72 },
    rotation: -6,
    index: 2,
  },
  {
    imageUrl: IconTiktokUrl,
    linkUrl: 'https://tiktok.com',
    linkDescription: 'TikTok',
    coordinates: { x: 156, y: 250 },
    size: { width: 72, height: 72 },
    rotation: 4,
    index: 3,
  },
  {
    imageUrl: IconTwitterUrl,
    linkUrl: 'https://x.com',
    linkDescription: 'X (Twitter)',
    coordinates: { x: 260, y: 228 },
    size: { width: 72, height: 72 },
    rotation: -2,
    index: 4,
  },
  {
    text: 'Tap icons to open links',
    coordinates: { x: 40, y: 340 },
    font: {
      size: 14,
      weight: DEFAULT_TEXT_FONT_WEIGHT,
      color: '#6B7280',
      family: DEFAULT_TEXT_FONT_FAMILY,
    },
    index: 5,
  },
];

const PREVIEW_TEMPLATE: PublicTemplate = {
  id: 'preview-template',
  userId: 'preview-user',
  backgroundImageUrl: MockBackground,
  isBackgroundColored: false,
  items: PREVIEW_ITEMS,
  isPublished: true,
  animationType: 'spread',
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
};

const getTextDecorationValue = (decoration?: string | null) => {
  if (!decoration || decoration === 'none') return 'none';
  return decoration;
};

type LinkItem = Extract<MappedTemplateItem, { type: 'image' }>;

const LinkList = ({ items }: { items: LinkItem[] }) => (
  <div
    data-scroll-lock-ignore
    className="fixed left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+3rem)] z-40 pl-[calc(env(safe-area-inset-left)+1rem)] pr-[calc(env(safe-area-inset-right)+1rem)]"
  >
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.key} className="flex flex-row items-center bg-white/70 backdrop-blur-sm p-2 rounded-[2px] justify-center">
          <img src={item.src} alt="링크 스티커" className="h-12 w-12 rounded-[2px] object-cover" />
          <div className="flex-1">
            <p className="text-sm text-[#222222] font-medium truncate text-center">{item.linkDescription || '링크 스티커'}</p>
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
    const isPreviewMode = isAuthBypassEnabled(getCurrentHostname());
    const profile = useGetProfileByUsername(username, !isPreviewMode);
    const profileId = profile?.data?.id ?? '';
    const { data: template, isLoading, error } = useGetPublishedTemplateByUser(
      profileId,
      !isPreviewMode
    );
    const resolvedTemplate = isPreviewMode ? PREVIEW_TEMPLATE : template;
    const resolvedLoading = isPreviewMode ? false : isLoading;
    const resolvedError = isPreviewMode ? null : error;
    const [animationType, setAnimationType] = useState<AnimationType>('default');
    const [isAnimationActive, setIsAnimationActive] = useState(false);
    const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [showLinkList, setShowLinkList] = useState(false);
    const [openLinkKey, setOpenLinkKey] = useState<string | number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (typeof window === 'undefined') return;

      const isIgnoredTarget = (target: EventTarget | null) => {
        const element = target as Element | null;
        return Boolean(element?.closest('[data-scroll-lock-ignore]'));
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (isIgnoredTarget(event.target)) return;
        event.preventDefault();
      };

      const handleWheel = (event: WheelEvent) => {
        if (isIgnoredTarget(event.target)) return;
        event.preventDefault();
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('wheel', handleWheel);
      };
    }, []);

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
    }, [resolvedTemplate?.id]);

    useEffect(() => {
      const nextType = (resolvedTemplate?.animationType as AnimationType | undefined) ?? 'default';
      setAnimationType(nextType);
      setIsAnimationActive(false);
      // defer to next paint to let initial state render
      requestAnimationFrame(() => requestAnimationFrame(() => setIsAnimationActive(true)));
    }, [resolvedTemplate?.animationType, resolvedTemplate?.items]);

    const { canvasScale, canvasOffsetX, canvasOffsetY } = useMemo(() => {
      const baseWidth = resolvedTemplate?.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
      const baseHeight = resolvedTemplate?.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
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
    }, [resolvedTemplate?.canvasWidth, resolvedTemplate?.canvasHeight, viewportSize.height, viewportSize.width]);

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

    const renderedItems = useMemo(
      () => mapTemplateItemsToRender(resolvedTemplate?.items ?? []),
      [resolvedTemplate?.items]
    );

    const linkItems = useMemo(
      () => renderedItems.filter((item): item is LinkItem => item.type === 'image' && Boolean(item.linkUrl)),
      [renderedItems]
    );

    const openLink = useCallback((url?: string) => {
      if (!url) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    // todo: loading gif 추가 필요
    if (resolvedLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[#757575] text-sm">템플릿을 불러오는 중입니다</p>
        </div>
      )
    }

    if (resolvedError?.message) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[#757575] text-sm">{resolvedError.message}</p>
        </div>
      )
    }

    return (
      <div
        className="relative min-h-[100dvh] w-full overflow-hidden bg-[#000]"
        onClick={() => setOpenLinkKey(null)}
      >
        <div className="fixed inset-x-0 top-0 z-50 flex justify-between pl-[calc(env(safe-area-inset-left)+1.25rem)] pr-[calc(env(safe-area-inset-right)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-5">
          <button onClick={() => navigate({ to: '/', search: {} })} className='w-10 h-10 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center'>
            <IconHome className="w-[22px] h-[22px] text-black" />
          </button>
          <button onClick={() => setShowLinkList((prev) => !prev)} className='w-10 h-10 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center'>
            {showLinkList ? <IconTemplate className="w-[22px] h-[22px] text-black" /> : <IconList className="w-[22px] h-[22px] text-black" />}
          </button>
        </div>
        {resolvedTemplate && (
          <>
            {resolvedTemplate.isBackgroundColored && resolvedTemplate.backgroundColor ? (
              <div className="absolute inset-0" style={{ backgroundColor: resolvedTemplate.backgroundColor }} />
            ) : resolvedTemplate.backgroundImageUrl  ? (
              <img
                src={resolvedTemplate.backgroundImageUrl}
                alt="템플릿 배경"
                className="block w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-black" />
            )}

            <div
              ref={containerRef}
              className="absolute left-[env(safe-area-inset-left)] right-[env(safe-area-inset-right)] top-[env(safe-area-inset-top)] bottom-[env(safe-area-inset-bottom)]"
            >
              <div className="absolute inset-0 overflow-hidden">
                {!showLinkList &&
                  renderedItems.map((item, index) => {
                    const renderKey = `${item.key}-${index}`;
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
                            className="w-full h-full object-cover"
                            style={{
                              width: item.style.width ? '100%' : undefined,
                              height: item.style.height ? '100%' : undefined,
                            }}
                            draggable={false}
                          />
                        </div>
                      );

                      if (item.linkUrl) {
                        const isTooltipOpen = openLinkKey === item.key;
                        return (
                          <TooltipTrigger key={renderKey} isOpen={isTooltipOpen}>
                            <Button
                              className="absolute block"
                              style={imageWrapperStyle}
                              onPress={() => {
                                if (isTooltipOpen) {
                                  openLink(item.linkUrl);
                                  setOpenLinkKey(null);
                                  return;
                                }
                                setOpenLinkKey(item.key);
                              }}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {imageElement}
                            </Button>
                            <LinkTooltip
                              placement="bottom"
                              offset={10}
                              onClick={(event) => {
                                event.stopPropagation();
                                openLink(item.linkUrl);
                                setOpenLinkKey(null);
                              }}
                              icon={<IconLinkWhite className="w-[14px] h-[14px] text-white" />}
                              label={item.linkDescription || item.linkUrl}
                            />
                          </TooltipTrigger>
                        );
                      }

                      return (
                        <div
                          key={renderKey}
                          className="absolute"
                          style={imageWrapperStyle}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenLinkKey(null);
                          }}
                        >
                          {imageElement}
                        </div>
                      );
                    }

                    return (
                      <p
                        key={renderKey}
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
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenLinkKey(null);
                        }}
                      >
                        {item.text}
                      </p>
                    );
                  })}
              </div>
            </div>
            {showLinkList && <LinkList items={linkItems} />}
          </>
        )}
      </div>
    );
  },
  });

export default publicTemplateRoute;
