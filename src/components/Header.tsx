import { useEffect, useState } from 'react';
import ReactModal from 'react-modal';
import IconArrowLeft from '../assets/icons/ic_arrow_left.svg?react';

type HeaderProps = {
  useConfirmOnBack?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  onConfirmBack?: () => void;
};

// Register once for accessibility
if (typeof document !== 'undefined') {
  ReactModal.setAppElement('#root');
}

const Header = ({
  useConfirmOnBack = false,
  confirmTitle = '이전으로 돌아갈까요?',
  confirmMessage = '지금 돌아가면 현재 작업 중인 내용이 삭제됩니다.',
  onConfirmBack,
}: HeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      ReactModal.setAppElement('#root');
    }
  }, []);

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
      <div className="fixed top-0 left-0 z-50 w-full px-5 py-3 bg-transparent flex items-center justify-between">
        <button onClick={handleGoBack} aria-label="이전으로 이동">
          <IconArrowLeft className="w-5 h-5" aria-hidden />
        </button>
      </div>

      {useConfirmOnBack && (
        <ReactModal
          isOpen={isModalOpen}
          onRequestClose={handleCancel}
          className="fixed left-1/2 top-1/2 w-[320px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-6 shadow-xl outline-none"
          overlayClassName="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          closeTimeoutMS={120}
        >
          <div className="flex flex-col gap-4 pt-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[#1F1F1F] text-center">{confirmTitle}</h2>
              <p className="text-sm text-[#4B4B4B] leading-relaxed text-center">{confirmMessage}</p>
            </div>
            <div className="flex flex-col justify-between">
              <button
                type="button"
                onClick={handleConfirm}
                className="text-[#FF4322] px-3 py-4 text-[14px] font-semibold"
              >
                돌아가기
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-4 text-[14px] font-regular text-[#1F1F1F]"
              >
                계속 수정하기
              </button>
            </div>
          </div>
        </ReactModal>
      )}
    </>
  );
};

export default Header;
