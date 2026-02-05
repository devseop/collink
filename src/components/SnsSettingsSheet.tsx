import { useEffect, useMemo, useState } from 'react';
import { Switch } from 'react-aria-components';

import type { ProfileLink, ProfileLinkType } from '../api/profileLinksAPI';

import IconEdit from '../assets/icons/ic_edit_stroke.svg?react';
import IconChevronRight from '../assets/icons/ic_chevronRight_stroke.svg?react';
import IconClose from '../assets/icons/ic_close_stroke_black.svg?react';
import IconArrowLeft from '../assets/icons/ic_arrowBack_stroke.svg?react';
import IconTrash from '../assets/icons/ic_trash_stroke.svg?react';

export type SnsListItem = {
  type: ProfileLinkType;
  name: string;
  icon: React.ReactNode;
};

type SheetMode = 'list' | 'edit' | 'add';

type SnsSettingsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  profileLinks: ProfileLink[];
  snsList: SnsListItem[];
  onToggleActive: (link: ProfileLink, isActive: boolean) => void;
  onEdit: (link: ProfileLink, inputValue: string) => Promise<void>;
  onAdd: (type: ProfileLinkType, inputValue: string) => Promise<void>;
  onDelete: (link: ProfileLink) => void;
};

const INPUT_PLACEHOLDERS: Record<ProfileLinkType, string> = {
  instagram: '인스타그램 아이디를',
  youtube: '유튜브 아이디를',
  tiktok: '틱톡 아이디를',
  twitter: 'X 아이디를',
  email: '이메일 주소를',
};

const INPUT_HINTS: Record<ProfileLinkType, string> = {
  instagram: '예시: instagramusername',
  youtube: '예시: youtubeusername',
  tiktok: '예시: tiktokusername',
  twitter: '예시: xusername',
  email: '예시: hello@example.com',
};

