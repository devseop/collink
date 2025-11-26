import { create } from 'zustand';
import type { DefaultTemplate } from '../types/templates';

type TemplateSelectionState = {
  selectedTemplate: DefaultTemplate | null;
  setSelectedTemplate: (template: DefaultTemplate | null) => void;
  clearSelectedTemplate: () => void;
};

export const useTemplateSelectionStore = create<TemplateSelectionState>((set) => ({
  selectedTemplate: null,
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  clearSelectedTemplate: () => set({ selectedTemplate: null }),
}));

