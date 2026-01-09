interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const NavigationButton = ({ children, onClick }: ButtonProps) => {
  return (
    <button className="w-fit px-3 py-2 text-white font-semibold flex items-center justify-center flex-col gap-1" onClick={onClick}>
      {children}
    </button>
  );
};

export default NavigationButton;  