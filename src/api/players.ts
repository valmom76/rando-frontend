import { http } from "./http";

export interface Player {
  id: string;
  name: string;
  sex: string;
  active: boolean;
  email?: string;
  phone?: string;
  birthDate?: string;
  positions?: {
    positionId: string;
    name: string;
    priority: number;
  }[];  
  ratings?: Record<string, number>;  // skillName → rating
  overall?: number;  
}

export const listPlayers = async (): Promise<Player[]> => {
  const { data } = await http.get<Player[]>("/players");
  return data;
};

export const createPlayer = async (player: {
  name: string;
  sex: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  positions?: { positionId: string; priority: number }[];  // ← ADICIONADO
}) => {
  const { data } = await http.post<Player>("/players", player);
  return data;
};

export const updatePlayer = async (
  id: string,
  updates: {
    name?: string;
    sex?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    active?: boolean;
    positions?: { positionId: string; priority: number }[];  // ← ADICIONADO
  }
) => {
  const { data } = await http.put<Player>(`/players/${id}`, updates);
  return data;
};

export const deletePlayer = async (id: string) => {
  await http.delete(`/players/${id}`);
};

export const listPlayersWithRatings = async (): Promise<Player[]> => {
  const { data } = await http.get<Player[]>("/players/with-ratings");
  return data;
};