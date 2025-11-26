import { createRoute } from '@tanstack/react-router';
import rootRoute from './root';
import { useEffect, useState } from 'react';
import { getProfileByUsername } from '../api/profileAPI';
import { getLatestCustomTemplateByUser } from '../api/templateAPI';
import type { PublicTemplate } from '../api/templateAPI';

const publicTemplateRoute = createRoute({
  path: '$username',
  getParentRoute: () => rootRoute,
  component: function PublicTemplatePage() {
    const { username } = publicTemplateRoute.useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [template, setTemplate] = useState<PublicTemplate | null>(null);

    useEffect(() => {
      const fetchTemplate = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const profile = await getProfileByUsername(username);
          if (!profile) {
            setTemplate(null);
            setError('존재하지 않는 사용자입니다.');
            setIsLoading(false);
            return;
          }

          const latestTemplate = await getLatestCustomTemplateByUser(profile.id);
          if (!latestTemplate) {
            setTemplate(null);
            setError('아직 공개된 템플릿이 없어요.');
            setIsLoading(false);
            return;
          }

          setTemplate(latestTemplate);
        } catch (err) {
          setError(err instanceof Error ? err.message : '템플릿을 불러오지 못했습니다.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchTemplate();
    }, [username]);

    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col items-center justify-center p-8">
        {isLoading && <p className="text-[#757575] text-sm">템플릿을 불러오는 중...</p>}
        {!isLoading && error && (
          <div className="text-center">
            <p className="text-lg font-semibold text-[#101010] mb-2">Oops!</p>
            <p className="text-sm text-[#757575]">{error}</p>
          </div>
        )}
        {!isLoading && template && (
          <div className="w-[360px] h-[640px] rounded-[32px] shadow-2xl overflow-hidden relative">
            {template.isBackgroundColored && template.backgroundColor ? (
              <div className="absolute inset-0" style={{ backgroundColor: template.backgroundColor }} />
            ) : template.backgroundImageUrl ? (
              <img
                src={template.backgroundImageUrl}
                alt="템플릿 배경"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-white" />
            )}
            <div className="absolute inset-0 p-6 flex flex-col gap-4 overflow-hidden">
              {template.items.map((item, index) => {
              if (item.imageUrl) {
                return (
                  <img
                    key={item.index ?? index}
                    src={item.imageUrl}
                    alt={`사용자 이미지 ${index + 1}`}
                    className="w-full rounded-2xl object-cover"
                    style={{ transform: `rotate(${item.rotation ?? 0}deg)` }}
                  />
                );
              }

              if (item.text) {
                return (
                  <p
                    key={item.index ?? index}
                    className="text-center"
                    style={{
                      fontSize: `${item.font?.size ?? 18}px`,
                      fontWeight: item.font?.weight ?? 600,
                      color: item.font?.color ?? '#FFFFFF',
                      fontFamily: item.font?.family ?? 'classic',
                    }}
                  >
                    {item.text}
                  </p>
                );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  },
});

export default publicTemplateRoute;
