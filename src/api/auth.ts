import { http } from "./http";
import type { SportType } from "../auth/store";

export type AuthResponse = {
  token: string;
  tenantId: string;
  userId: string;
  role: string;
  userName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  planName?: string;
  features?: string[];
  emailVerified?: boolean;
  groupName?: string;
  sportType: SportType;
};

export async function registerTenant(payload: {
  tenantName: string;
  tenantSlug: string;
  sportType: SportType;
  adminName: string;
  email: string;
  password: string;
}) {
  const { data } = await http.post<AuthResponse>("/auth/register-tenant", payload);
  return data;
}

export async function login(payload: { slug: string; email: string; password: string }) {
  const { data } = await http.post<AuthResponse>("/auth/login", payload);
  return data;
}

export function loginBySlug(payload: {
  tenantSlug: string;
  email: string;
  password: string;
}) {
  return http
    .post<AuthResponse>("/auth/login-by-slug", payload)
    .then((r) => r.data);
}