export function SnsSettingsSheet({
  isOpen,
  onClose,
  profileLinks,
  snsList,
  onToggleActive,
  onEdit,
  onAdd,
  onDelete,
}: SnsSettingsSheetProps) {
  const [mode, setMode] = useState<SheetMode>('list');
  const [activeSnsType, setActiveSnsType] = useState<ProfileLinkType | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsVisible(false);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsVisible(true));
      });
      return () => window.cancelAnimationFrame(id);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setIsMounted(false), 200);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setActiveSnsType(null);
      setInputValue('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (isOpen) {
      root.classList.add('body-scroll-lock');
      body.classList.add('body-scroll-lock');
    } else {
      root.classList.remove('body-scroll-lock');
      body.classList.remove('body-scroll-lock');
    }
    return () => {
      root.classList.remove('body-scroll-lock');
      body.classList.remove('body-scroll-lock');
    };
  }, [isOpen]);

  const { addedLinks, notAdded } = useMemo(() => {
    const linksWithUrl = profileLinks.filter((link) => Boolean(link.url?.trim()));
    const added = linksWithUrl
      .map((link) => {
        const item = snsList.find((sns) => sns.type === link.type);
        if (!item) return null;
        return { ...item, link };
      })
      .filter(Boolean);

    const addedTypes = new Set(linksWithUrl.map((link) => link.type));
    const notAddedList = snsList.filter((sns) => !addedTypes.has(sns.type));

    return {
      addedLinks: added as Array<SnsListItem & { link: ProfileLink }>,
      notAdded: notAddedList,
    };
  }, [profileLinks, snsList]);

  const activeItem = useMemo(
    () => (activeSnsType ? snsList.find((sns) => sns.type === activeSnsType) ?? null : null),
    [activeSnsType, snsList]
  );
  const activeLink = useMemo(
    () => (activeSnsType ? profileLinks.find((link) => link.type === activeSnsType) ?? null : null),
    [activeSnsType, profileLinks]
  );

  if (!isMounted) return null;

  const openEdit = (link: ProfileLink) => {
    setMode('edit');
    setActiveSnsType(link.type);
    setInputValue(link.url ?? '');
  };

  const openAdd = (sns: SnsListItem) => {
    setMode('add');
    setActiveSnsType(sns.type);
    setInputValue('');
  };

  const goBackToList = () => {
    setMode('list');
    setActiveSnsType(null);
    setInputValue('');
  };

  const handleSubmit = async () => {
    if (!activeSnsType) return;
    const value = inputValue.trim();
    if (!value) return;
    setIsSubmitting(true);
    try {
      if (mode === 'edit' && activeLink) {
        await onEdit(activeLink, value);
        onClose();
        return;
      }
      if (mode === 'add') {
        await onAdd(activeSnsType, value);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (mode !== 'edit' || !activeLink) return;
    onDelete(activeLink);
    goBackToList();
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="설정 닫기"
        className={`absolute inset-0 bg-black/75 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute left-0 right-0 top-6 h-[calc(100dvh-24px)] rounded-t-2xl bg-white pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E9E9E9] px-5 pb-4">
          {mode === 'list' ? (
            <>
              <p className="text-base font-semibold">SNS 설정</p>
              <button type="button" className="p-1" onClick={onClose} aria-label="닫기">
                <IconClose className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-row items-center gap-3">
                <button type="button" className="p-1" onClick={goBackToList} aria-label="뒤로가기">
                  <IconArrowLeft className="h-4 w-4" aria-hidden />
                </button>
                <p className="text-base font-semibold">
                  {activeItem ? `${activeItem.name} ${mode === 'edit' ? '수정하기' : '추가하기'}` : ''}
                </p>
              </div>
              <button type="button" className="p-1" onClick={onClose} aria-label="닫기">
                <IconClose className="h-4 w-4" aria-hidden />
              </button>
            </>
          )}
        </div>
        {mode === 'list' && (
          <div className="flex flex-col gap-5 pt-4">
            {addedLinks.length > 0 && (
              <div className="flex flex-col gap-3">
                {addedLinks.map((sns) => (
                  <div key={sns.type} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      {sns.icon}
                      <span className="text-sm font-medium">{sns.name}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <button
                        type="button"
                        aria-label={`${sns.name} 수정`}
                        onClick={() => openEdit(sns.link)}
                      >
                        <IconEdit className="h-5 w-5" aria-hidden />
                      </button>
                      <Switch
                        aria-label={`${sns.name} 표시`}
                        isSelected={sns.link.isActive}
                        onChange={(isSelected) => onToggleActive(sns.link, isSelected)}
                        className="group inline-flex items-center"
                      >
                        <span className="relative h-6 w-10 rounded-full bg-[#E5E5E5] p-[2px] transition-colors group-data-[selected]:bg-[#B1FF8D]">
                          <span className="block h-5 w-5 rounded-full bg-white shadow transition-transform group-data-[selected]:translate-x-4" />
                        </span>
                      </Switch>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2">
              <p className="text-sm font-semibold px-5">SNS 추가하기</p>
              <div className="mt-2 flex flex-col gap-3">
                {notAdded.map((sns) => (
                  <button
                    key={sns.type}
                    type="button"
                    className="flex items-center justify-between py-2 px-5"
                    aria-label={`${sns.name} 추가`}
                    onClick={() => openAdd(sns)}
                  >
                    <div className="flex items-center gap-3">
                      {sns.icon}
                      <span className="text-sm font-medium">{sns.name}</span>
                    </div>
                    <IconChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {(mode === 'edit' || mode === 'add') && activeItem && (
          <div className="flex flex-col gap-10 px-5 pt-5">
            <div className="flex flex-col gap-2">
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={`${INPUT_PLACEHOLDERS[activeItem.type]} 입력해주세요`}
                className="w-full rounded-xl bg-[#F4F4F4] px-4 py-3 text-sm text-black placeholder:text-[#B0B0B0] focus:outline-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-[#666666]">{INPUT_HINTS[activeItem.type]}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full rounded-xl bg-[#B1FF8D] px-4 py-3 text-center font-semibold text-black disabled:opacity-60"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {mode === 'add' ? '추가하기' : '수정하기'}
              </button>
              {mode === 'edit' && (
                <button
                  type="button"
                  className="w-full rounded-xl bg-white border border-[#E0E0E0] px-4 py-3 text-center font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <IconTrash className="h-5 w-5 opacity-25" aria-hidden />
                  <span className="text-base font-semibold">삭제하기</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
