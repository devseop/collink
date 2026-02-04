import { createRoute } from '@tanstack/react-router';
import usersRoute from './users.route';
import { useAuth } from '../../hooks/useAuth';
import { useGetProfile } from '../../hooks/users/useGetProfile';
import { useGetProfileLinks, useUpdateProfileLinkActive } from '../../hooks/users/useProfileLinks';
import { useGetTemplatesByUserId } from '../../hooks/templates/useGetTemplatesByUserId';
import { useDeleteTemplateById } from '../../hooks/templates/useDeleteTemplateById';
import { usePublishTemplateById } from '../../hooks/templates/usePublishTemplateById';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { formatDate } from '../../utils/formatDate';
import ConfirmModal from '../../components/ConfirmModal';
import { Switch } from 'react-aria-components';

// import IconBell from '../../assets/icons/ic_bell.svg?react';
import IconSettings from '../../assets/icons/ic_settings_stroke.svg?react';
import IconMoreStroke from '../../assets/icons/ic_more_stroke.svg?react';
import IconAdd from '../../assets/icons/ic_add_stroke.svg?react';
import IconInstagram from '../../assets/icons/ic_instagram_stroke.svg?react';
import IconTwitter from '../../assets/icons/ic_twitter_stroke.svg?react';
import IconTiktok from '../../assets/icons/ic_tiktok_stroke.svg?react';
import IconYoutube from '../../assets/icons/ic_youtube_filled.svg?react';
import IconMail from '../../assets/icons/ic_mail_stroke.svg?react';
import IconEdit from '../../assets/icons/ic_edit_stroke.svg?react';
import IconChevronRight from '../../assets/icons/ic_chevronRight_stroke.svg?react';
import IconClose from '../../assets/icons/ic_close_stroke_black.svg?react';

import type { ProfileLink, ProfileLinkType } from '../../api/profileLinksAPI';

type SnsItem = {
  type: ProfileLinkType;
  name: string;
  icon: JSX.Element;
};

const SNS_LIST: SnsItem[] = [
  {
    type: 'instagram',
    name: 'Instagram',
    icon: <IconInstagram className="w-6 h-6" aria-hidden />,
  },
  {
    type: 'youtube',
    name: 'YouTube',
    icon: <IconYoutube className="w-6 h-6" aria-hidden />,
  },
  {
    type: 'tiktok',
    name: 'TikTok',
    icon: <IconTiktok className="w-6 h-6" aria-hidden />,
  },
  {
    type: 'twitter',
    name: 'X (Twitter)',
    icon: <IconTwitter className="w-6 h-6" aria-hidden />,
  },
  
  {
    type: 'email',
    name: 'Email',
    icon: <IconMail className="w-6 h-6" aria-hidden />,
  }
]

const SNS_MAP = SNS_LIST.reduce<Record<ProfileLinkType, SnsItem>>((acc, sns) => {
  acc[sns.type] = sns;
  return acc;
}, {} as Record<ProfileLinkType, SnsItem>);

