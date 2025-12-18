import { useEffect, useMemo, useState } from 'react';
import ReactModal from 'react-modal';
import IconArrowLeft from '../assets/icons/ic_arrow_left.svg?react';
import { useTemplateEditorStore } from '../stores/templateEditorStore';

// Register the app element for accessibility; guard for non-browser environments
if (typeof document !== 'undefined') {
  ReactModal.setAppElement('#root');
}

const Header = () => {
  const overlays = useTemplateEditorStore((state) => state.draft.overlays);
  const hasDraft = useMemo(() => overlays.length > 0, [overlays.length]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      ReactModal.setAppElement('#root');
    }
  }, []);

  const handleGoBack = () => {
    if (hasDraft) {
      setIsModalOpen(true);
      return;
    }
    history.back();
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
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

      <ReactModal
        isOpen={isModalOpen}
        onRequestClose={handleCancel}
        className="fixed left-1/2 top-1/2 w-[320px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl outline-none"
        overlayClassName="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        closeTimeoutMS={120}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#1F1F1F]">작업을 종료할까요?</h2>
            <p className="text-sm text-[#4B4B4B] leading-relaxed">
              현재 작업 중인 템플릿이 있습니다. 이전으로 이동하면 작업 중인 템플릿이 사라집니다. 이전으로 이동하시겠습니까?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm font-semibold text-[#1F1F1F] hover:bg-[#F8F8F8] transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-xl bg-[#FF5C00] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e95500] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </ReactModal>
    </>
  );
};

export default Header;
