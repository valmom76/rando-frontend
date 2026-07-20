import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { authStore } from '../auth/store';

export function usePlanSync(intervalMs: number = 60000) {
  const location = useLocation();
  const lastSyncRef = useRef<number>(0);

  // Sincroniza ao montar o componente
  useEffect(() => {
    authStore.syncPlan();
    lastSyncRef.current = Date.now();

    // Polling a cada intervalo
    const interval = setInterval(async () => {
      await authStore.syncPlan();
      lastSyncRef.current = Date.now();
    }, intervalMs);

    return () => clearInterval(interval);
  }, []);

  // Sincroniza ao mudar de rota (se passou mais de 10s)
  useEffect(() => {
    const now = Date.now();
    if (now - lastSyncRef.current > 10000) {
      authStore.syncPlan();
      lastSyncRef.current = now;
    }
  }, [location.pathname]);
}