import { useState, useEffect } from 'react';

export function useApi<T>(endpoint: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  let apiEndpoint = endpoint.replace('app_', '');
  if (apiEndpoint === 'injury_categories') {
    apiEndpoint = 'categories';
  } else if (apiEndpoint === 'injurys') {
    apiEndpoint = 'injuries';
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${apiEndpoint}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
      // Fallback for demo purposes if backend isn't up
      const cached = localStorage.getItem(endpoint);
      if (cached) setData(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  const updateData = async (newData: T | ((prev: T) => T)) => {
    const valueToStore = newData instanceof Function ? newData(data) : newData;
    setData(valueToStore);
    
    // For demo purposes, we also update local storage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(endpoint, JSON.stringify(valueToStore));
    }

    // Ideally here we would send a bulk update or individual updates depending on the API design
    // Since this is a simple replacement for local storage, we won't implement full sync here
    // But actual save operations should be done via POST/PUT requests in the components
  };

  return [data, updateData, loading, fetchData] as const;
}
