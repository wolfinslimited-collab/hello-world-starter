/**
 * Backend Status Checker
 * Provides real-time backend connectivity status
 */

import { useState, useEffect, useCallback } from 'react';
import { baseUrl } from 'utils/request';

export interface BackendStatus {
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  error: string | null;
}

export const useBackendStatus = (checkInterval = 30000) => {
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: false,
    latency: null,
    lastChecked: null,
    error: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        setStatus({
          isOnline: true,
          latency,
          lastChecked: new Date(),
          error: null,
        });
      } else {
        setStatus({
          isOnline: false,
          latency: null,
          lastChecked: new Date(),
          error: `HTTP ${response.status}`,
        });
      }
    } catch (err: any) {
      setStatus({
        isOnline: false,
        latency: null,
        lastChecked: new Date(),
        error: err.message || 'Connection failed',
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkStatus();
    
    // Set up interval
    const interval = setInterval(checkStatus, checkInterval);
    
    return () => clearInterval(interval);
  }, [checkStatus, checkInterval]);

  return { status, isChecking, checkStatus };
};

export default useBackendStatus;