const usersProfileRoute = createRoute({
  path: '$userId/profile',
  getParentRoute: () => usersRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    toast: typeof search.toast === 'string' ? search.toast : undefined,
  }),
  component: function UsersProfilePage() {
    const { toast } = usersProfileRoute.useSearch();
    const { userId } = usersProfileRoute.useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: profile } = useGetProfile(user?.id ?? '');
    const { data: profileLinks = [] } = useGetProfileLinks(user?.id ?? '');
    const { mutate: updateProfileLinkActive } = useUpdateProfileLinkActive();
    const { data: templates } = useGetTemplatesByUserId(user?.id ?? '');
    const { mutate: deleteTemplate } = useDeleteTemplateById();
    const { mutate: publishTemplate } = usePublishTemplateById();
    const {username, avatarUrl} = profile ?? {};
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRootRef = useRef<HTMLDivElement | null>(null);
    const [confirmAction, setConfirmAction] = useState<null | {
      type: 'delete' | 'publish';
      templateId: string;
    }>(null);
    const [showToast, setShowToast] = useState(false);
    const [isSnsSheetOpen, setIsSnsSheetOpen] = useState(false);
    const [isSnsSheetVisible, setIsSnsSheetVisible] = useState(false);
    const lastConfirmActionRef = useRef<{
      type: 'delete' | 'publish';
      templateId: string;
    } | null>(null);

    const { visibleSns, addedLinks, notAdded } = useMemo(() => {
      const linksWithUrl = profileLinks.filter((link) => Boolean(link.url?.trim()));
      const activeLinksWithUrl = linksWithUrl.filter((link) => link.isActive);
      const hasAnyUrl = linksWithUrl.length > 0;

      const visible = hasAnyUrl
        ? activeLinksWithUrl
            .map((link) => {
              const sns = SNS_MAP[link.type];
              if (!sns) return null;
              return { ...sns, link };
            })
            .filter(Boolean)
        : SNS_LIST.slice(0, 3).map((sns) => ({
            ...sns,
            link: profileLinks.find((link) => link.type === sns.type) ?? null,
          }));

      const added = linksWithUrl
        .map((link) => {
          const sns = SNS_MAP[link.type];
          if (!sns) return null;
          return { ...sns, link };
        })
        .filter(Boolean);

      const addedTypes = new Set(linksWithUrl.map((link) => link.type));
      const notAddedList = SNS_LIST.filter((sns) => !addedTypes.has(sns.type));

      return {
        visibleSns: visible as Array<SnsItem & { link: ProfileLink | null }>,
        addedLinks: added as Array<SnsItem & { link: ProfileLink }>,
        notAdded: notAddedList,
      };
    }, [profileLinks]);

    const openSnsSheet = () => {
      setIsSnsSheetOpen(true);
      requestAnimationFrame(() => setIsSnsSheetVisible(true));
    };

    const closeSnsSheet = () => {
      setIsSnsSheetVisible(false);
      window.setTimeout(() => setIsSnsSheetOpen(false), 200);
    };

    // const handleGoToNotifications = useCallback(() => {
    //   //TODO: add notifications page
    //   // router.navigate({ to: '/users/$userId/notifications' });
    //   console.log('go to notifications');
    // }, [user?.id]);

    const handleGoToSettings = useCallback(() => {
      //TODO: add settings page
      // router.navigate({ to: '/users/$userId/settings' });
      console.log('go to settings');
    }, [user?.id]);

    const handleGoToNewTemplate = () => {
      navigate({ to: '/templates/edit', search: { templateId: undefined } });
    };

    const handleEditTemplate = (templateId: string) => {
      navigate({ to: '/templates/edit', search: { templateId } });
    };

    const handleDeleteTemplate = (templateId: string) => {
      const action = { type: 'delete', templateId } as const;
      lastConfirmActionRef.current = action;
      setConfirmAction(action);
    };

    const handlePublishTemplate = (templateId: string) => {
      const action = { type: 'publish', templateId } as const;
      lastConfirmActionRef.current = action;
      setConfirmAction(action);
    };

    const handleConfirmAction = () => {
      if (!confirmAction) return;
      if (confirmAction.type === 'delete') {
        deleteTemplate(confirmAction.templateId);
      }
      if (confirmAction.type === 'publish') {
        if (!user?.id) return;
        publishTemplate({ userId: user.id, templateId: confirmAction.templateId });
      }
      setConfirmAction(null);
    };

    const handleCancelAction = () => setConfirmAction(null);

    useEffect(() => {
      if (!openMenuId) return;
      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (menuRootRef.current?.contains(target)) return;
        setOpenMenuId(null);
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [openMenuId]);

    useEffect(() => {
      if (toast !== 'updated') return;
      setShowToast(true);
      const timeout = window.setTimeout(() => {
        setShowToast(false);
        navigate({
          to: '/users/$userId/profile',
          params: { userId },
          search: { toast: 'updated' },
          replace: true,
        });
      }, 2000);
      return () => window.clearTimeout(timeout);
    }, [toast, navigate, userId]);

    useEffect(() => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      const body = document.body;
      if (isSnsSheetOpen) {
        root.classList.add('body-scroll-lock');
        body.classList.add('body-scroll-lock');
      } else {
        root.classList.remove('body-scroll-lock');
        body.classList.remove('body-scroll-lock');
      }
      return () => {
        root.classList.remove('body-scroll-lock');
        body.classList.remove('body-scroll-lock');
      };
    }, [isSnsSheetOpen]);

    return (
      <div className="flex flex-col gap-8 mt-1">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row gap-3 items-center">
              {avatarUrl ? <img src={avatarUrl} className='w-12 h-12 rounded-full object-cover' alt="Profile" /> : <div className="w-12 h-12 rounded-full bg-[#F0F0F0]" aria-hidden />}
              <div className="flex flex-col gap-[7px]">
                <p className="text-2xl font-bold leading-none">{username}</p>
                <p className="text-sm text-[#6e6e6e]">linkku.us/{username}</p>
              </div>
            </div>
            <button onClick={handleGoToSettings}>
              <IconSettings className="w-6 h-6" aria-hidden />
            </button>
          </div>
        <div className="flex flex-row gap-1 items-center">
            {visibleSns.map((sns) => {
              const isDisabled = !sns.link?.url || !sns.link.isActive;
              return (
                <button
                  key={sns.type}
                  type="button"
                  className={isDisabled ? 'opacity-20 cursor-not-allowed' : ''}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    window.open(sns.link?.url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  {sns.icon}
                </button>
              );
            })}
            <button onClick={openSnsSheet} className='m-1 p-1 bg-[#E5E5E5] rounded-full flex items-center justify-center'>
              <IconAdd className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
        <button className="w-full rounded-xl flex flex-row gap-2 px-4 py-3 bg-[#B1FF8D] items-center justify-center" onClick={handleGoToNewTemplate}>
          <IconAdd className="w-5 h-5" aria-hidden />
          <span className="text-base text-black font-semibold">새 템플릿</span>
        </button>
        <div className='grid grid-cols-2 gap-5 pb-10'>
          {(templates ?? []).map((template) => (
            <div className="w-full" key={template.id}>
              <div className="flex flex-col gap-3">
                {template.thumbnailUrl ? (
                  <img
                    src={template.thumbnailUrl}
                    alt="템플릿 썸네일"
                    className="w-full h-[344px] object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-[344px] rounded-lg bg-[#F0F0F0]" aria-hidden />
                )}
                <div className="flex flex-row px-2 justify-between items-center">
                  <span className="text-sm text-black font-regular">
                    {formatDate(template.createdAt)}
                  </span>
                  <div className="relative" ref={openMenuId === template.id ? menuRootRef : null}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId((current) => (current === template.id ? null : template.id))
                      }
                    >
                      <IconMoreStroke className="w-5 h-5" aria-hidden />
                    </button>
                    {openMenuId === template.id && (
                      <div className="absolute right-0 mt-1 flex w-[80px] flex-col gap-2 rounded-md border bg-white p-2 shadow-lg">
                        <button
                          type="button"
                          className="text-[14px] w-full"
                          onClick={() => {
                            setOpenMenuId(null);
                            handleEditTemplate(template.id);
                          }}
                        >
                          수정하기
                        </button>
                        {!template.isPublished && (
                          <>
                            <button
                              type="button"
                              className="text-[14px] w-full"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              삭제하기
                            </button>
                            <button
                              type="button"
                              className="text-[14px] w-full"
                              onClick={() => {
                                setOpenMenuId(null);
                                handlePublishTemplate(template.id);
                              }}
                            >
                              배포하기
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div> 
        {isSnsSheetOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="SNS 설정 닫기"
              className={`absolute inset-0 bg-black/35 transition-opacity duration-200 ${isSnsSheetVisible ? 'opacity-100' : 'opacity-0'}`}
              onClick={closeSnsSheet}
            />
            <div
              className={`absolute left-0 right-0 top-6 h-[calc(100dvh-24px)] rounded-t-2xl bg-white pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] transition-transform duration-200 ${isSnsSheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
              <div className="flex items-center justify-between border-b border-[#E9E9E9] px-5 pb-4">
                <p className="text-base font-semibold">SNS 설정</p>
                <button type="button" className='p-1' onClick={closeSnsSheet} aria-label="닫기">
                  <IconClose className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="flex flex-col gap-5 pt-4">
                {addedLinks.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {addedLinks.map((sns) => (
                      <div key={sns.type} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          {sns.icon}
                          <span className="text-sm font-medium">{sns.name}</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <button type="button" aria-label={`${sns.name} 수정`}>
                            <IconEdit className="h-5 w-5" aria-hidden />
                          </button>
                          <Switch
                            aria-label={`${sns.name} 표시`}
                            isSelected={sns.link.isActive}
                            onChange={(isSelected) => {
                              if (!user?.id) return;
                              updateProfileLinkActive({
                                id: sns.link.id,
                                isActive: isSelected,
                                userId: user.id,
                              });
                            }}
                            className="group inline-flex items-center"
                          >
                            <span className="relative h-6 w-10 rounded-full bg-[#E5E5E5] p-[2px] transition-colors group-data-[selected]:bg-[#B1FF8D]">
                              <span className="block h-5 w-5 rounded-full bg-white shadow transition-transform group-data-[selected]:translate-x-4" />
                            </span>
                          </Switch>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className='flex flex-col gap-2'>
                  <p className="text-base font-semibold px-5">SNS 추가하기</p>
                  <div className="flex flex-col gap-2">
                    {notAdded.map((sns) => (
                      <div
                        key={sns.type}
                        className="flex items-center justify-between px-5 py-3"
                        aria-label={`${sns.name} 추가`}
                      >
                        <div className="flex items-center gap-3">
                          {sns.icon}
                          <span className="text-sm font-medium">{sns.name}</span>
                        </div>
                        <button 
                        type="button"
                        onClick={() => console.log(sns.type)}
                        className='p-1'>
                          <IconChevronRight className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {lastConfirmActionRef.current && (
          <ConfirmModal
            isOpen={confirmAction !== null}
            title={lastConfirmActionRef.current.type === 'delete' ? '템플릿을 삭제할까요?' : '템플릿을 배포할까요?'}
            message={
              lastConfirmActionRef.current.type === 'delete'
                ? '삭제하면 복구할 수 없습니다.'
                : '배포하면 기존 배포 템플릿이 해제됩니다.'
            }
            confirmLabel={lastConfirmActionRef.current.type === 'delete' ? '삭제하기' : '배포하기'}
            cancelLabel="취소"
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
          />
        )}
        {showToast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#222222] px-4 py-2 text-[14px] text-white shadow-lg">
            템플릿이 업데이트되었습니다
          </div>
        )}
      </div>
    );
  }
});

export default usersProfileRoute;
