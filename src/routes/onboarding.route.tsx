import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import rootRoute from './root';
import { supabase } from '../lib/supabaseClient';
import { getProfile, updateIsUserVisited } from '../api/profileAPI';
import { useAuth } from '../hooks/useAuth';
import { getCurrentHostname, isAuthBypassEnabled } from '../utils/authBypass';
import ImageOnboardingWelcome from '../assets/illusts/onboarding/onboarding_welcome.png';
import ImageOnboardingFlexible from '../assets/illusts/onboarding/onboarding_flexible.png';
import ImageOnboardingConnect from '../assets/illusts/onboarding/onboarding_connect.png';

const onboardingRoute = createRoute({
  path: '/onboarding',
  getParentRoute: () => rootRoute,
  beforeLoad: async () => {
    if (isAuthBypassEnabled(getCurrentHostname())) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: '/logIn',
        replace: true,
      });
    }

    const profile = await getProfile(session.user.id);

    if (profile?.isUserVisited) {
      throw redirect({
        to: '/templates/edit',
        search: { templateId: undefined },
        replace: true,
      });
    }
  },
  component: function OnboardingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stepIndex, setStepIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartXRef = useRef<number | null>(null);
    const touchDeltaRef = useRef(0);

    // TODO: 이미지 업데이트 필요
    const steps = useMemo(
      () => [
        {
          title: 'WELCOME!',
          description: `단순하고 심플한 링크들을\n원하는대로 만들고 공유해보세요`,
          image: ImageOnboardingWelcome,
        },
        {
          title: 'FLEXIBLE',
          description: `다양한 툴을 이용해서\n취향을 원하는대로 표현해보세요`,
          image: ImageOnboardingFlexible,
        },
        {
          title: 'SHARE',
          description: `만들어진 템플릿을 공유하고\n브랜드 가치를 공고하게 다져나가요`,
          image: ImageOnboardingConnect,
        },
      ],
      []
    );

    const isLastStep = stepIndex === steps.length - 1;

    const handleFinish = async () => {
      if (!user?.id) return;

      await updateIsUserVisited(user.id, true);
      navigate({ to: '/templates/edit', search: { templateId: undefined } });
    };

    const handleNext = async () => {
      if (isLastStep) {
        await handleFinish();
        return;
      }
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
      touchStartXRef.current = event.touches[0]?.clientX ?? null;
      touchDeltaRef.current = 0;
      setIsDragging(true);
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartXRef.current === null) return;
      const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
      touchDeltaRef.current = currentX - touchStartXRef.current;
    };

    const handleTouchEnd = () => {
      if (touchStartXRef.current === null) return;
      const deltaX = touchDeltaRef.current;
      const threshold = 60;
      if (deltaX > threshold) {
        setStepIndex((current) => Math.max(current - 1, 0));
      } else if (deltaX < -threshold) {
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      }
      touchStartXRef.current = null;
      touchDeltaRef.current = 0;
      setIsDragging(false);
    };

    const handleSkip = async () => {
      if (!user?.id) return;
      
      await updateIsUserVisited(user.id, true);
      navigate({ to: `/users/${user.id}/profile`, replace: true, search: { toast: undefined } });
    };

    return (
      <div className="flex flex-col h-full pt-6">
        <div className="flex items-center justify-between px-5">
          <div className="flex gap-[10px]">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-full ${index === stepIndex ? 'bg-black' : 'bg-black/10'}`}
              />
            ))}
          </div>
          {!isLastStep && (
            <button className="text-sm font-medium" onClick={handleSkip}>
              건너뛰기
            </button>
          )}
        </div>

        <div
          className="flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex h-full transition-transform duration-300 ease-out ${isDragging ? 'transition-none' : ''}`}
            style={{ transform: `translateX(-${stepIndex * 100}%)` }}
          >
            {steps.map((step, index) => (
              <div key={index} className="flex w-full flex-none flex-col justify-center gap-14 px-5">
                <div className="flex flex-col gap-4">
                  <p className="text-[44px] font-extrabold">{step.title}</p>
                  <p className="text-base text-[#6E6E6E] whitespace-pre-line">{step.description}</p>
                </div>
                <img src={step.image} alt={step.title} className="w-full min-h-[240px] object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 mb-12">
          <button
            className={`w-full rounded-xl min-h-[48px] py-3 text-center font-semibold text-black ${isLastStep ? 'bg-[#B1FF8D]' : 'border border-[#E0E0E0]'}`}
            onClick={handleNext}
          >
            {isLastStep ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    );
  },
});

export default onboardingRoute;
