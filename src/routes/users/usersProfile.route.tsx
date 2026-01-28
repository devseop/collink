import { createRoute } from '@tanstack/react-router';
import usersRoute from './users.route';
import { useAuth } from '../../hooks/useAuth';
import { useGetProfile } from '../../hooks/users/useGetProfile';
import { useGetTemplatesByUserId } from '../../hooks/templates/useGetTemplatesByUserId';
import { useDeleteTemplateById } from '../../hooks/templates/useDeleteTemplateById';
import { usePublishTemplateById } from '../../hooks/templates/usePublishTemplateById';
// import IconBell from '../../assets/icons/ic_bell.svg?react';
import IconSettings from '../../assets/icons/ic_setting.svg?react';
import IconMoreStroke from '../../assets/icons/ic_more_stroke.svg?react';
import IconAdd from '../../assets/icons/ic_add_stroke.svg?react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { formatDate } from '../../utils/formatDate';
import ConfirmModal from '../../components/ConfirmModal';

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
    const lastConfirmActionRef = useRef<{
      type: 'delete' | 'publish';
      templateId: string;
    } | null>(null);

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
      navigate({ to: '/templates/edit', search: { templateId: '' } });
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

    return (
      <div className="flex flex-col gap-8 mt-1">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row gap-3 items-center">
            {avatarUrl ? <img src={avatarUrl} className='w-12 h-12 rounded-full object-cover' alt="Profile" /> : <div className="w-12 h-12 rounded-full bg-[#F0F0F0]" aria-hidden />}
            <div className="flex flex-col gap-[7px]">
              <p className="text-2xl font-bold leading-none">{username}</p>
              <p className="text-sm text-[#6e6e6e]">linkku.us/{username}</p>
            </div>
          </div>
          <div className="flex flex-row gap-6 items-center">
            {/* <button onClick={handleGoToNotifications}>
              <IconBell className="w-6 h-6" aria-hidden />
            </button> */}
            <button onClick={handleGoToSettings}>
              <IconSettings className="w-6 h-6" aria-hidden />
            </button>
          </div>
        </div> 
        <button className="w-full rounded-full flex flex-row gap-2 px-4 py-3 bg-[#B1FF8D] items-center justify-center" onClick={handleGoToNewTemplate}>
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
