/**
 * 모바일 디바이스 감지 함수
 * User-Agent와 화면 너비를 기반으로 모바일 환경을 판단합니다.
 */
export const isMobileDevice = (): boolean => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
};

