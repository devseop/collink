import { createRoute } from '@tanstack/react-router';
import templatesRoute from './templates.route';
import router from '../router';
import { useAuth } from '../../hooks/useAuth';
import { useCallback } from 'react';
import { useGetProfile } from '../../hooks/users/useGetProfile';
import IconImage from '../../assets/icons/ic_image.svg?react';
import IconLinkSmall from '../../assets/icons/ic_link_small.svg?react';

const completedTemplatesRoute = createRoute({
  path: 'completed',
  getParentRoute: () => templatesRoute,
  component: function CompletedTemplatesPage() {
    const { user } = useAuth();
    const { data: profile } = useGetProfile(user?.id ?? '');

    const handleGoToProfile = useCallback(() => {
      if (!user) return;

      router.navigate({ to: `/users/${user.id}/profile` });
    }, [user]);

    const handleGoToLink = useCallback(() => {
      if (!profile?.username) return;

      window.open(`https://linkku.us/${profile.username}`, '_blank');
    }, [profile?.username]);
    
    return (
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-3 mt-[76px] mb-[48px]">
          <p className="text-[32px] font-extrabold text-center">좋아요!</p>
          <div>
            <p className="text-[15px] font-medium text-[#757575] text-center">끝은 곧 새로운 시작이죠</p>
            <p className="text-[15px] font-medium text-[#757575] text-center">계속 해서 발전시켜 나가보세요</p>
          </div>
        </div>
        {/* // TODO: need template screenshot image */}
        {/* 빈 상태 이미지 */}
        <div className="flex flex-col gap-3 items-center justify-center max-w-[270px] mx-auto">

          <div className="flex justify-center items-center bg-[#F0F0F0] rounded-lg mx-auto w-[270px] h-[482px]">
            <IconImage className="w-24 h-24 text-[#222222] opacity-30" aria-hidden />
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