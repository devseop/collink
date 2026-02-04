import { Link, createRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { createProfile, getProfile, updateUsername } from '../../api/profileAPI';
import { getCurrentHostname, isAuthBypassEnabled } from '../../utils/authBypass';
import usersRoute from './users.route';
import IconLogo from '../../assets/icons/symbol_linkku.svg?react';

const userSetUsernameRoute = createRoute({
  path: '$userId/setUsername',
  getParentRoute: () => usersRoute,
  loader: async ({ params }) => {
    if (isAuthBypassEnabled(getCurrentHostname())) {
      return { id: params.userId, username: undefined };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: '/signUp',
        replace: true,
      });
    }

    if (session.user.id !== params.userId) {
      throw redirect({
        to: '/users/$userId/setUsername',
        params: { userId: session.user.id },
        replace: true,
        search: { toast: undefined },
      });
    }

    let profile = await getProfile(session.user.id);

    if (!profile) {
      profile = await createProfile(session.user.id);
    }

    // if (profile.username) {
    //   throw redirect({
    //     to: '/users/$userId/profile',
    //     params: { userId: session.user.id },
    //     replace: true,
    //     search: { toast: undefined },
    //   });
    // }

    return profile;
  },
  component: function UserSetUsernamePage() {
    const { userId } = useParams({ from: '/users/$userId/setUsername' });
    const profile = userSetUsernameRoute.useLoaderData();
    const [linkUrl, setLinkUrl] = useState(profile.username ?? '');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isUsernameExists, setIsUsernameExists] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [hasCheckedUsername, setHasCheckedUsername] = useState(false);

    const handleCheckUsernameExists = useCallback(
      async (value: string) => {
        const trimmed = value.trim();

        if (!trimmed) {
          setIsUsernameExists(false);
          return;
        }

        setIsChecking(true);

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', trimmed)
            .maybeSingle();

          if (error) {
            console.error(error);
            setIsUsernameExists(false);
            return;
          }

          setIsUsernameExists(Boolean(data && data.id !== userId));
          setHasCheckedUsername(true);
        } finally {
          setIsChecking(false);
        }
      },
      [userId]
    );

    const handleSaveLinkUrl = useCallback(
      async (value: string) => {
        const trimmed = value.trim();

        if (!trimmed) {
          setErrorMessage('Username을 입력해주세요.');
          return;
        }

        if (!hasCheckedUsername) {
          await handleCheckUsernameExists(trimmed);
        }

        if (isUsernameExists || isChecking) {
          setErrorMessage('이미 사용 중인 Username입니다.');
          return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
          await updateUsername(userId, trimmed);
          await navigate({ to: '/', replace: true, search: {} });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Username 저장에 실패했습니다.';
          setErrorMessage(message);
        } finally {
          setIsSubmitting(false);
        }
      },
      [handleCheckUsernameExists, hasCheckedUsername, isChecking, isUsernameExists, navigate, userId]
    );

    const isButtonDisabled = isSubmitting || isChecking || isUsernameExists || !linkUrl.trim();

    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-row items-start">
          <IconLogo className="h-5 w-auto" aria-hidden />
        </div>
        <div className="mt-[60px] flex flex-col items-center gap-4 text-center">
          <p className="text-[28px] font-extrabold text-black">링꾸에 오신걸 환영해요!</p>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-[#6E6E6E]">
              먼저 링꾸에서 사용할 주소를 입력해주세요.
            </p>
            <p className="text-sm font-medium text-[#6E6E6E]">
              입력한 주소는 언제든 변경이 가능해요.
            </p>
          </div>
        </div>
        <div className="mt-9 flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-1 rounded-xl bg-[#F5F5F5] px-4 py-3 w-full">
              <p className="text-sm font-regular text-black">linkku.us/</p>
              <input
                className="w-full bg-transparent text-sm font-medium text-black outline-none placeholder:text-black/50"
                type="text"
                placeholder="username"
                value={linkUrl || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setLinkUrl(value);
                  setErrorMessage(null);
                  setHasCheckedUsername(false);
                }}
                onBlur={(event) => {
                  const value = event.target.value;
                  if (value.trim()) {
                    handleCheckUsernameExists(value);
                  } else {
                    setIsUsernameExists(false);
                    setHasCheckedUsername(false);
                  }
                }}
                disabled={isSubmitting}
              />
            </div>
            {isUsernameExists && (
              <span className="text-[12px] font-medium text-[#FF0000] pl-4">
                이 유저명은 다른 사람이 사용하고 있어요
              </span>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <button
              className={`w-full rounded-xl py-3 text-base font-semibold transition-colors ${
                isButtonDisabled
                ? 'bg-[#F1F1F1] text-[#B3B3B3] cursor-not-allowed'
                : 'bg-[#B1FF8D] text-black'
              }`}
              onClick={() => handleSaveLinkUrl(linkUrl || '')}
              disabled={isButtonDisabled}
              >
              추가하기
            </button>
            <p className="text-center text-[13px] text-[#6E6E6E]">
              이미 계정이 있으신가요?{' '}
              <Link to="/logIn" className="text-[#516FFF] font-semibold">
                로그인하러 가기
              </Link>
            </p>
            {errorMessage && (
              <p className="text-[12px] font-medium text-[#FF0000] text-center">{errorMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  },
});

export default userSetUsernameRoute;
