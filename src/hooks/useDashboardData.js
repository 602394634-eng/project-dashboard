import { useState, useEffect, useCallback, useRef } from 'react';
import { loadAllSheets, triggerSync, getSyncStatus } from '../api/wps.js';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5分钟自动刷新

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncInfo, setSyncInfo] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sheets = await loadAllSheets();
      setData(sheets);
      
      // 获取同步状态
      const status = await getSyncStatus();
      if (status) {
        setSyncInfo(status);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 先触发后端同步
      const result = await triggerSync();
      if (result) {
        console.log('Sync result:', result);
      }
      // 重新加载数据
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  }, [loadData]);

  // 自动定时刷新
  useEffect(() => {
    loadData();
    
    // 设置定时刷新
    intervalRef.current = setInterval(() => {
      console.log('Auto-refreshing data...');
      loadData();
    }, REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadData]);

  return { 
    data, 
    loading, 
    error, 
    refresh,
    syncInfo,
    isSyncing,
  };
}
