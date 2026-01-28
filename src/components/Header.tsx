import { useState } from 'react';
import IconArrowLeft from '../assets/icons/ic_arrow_left.svg?react';
import ConfirmModal from './ConfirmModal';

type HeaderProps = {
  useConfirmOnBack?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  onConfirmBack?: () => void;
  rightAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    ariaLabel?: string;
  };
};

const Header = ({
  useConfirmOnBack = false,
  confirmTitle = '이전으로 돌아갈까요?',
  confirmMessage = '지금 돌아가면 현재 작업 중인 내용이 삭제됩니다.',
  onConfirmBack,
  rightAction,
}: HeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGoBack = () => {
    if (useConfirmOnBack) {
      setIsModalOpen(true);
      return;
    }
    history.back();
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    if (onConfirmBack) {
      onConfirmBack();
      return;
    }
    history.back();
  };

  const handleCancel = () => setIsModalOpen(false);

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full p-5 flex items-center justify-between">
        <button onClick={handleGoBack} aria-label="이전으로 이동" className="w-10 h-10 bg-white/70 rounded-full backdrop-blur-sm flex items-center justify-center">
          <IconArrowLeft className="w-5 h-5" aria-hidden />
        </button>
        {rightAction ? (
          <button
            type="button"
            onClick={rightAction.onClick}
            disabled={rightAction.disabled}
            aria-label={rightAction.ariaLabel ?? rightAction.label}
            className="px-4 h-10 bg-white/70 text-[#222222] text-[15px] leading-none font-semibold rounded-full border border-white/40 backdrop-blur-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {rightAction.label}
          </button>
        ) : (
          <span className="w-5" aria-hidden />
        )}
      </div>

      {useConfirmOnBack && (
        <ConfirmModal
          isOpen={isModalOpen}
          title={confirmTitle}
          message={confirmMessage}
          confirmLabel="돌아가기"
          cancelLabel="계속 수정하기"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default Header;
