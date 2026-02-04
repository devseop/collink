import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';
import rootRoute from './root';
import { supabase } from '../lib/supabaseClient';
import { createProfile, getProfile } from '../api/profileAPI';
import { getCurrentHostname, isAuthBypassEnabled } from '../utils/authBypass';
import { toastQueue } from '../components/AppToast';

import ImageShare from '../assets/illusts/index/share.png';
import ImageNotice from '../assets/illusts/index/notice.png';
import ImageInstagram from '../assets/illusts/index/instgram.png';
import ImageBlog from '../assets/illusts/index/blog.png';
import ImageSignUp from '../assets/illusts/index/signUp.png';
import ImageSymbol from '../assets/illusts/index/symbol.png';

const indexRoute = createRoute({
 path: '/',
 getParentRoute: () => rootRoute,
 beforeLoad: async ({ location }) => {
  const searchParams = new URLSearchParams(location.search);
  if (searchParams.get('preview') === '1') {
    return;
  }

  if (isAuthBypassEnabled(getCurrentHostname())) {
    return;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return;
  }

  let profile = await getProfile(session.user.id);

  if (!profile) {
    profile = await createProfile(session.user.id);
  }

  if (!profile.username) {
    throw redirect({
      to: '/users/$userId/setUsername',
      params: { userId: session.user.id },
      replace: true,
    });
  }

  throw redirect({
    to: '/users/$userId/profile',
    params: { userId: session.user.id },
    replace: true,
    search: { toast: undefined },
  });
 },

 component:  function IndexPage() {
  const navigate = useNavigate();

  const handleShare = useCallback(async () => {
    const shareUrl = 'https://linkku.us';

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (error) {
      console.error(error);
    } finally {
      toastQueue.add({ title: '링크가 복사되었습니다' }, { timeout: 2000 });
    }
  }, []);

  const handleGoToSignUp = () => {
    navigate({ to: '/signUp' });
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;

    html.style.backgroundColor = '#98FF7C';
    body.style.backgroundColor = '#98FF7C';

    return () => {
      html.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
    };
  }, []);

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

  return (
    <div className="min-h-[100dvh] w-full bg-[#98FF7C] px-5 pb-10">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[380px] flex-col">
        <div className="grid flex-1 grid-cols-2 grid-rows-[repeat(4,minmax(0,1fr))] gap-x-3 gap-y-4">
          <div className="flex items-center justify-center">
            <button type="button" onClick={handleShare} aria-label="linkku 공유하기">
              <img src={ImageShare} alt="share" className="max-h-[120px] max-w-full" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <img src={ImageNotice} alt="notice" className="max-h-[105px] max-w-full" />
          </div>

          <div className="col-span-2 flex items-center justify-center">
            <img src={ImageSymbol} alt="linkku" className="max-h-[120px] max-w-full select-none" />
          </div>

          <button className="flex items-center justify-center" onClick={() => window.open('https://www.instagram.com/linkku_official/', '_blank')}>
            <img src={ImageInstagram} alt="instagram" className="max-h-[120px] max-w-full" />
          </button>
          <div className="flex items-center justify-center">
            <img src={ImageBlog} alt="blog" className="max-h-[120px] max-w-full" />
          </div>

          <button className="col-span-2 flex items-center justify-center" onClick={handleGoToSignUp}>
            <img src={ImageSignUp} alt="sign up" className="max-h-[160px] max-w-full" />
          </button>
        </div>
      </div>
    </div>
  );
 },  
});

export default indexRoute;
