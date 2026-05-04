import { useState, useEffect, useContext } from 'react';
import { AutoRefreshContext } from '../contexts/AutoRefreshContext';

export const useFetch = (fetchFn, interval = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoRefresh = useContext(AutoRefreshContext);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchFn();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Only set up interval if autoRefresh is enabled
    if (interval && autoRefresh) {
      const intervalId = setInterval(fetchData, interval);
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh]); // Re-run when autoRefresh changes

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};
