import { useCallback, useMemo, useState } from 'react';
import type { DefaultTemplate, TemplateItem, Category } from '../types/templates';
import { safeRandomUUID } from '../utils/random';

export type TemplateItemType = 'image' | 'text' | 'link' | 'background';

export type EditableTemplateItem = TemplateItem & {
  id: string;
  type: TemplateItemType;
  rotation?: number;
  label?: string;
};

export type TemplateBackgroundState = {
  imageUrl?: string;
  color?: string;
  isColored?: boolean;
};

export type TemplateEditorState = {
  items: EditableTemplateItem[];
  background: TemplateBackgroundState;
  category?: Category;
  sourceTemplateId?: string;
};

type TemplateEditorActionReturn = TemplateEditorState & {
  selectedItemId: string | null;
  selectItem: (id: string | null) => void;
  addItem: (item: Omit<EditableTemplateItem, 'id'>) => void;
  updateItem: (id: string, updater: (item: EditableTemplateItem) => EditableTemplateItem) => void;
  removeItem: (id: string) => void;
  setBackground: (background: TemplateBackgroundState) => void;
  resetFromTemplate: (template: DefaultTemplate | null) => void;
};

const DEFAULT_ITEM_TYPE: TemplateItemType = 'image';

const mapTemplateItems = (items: TemplateItem[] | undefined): EditableTemplateItem[] =>
  (items ?? []).map((item, index) => ({
    ...item,
    id: item?.hasLink ? `${item.linkUrl ?? 'link'}-${index}` : `${item?.imageUrl ?? 'item'}-${index}`,
    type: (item?.hasLink && item.linkUrl) ? 'link' : DEFAULT_ITEM_TYPE,
  }));

const buildStateFromTemplate = (template: DefaultTemplate | null | undefined): TemplateEditorState => ({
  items: mapTemplateItems(template?.items),
  background: {
    imageUrl: template?.backgroundImageUrl,
    color: template?.backgroundColor,
    isColored: template?.isBackgroundColored,
  },
  category: template?.category,
  sourceTemplateId: template?.id,
});

export function useTemplateEditor(initialTemplate: DefaultTemplate | null = null): TemplateEditorActionReturn {
  const [state, setState] = useState<TemplateEditorState>(() => buildStateFromTemplate(initialTemplate));
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectItem = useCallback((id: string | null) => {
    setSelectedItemId(id);
  }, []);

  const addItem = useCallback((item: Omit<EditableTemplateItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...item,
          id: safeRandomUUID(),
        },
      ],
    }));
  }, []);

  const updateItem = useCallback((id: string, updater: (item: EditableTemplateItem) => EditableTemplateItem) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? updater(item) : item)),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
    setSelectedItemId((current) => (current === id ? null : current));
  }, []);

  const setBackground = useCallback((background: TemplateBackgroundState) => {
    setState((prev) => ({
      ...prev,
      background,
    }));
  }, []);

  const resetFromTemplate = useCallback((template: DefaultTemplate | null) => {
    setState(buildStateFromTemplate(template));
    setSelectedItemId(null);
  }, []);

  return useMemo(
    () => ({
      ...state,
      selectedItemId,
      selectItem,
      addItem,
      updateItem,
      removeItem,
      setBackground,
      resetFromTemplate,
    }),
    [state, selectedItemId, selectItem, addItem, updateItem, removeItem, setBackground, resetFromTemplate]
  );
}
