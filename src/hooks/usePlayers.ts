import { useState, useEffect } from 'react';
import { listPlayers, type Player } from '../api/players';

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const data = await listPlayers();
        setPlayers(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar jogadores');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  return { players, loading, error };
};