import { create } from 'zustand';
import type { Overlay } from '../types/overlay';

export type TemplateEditorSnapshot = {
  backgroundImageUrl: string | null;
  backgroundFile: File | null;
  backgroundColor: string | null;
  isBackgroundColored: boolean;
  overlays: Overlay[];
  animationType?: 'default' | 'spread' | 'collage';
};

type TemplateEditorState = {
  draft: TemplateEditorSnapshot;
  committed: TemplateEditorSnapshot | null;
  sourceTemplateId: string | null;
  setDraft: (
    updater:
      | Partial<TemplateEditorSnapshot>
      | ((draft: TemplateEditorSnapshot) => TemplateEditorSnapshot)
  ) => void;
  replaceDraft: (snapshot: TemplateEditorSnapshot, sourceTemplateId?: string | null) => void;
  commitDraft: (sourceTemplateId?: string | null) => void;
  clearCommitted: () => void;
  resetDraft: () => void;
  resetAll: () => void;
};

const createEmptySnapshot = (): TemplateEditorSnapshot => ({
  backgroundImageUrl: null,
  backgroundFile: null,
  backgroundColor: null,
  isBackgroundColored: false,
  overlays: [],
  animationType: 'default',
});

const cloneSnapshot = (snapshot: TemplateEditorSnapshot): TemplateEditorSnapshot => ({
  backgroundImageUrl: snapshot.backgroundImageUrl,
  backgroundFile: snapshot.backgroundFile,
  backgroundColor: snapshot.backgroundColor,
  isBackgroundColored: snapshot.isBackgroundColored,
  overlays: snapshot.overlays.map((overlay) => ({ ...overlay })),
  animationType: snapshot.animationType ?? 'default',
});

const overlaysEqual = (left: Overlay[], right: Overlay[]) => {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];

    if (a.type !== b.type || a.id !== b.id || a.x !== b.x || a.y !== b.y) {
      return false;
    }

    if (a.type === 'image' && b.type === 'image') {
      if (
        a.image !== b.image ||
        a.file !== b.file ||
        a.rotation !== b.rotation ||
        a.baseWidth !== b.baseWidth ||
        a.baseHeight !== b.baseHeight ||
        a.scalePercent !== b.scalePercent ||
        a.linkUrl !== b.linkUrl ||
        a.linkDescription !== b.linkDescription
      ) {
        return false;
      }
      continue;
    }

    if (a.type === 'text' && b.type === 'text') {
      if (
        a.text !== b.text ||
        a.fontSize !== b.fontSize ||
        a.fontWeight !== b.fontWeight ||
        a.fontFamily !== b.fontFamily ||
        a.rotation !== b.rotation ||
        a.scalePercent !== b.scalePercent ||
        a.textColor !== b.textColor ||
        a.boxStyle !== b.boxStyle ||
        a.underline !== b.underline ||
        a.strikethrough !== b.strikethrough
      ) {
        return false;
      }
    }
  }

  return true;
};

const snapshotsEqual = (left: TemplateEditorSnapshot, right: TemplateEditorSnapshot) =>
  left.backgroundImageUrl === right.backgroundImageUrl &&
  left.backgroundFile === right.backgroundFile &&
  left.backgroundColor === right.backgroundColor &&
  left.isBackgroundColored === right.isBackgroundColored &&
  (left.animationType ?? 'default') === (right.animationType ?? 'default') &&
  overlaysEqual(left.overlays, right.overlays);

export const useTemplateEditorStore = create<TemplateEditorState>((set) => ({
  draft: createEmptySnapshot(),
  committed: null,
  sourceTemplateId: null,
  setDraft: (updater) =>
    set((state) => {
      const nextDraftRaw =
        typeof updater === 'function'
          ? (updater as (draft: TemplateEditorSnapshot) => TemplateEditorSnapshot)(state.draft)
          : { ...state.draft, ...updater };

      const nextDraft: TemplateEditorSnapshot = {
        ...nextDraftRaw,
        overlays: [...nextDraftRaw.overlays],
        animationType: nextDraftRaw.animationType ?? 'default',
      };

      if (snapshotsEqual(state.draft, nextDraft)) {
        return state;
      }

      return { draft: nextDraft };
    }),
  replaceDraft: (snapshot, sourceTemplateId = null) =>
    set(() => ({
      draft: cloneSnapshot(snapshot),
      sourceTemplateId,
    })),
  commitDraft: (sourceTemplateId = null) =>
    set((state) => ({
      committed: cloneSnapshot(state.draft),
      sourceTemplateId: sourceTemplateId ?? state.sourceTemplateId,
    })),
  clearCommitted: () =>
    set(() => ({
      committed: null,
    })),
  resetDraft: () =>
    set(() => ({
      draft: createEmptySnapshot(),
    })),
  resetAll: () =>
    set(() => ({
      draft: createEmptySnapshot(),
      committed: null,
      sourceTemplateId: null,
    })),
}));
