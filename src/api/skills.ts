import { http } from "./http";

export type Skill = { id: string; name: string; active: boolean };

export async function listSkills() {
  const { data } = await http.get<Skill[]>("/skills");
  return data;
}

export async function createSkill(payload: { name: string }) {
  const { data } = await http.post<Skill>("/skills", payload);
  return data;
}

export async function updateSkill(id: string, data: { name?: string; active?: boolean }) {
  return http.put(`/skills/${id}`, data).then(res => res.data);
}

export async function deleteSkill(id: string) {
  return http.delete(`/skills/${id}`);
}