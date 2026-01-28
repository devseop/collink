import { type ComponentType, useEffect } from 'react';
import ReactModal from 'react-modal';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Register once for accessibility
if (typeof document !== 'undefined') {
  ReactModal.setAppElement('#root');
}
const Modal = ReactModal as unknown as ComponentType<ReactModal.Props>;

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      ReactModal.setAppElement('#root');
    }
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
      className="fixed left-1/2 top-1/2 w-[320px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-6 shadow-xl outline-none"
      overlayClassName="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      closeTimeoutMS={120}
    >
      <div className="flex flex-col gap-4 pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#1F1F1F] text-center">{title}</h2>
          <p className="text-sm text-[#4B4B4B] leading-relaxed text-center">{message}</p>
        </div>
        <div className="flex flex-col justify-between">
          <button
            type="button"
            onClick={onConfirm}
            className="text-[#FF4322] px-3 py-4 text-[14px] font-semibold"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-4 text-[14px] font-regular text-[#1F1F1F]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
