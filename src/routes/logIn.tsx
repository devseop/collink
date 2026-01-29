import { createRoute, useNavigate } from '@tanstack/react-router';
import rootRoute from './root';
import { useAuth } from '../hooks/useAuth';
import IconLogo from '../assets/icons/symbol_linkku.svg?react'; 
import IconGoogle from '../assets/icons/symbol_google.png';   
import ImageWelcomeBack from '../assets/illusts/illust_welcomeBack.png';
import { Link } from '@tanstack/react-router';


const logInRoute = createRoute({
  path: '/logIn',
  getParentRoute: () => rootRoute,
  component: function LogInPage() {
    const navigate = useNavigate();
    const { signIn, isLoading } = useAuth();


    return (
      <div className="flex flex-col px-5 h-full">
        <button className="w-full flex items-center justify-center mt-8" onClick={() => navigate({ to: '/', search: {} })}>
          <IconLogo className="w-fit h-8" aria-hidden />
        </button>
        <div className="flex flex-col items-center justify-center pt-[140px]">
          <img src={ImageWelcomeBack} alt="Welcome Back" className="max-w-[320px] max-h-[240px] object-cover mb-6" />
          <div className="flex flex-col gap-4">
            <p className="text-[32px] text-center font-bold leading-none">돌아온 걸 환영해요!</p>
            <p className="text-sm text-center text-[#6E6E6E]">로그인하고 링꾸를 완성해보세요</p>
          </div>
          <div className="flex flex-col items-center justify-center w-full mt-10 gap-4">
            <button className="flex flex-row gap-3 py-3 bg-white items-center justify-center rounded-xl w-full min-h-[48px] border border-[#E0E0E0]" disabled={isLoading} onClick={() => signIn('google')}>
              <img src={IconGoogle} alt="Google" className="w-6 h-6" />
              <span className="text-base font-semibold text-black leading-none">구글로 시작하기</span>
            </button>
            <p className="flex flex-row gap-1 items-center">
              <span className="text-sm text-[#6E6E6E]">아직 계정이 없으신가요?</span>
              <Link to="/signUp" className="text-sm text-[#516FFF] font-semibold">회원가입하기</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }, 
});

export default logInRoute;
