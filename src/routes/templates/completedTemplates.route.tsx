import { createRoute } from '@tanstack/react-router';
import templatesRoute from './templates.route';
import router from '../router';
import { useAuth } from '../../hooks/useAuth';
import { useCallback } from 'react';
import { useGetProfile } from '../../hooks/users/useGetProfile';
import IconImage from '../../assets/icons/ic_image.svg?react';
import IconLinkSmall from '../../assets/icons/ic_link_small.svg?react';
import { useGetPublishedTemplateByUser } from '../../hooks/templates/useGetPublishedTemplateByUser';

const completedTemplatesRoute = createRoute({
  path: 'completed',
  getParentRoute: () => templatesRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === 'edit' ? 'edit' : 'create',
  }),
  component: function CompletedTemplatesPage() {
    const { mode } = completedTemplatesRoute.useSearch();
    const { user } = useAuth();
    const { data: profile } = useGetProfile(user?.id ?? '');
    const { data: template } = useGetPublishedTemplateByUser(user?.id ?? '');

    const handleGoToProfile = useCallback(() => {
      if (!user) return;

      router.navigate({ to: `/users/${user.id}/profile`, search: {} });
    }, [user]);

    const handleGoToLink = useCallback(() => {
      if (!profile?.username) return;

      window.open(`https://linkku.us/${profile.username}`, '_blank');
    }, [profile?.username]);
    
    return (
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-3 mt-[76px] mb-[48px]">
          <p className="text-[24px] font-extrabold text-center">
            {mode === 'edit' ? '템플릿이 업데이트되었습니다' : '템플릿이 생성되었습니다'}
          </p>
          <div>
            <p className="text-[15px] font-medium text-[#757575] text-center">끝은 곧 새로운 시작이죠</p>
            <p className="text-[15px] font-medium text-[#757575] text-center">계속 해서 발전시켜 나가보세요</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 items-center justify-center max-w-[270px] mx-auto">
          <div className="flex justify-center items-center bg-[#F0F0F0] rounded-lg mx-auto w-[270px] aspect-[430/932] overflow-hidden">
            {template?.thumbnailUrl ? (
              <img
                src={template.thumbnailUrl}
                alt="템플릿 썸네일"
                className="w-full h-full object-cover"
              />
            ) : (
              <IconImage className="w-24 h-24 text-[#222222] opacity-30" aria-hidden />
            )}
          </div>
          <button className="flex flex-row gap-4 items-center justify-between w-full px-2" onClick={handleGoToLink}>
            <p className="text-[15px] font-medium text-[#222222] text-left">linkku.us/{profile?.username}</p>
            <IconLinkSmall className="w-4 h-4 text-[#222222] opacity-60" aria-hidden />
          </button>
        </div>
      <div className='fixed bottom-0 left-0 right-0 px-5 pb-10 z-10'>
        <button 
          className='w-full py-4 rounded-lg flex items-center justify-center text-[#222222] leading-none font-bold bg-[#B1FF8D]' 
          onClick={handleGoToProfile}
        >
          확인
        </button>
      </div>
    </div>
    );
  },
});

export default completedTemplatesRoute;
