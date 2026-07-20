import { http } from "./http";

export async function upsertRatings(payload: {
  playerId: string;
  ratings: { skillId: string; rating: number }[];
}) {
  const { data } = await http.put<{ status: string }>("/ratings/upsert", payload);
  return data;
}

export async function getCurrentRatings(playerId: string) {
  const { data } = await http.get<Record<string, number>>(`/ratings/player/${playerId}/current`);
  return data;
}

export type RatingHistoryItem = { skillId: string; rating: number; current: boolean };

export async function getHistory(playerId: string) {
  const { data } = await http.get<RatingHistoryItem[]>(`/ratings/player/${playerId}/history`);
  return data;
}