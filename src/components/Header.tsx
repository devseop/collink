import { useState } from 'react';
import { Tab, TabList, Tabs } from 'react-aria-components';
import IconArrowLeft from '../assets/icons/ic_arrow_left.svg?react';
import ConfirmModal from './ConfirmModal';

type HeaderTabKey = 'edit' | 'select';

type HeaderProps = {
  useConfirmOnBack?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  onConfirmBack?: () => void;
  templateTabs?: {
    selectedKey: HeaderTabKey;
    onSelectionChange: (key: HeaderTabKey) => void;
  };
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
  templateTabs,
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
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between pl-[calc(env(safe-area-inset-left)+1.25rem)] pr-[calc(env(safe-area-inset-right)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-5">
        <button onClick={handleGoBack} aria-label="이전으로 이동" className="w-10 h-10 bg-white/70 rounded-full backdrop-blur-sm flex items-center justify-center">
          <IconArrowLeft className="w-5 h-5" aria-hidden />
        </button>
        {templateTabs && (
          <Tabs
            selectedKey={templateTabs.selectedKey}
            onSelectionChange={(key) => {
              if (key === 'edit' || key === 'select') {
                templateTabs.onSelectionChange(key);
              }
            }}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <TabList className="flex items-center rounded-full bg-white/35 p-[2px] backdrop-blur-sm">
              <Tab id="edit" className="cursor-pointer rounded-full px-3 py-[10px] text-[15px] text-[#222222] opacity-40 data-[selected]:font-semibold data-[selected]:bg-white/70 data-[selected]:opacity-100">
                직접 꾸미기
              </Tab>
              <Tab id="select" className="cursor-pointer rounded-full px-3 py-[10px] text-[15px] text-[#222222] opacity-40 data-[selected]:font-semibold data-[selected]:bg-white/70 data-[selected]:opacity-100">
                템플릿 적용
              </Tab>
            </TabList>
          </Tabs>
        )}
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
          <span className="w-10" aria-hidden />
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
