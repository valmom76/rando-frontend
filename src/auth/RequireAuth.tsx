import { Navigate } from "react-router-dom";
import { authStore } from "./store";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = authStore.getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Verifica se o token está expirado (decodifica o JWT)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      const isExpired = payload.exp && payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        authStore.clear();
        return <Navigate to="/login" replace />;
      }
    }
  } catch (e) {
    // Token malformado - limpa e redireciona
    authStore.clear();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}