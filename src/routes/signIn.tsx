import { createRoute, useNavigate } from '@tanstack/react-router';
import rootRoute from './root';
import { useAuth } from '../hooks/useAuth';
import IconLogo from '../assets/icons/symbol_linkku.svg?react'; 
import IconGoogle from '../assets/icons/symbol_google.png';   


const signInRoute = createRoute({
  path: '/signIn',
  getParentRoute: () => rootRoute,
  component: function SignInPage() {
    const navigate = useNavigate();
    const { signIn, isLoading } = useAuth();


    return (
      <div className="flex flex-col px-5 h-full bg-[#C7F9A5]">
        <button onClick={() => navigate({ to: '/', search: {} })}>
        <IconLogo className="w-16 h-16" aria-hidden />
        </button>
        <div className="flex flex-col items-center justify-center pt-20">
          <p className="text-[56px] font-normal text-center font-main leading-none">DRESS UP</p>
          <p className="text-[56px] font-normal text-center font-main leading-none">YOUR LINK</p>
        </div>
        <div className="flex flex-col items-center justify-center h-full">
          <button className="flex flex-row gap-3 px-4 py-3 bg-black items-center rounded-[28px] w-fit fixed bottom-10" disabled={isLoading} onClick={() => signIn('google')}>
            <img src={IconGoogle} alt="Google" className="w-6 h-6" />
            <span className="text-base font-semibold text-white leading-none">Continue with Google</span>
          </button>
        </div>
      </div>
    );
  }, 
});

export default signInRoute;
