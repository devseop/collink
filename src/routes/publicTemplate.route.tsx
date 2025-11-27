import { createRoute } from '@tanstack/react-router';
import rootRoute from './root';
import { useEffect, useState } from 'react';
import { getProfileByUsername } from '../api/profileAPI';
import { getLatestPublishedCustomTemplateByUser } from '../api/templateAPI';
import type { PublicTemplate } from '../api/templateAPI';
import { mapTemplateItemsToRender } from '../utils/templateRender';

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

          const latestTemplate = await getLatestPublishedCustomTemplateByUser(profile.id);
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
      <div className="relative min-h-screen w-full overflow-hidden bg-[#000]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[#757575] text-sm">템플릿을 불러오는 중...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white/80 px-4 py-3 rounded-xl shadow">
              <p className="text-lg font-semibold text-[#101010] mb-2">Oops!</p>
              <p className="text-sm text-[#757575]">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && template && (
          <>
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

            <div className="absolute inset-0 overflow-hidden">
              {mapTemplateItemsToRender(template.items).map((item) => {
                if (item.type === 'image') {
                  return (
                    <img
                      key={item.key}
                      src={item.src}
                      alt="사용자 이미지"
                      className="absolute object-cover rounded-2xl"
                      style={{
                        left: `${item.style.left}px`,
                        top: `${item.style.top}px`,
                        width: item.style.width ? `${item.style.width}px` : undefined,
                        height: item.style.height ? `${item.style.height}px` : undefined,
                        transform: `rotate(${item.style.rotation}deg)`,
                        transformOrigin: 'center',
                        zIndex: item.style.zIndex,
                      }}
                    />
                  );
                }

                return (
                  <p
                    key={item.key}
                    className="absolute text-center"
                    style={{
                      left: `${item.style.left}px`,
                      top: `${item.style.top}px`,
                      fontSize: `${item.font?.size ?? 18}px`,
                      fontWeight: item.font?.weight ?? 600,
                      color: item.font?.color ?? '#FFFFFF',
                      fontFamily: item.font?.family ?? 'classic',
                      transform: `rotate(${item.style.rotation}deg)`,
                      transformOrigin: 'center',
                      zIndex: item.style.zIndex,
                    }}
                  >
                    {item.text}
                  </p>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  },
  });

export default publicTemplateRoute;
