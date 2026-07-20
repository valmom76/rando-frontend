import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/config';

export const useMatchUpdates = (
  championshipId: string,
  onUpdate: (data: any) => void,
  enabled: boolean = true
) => {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || !championshipId) {
      return;
    }

    const eventSource = new EventSource(
      `${API_BASE_URL}/championships/${championshipId}/stream`
    );

    eventSource.addEventListener('matchUpdate', (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdateRef.current(data);
      } catch (e) {
        console.error('Erro ao processar evento SSE', e);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE error', err);
    };

    return () => {
      eventSource.close();
    };
  }, [championshipId, enabled]);
};