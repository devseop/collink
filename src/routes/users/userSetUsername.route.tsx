import { createRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { createProfile, getProfile, updateUsername } from '../../api/profileAPI';
import usersRoute from './users.route';

const userSetUsernameRoute = createRoute({
  path: '$userId/setUsername',
  getParentRoute: () => usersRoute,
  loader: async ({ params }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: '/signIn',
        replace: true,
      });
    }

    if (session.user.id !== params.userId) {
      throw redirect({
        to: '/users/$userId/setUsername',
        params: { userId: session.user.id },
        replace: true,
      });
    }

    let profile = await getProfile(session.user.id);

    if (!profile) {
      profile = await createProfile(session.user.id);
    }

    if (profile.username) {
      throw redirect({
        to: '/users/$userId/profile',
        params: { userId: session.user.id },
        replace: true,
      });
    }

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
          await navigate({ to: '/', replace: true });
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
      <div className="flex flex-col gap-[48px] w-full">
        <div className="flex flex-col gap-3">
          <p className="text-[32px] font-extrabold text-center">만나서 반가워요!</p>
          <div>
            <p className="text-[15px] font-medium text-[#757575] text-center">
              product name에서 사용할 링크를 입력해주세요
            </p>
            <p className="text-[15px] font-medium text-[#757575] text-center">링크는 언제든 수정이 가능해요</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-start gap-1 bg-[#F5F5F5] px-4 py-3 rounded-lg w-full">
              <p className="text-[15px] font-medium text-[#B3B3B3]">linkku.io/</p>
              <input
                className="placeholder:text-[#B3B3B3] placeholder:font-medium w-full mt-[-1px] bg-transparent"
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
              <span className="text-[12px] font-medium text-[#FF0000] pl-4 pt-2">
                이 유저명은 다른 사람이 사용하고 있어요
              </span>
            )}
          </div>
          <button
            className="w-full h-[48px] rounded-lg flex items-center justify-center text-white font-bold"
            onClick={() => handleSaveLinkUrl(linkUrl || '')}
            disabled={isButtonDisabled}
            style={{
              backgroundColor: isButtonDisabled ? '#F5F5F5' : '#000000',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            저장
          </button>
          {errorMessage && (
            <p className="text-[12px] font-medium text-[#FF0000] text-center">{errorMessage}</p>
          )}
        </div>
      </div>
    );
  },
});

export default userSetUsernameRoute;
