import { useState, useEffect } from 'react';

const STORAGE_KEY = 'accountsStatus';

export function useAccountStatusCache(ttlMs: number = 3600000) {
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < ttlMs) {
          setChecked(data);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [ttlMs]);

  const saveChecked = (data: string[]) => {
    setChecked(data);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  };

  return { checked, saveChecked };
}
