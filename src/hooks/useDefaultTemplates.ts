import { useState, useEffect, useCallback } from 'react';
import type { DefaultTemplate } from '../types/templates';
import { getDefaultTemplates } from '../api/templateAPI';

type UseDefaultTemplatesResult = {
  templates: DefaultTemplate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useDefaultTemplates(): UseDefaultTemplatesResult {
  const [templates, setTemplates] = useState<DefaultTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDefaultTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류입니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    refetch: fetchTemplates,
  };
}

