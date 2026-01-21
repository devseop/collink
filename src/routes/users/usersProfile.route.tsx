import { createRoute } from '@tanstack/react-router';
import usersRoute from './users.route';
import { useAuth } from '../../hooks/useAuth';
import { useGetProfile } from '../../hooks/users/useGetProfile';
import { useGetPublishedTemplateByUser } from '../../hooks/templates/useGetPublishedTemplateByUser';
// import IconBell from '../../assets/icons/ic_bell.svg?react';
import IconSettings from '../../assets/icons/ic_setting.svg?react';
import { useCallback } from 'react';

const usersProfileRoute = createRoute({
  path: '$userId/profile',
  getParentRoute: () => usersRoute,
  component: function UsersProfilePage() {
    const { user } = useAuth();
    const { data: profile } = useGetProfile(user?.id ?? '');
    const { data: template } = useGetPublishedTemplateByUser(user?.id ?? '');
    const {username, avatarUrl} = profile ?? {};

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
        {/* //TODO: add templates */}
        <div className='grid grid-cols-2 gap-5'>
          <div className="w-full aspect-[430/932] rounded-lg bg-[#F0F0F0] overflow-hidden">
            {template?.thumbnailUrl && (
              <img
                src={template.thumbnailUrl}
                alt="템플릿 썸네일"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="w-full aspect-[430/932] rounded-lg bg-[#F0F0F0]" aria-hidden />
        </div> 
      </div>
    );
  }
});

export default usersProfileRoute;
