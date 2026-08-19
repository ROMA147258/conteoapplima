import { useState, useCallback } from 'react';
import { apiGet } from '../services/api/apiClient';

export const useCharts = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = useCallback(async (apiUrl) => {
    setIsLoading(true);
    try {
      const res = await apiGet({ action: 'obtener_reporte' }, apiUrl);
      if (res && res.success) {
        setReportData(res);
      }
    } catch (e) {
      console.warn('[useCharts] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reportData,
    isLoading,
    fetchReport
  };
};
