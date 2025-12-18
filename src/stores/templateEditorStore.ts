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

export const useTemplateEditorStore = create<TemplateEditorState>((set) => ({
  draft: createEmptySnapshot(),
  committed: null,
  sourceTemplateId: null,
  setDraft: (updater) =>
    set((state) => {
      const nextDraft =
        typeof updater === 'function'
          ? (updater as (draft: TemplateEditorSnapshot) => TemplateEditorSnapshot)(state.draft)
          : { ...state.draft, ...updater };
      return { draft: { ...nextDraft, overlays: [...nextDraft.overlays] } };
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
