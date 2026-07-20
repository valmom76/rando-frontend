import { http } from '../api/http';

export type SportType = 'VOLLEYBALL' | 'FOOTBALL';

export type AuthState = {
  token: string | null;
  tenantId: string | null;
  tenantSlug?: string | null;
  userId: string | null;
  role: string | null;
  userName?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  planName?: string | null;
  features?: string[] | null;
  emailVerified?: boolean;
  groupName?: string | null;
  sportType?: SportType | null;
};

export const authStore = {
  set(data: AuthState) {
    localStorage.setItem("auth", JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: data }));
  },
  
  get(): AuthState {
    const raw = localStorage.getItem("auth");
    return raw
      ? (JSON.parse(raw) as AuthState)
      : {
          token: null,
          tenantId: null,
          tenantSlug: null,
          userId: null,
          role: null,
          userName: null,
          primaryColor: null,    
          secondaryColor: null,  
          logoUrl: null,    
          groupName: null,     
          sportType: null,
        };
  },
  
  getToken() {
    return this.get().token;
  },
  
  getTenantSlug() {
    return this.get().tenantSlug ?? null;
  },
  
  clear() {
    localStorage.removeItem("auth");
    window.dispatchEvent(new CustomEvent('auth-changed'));
  },

  syncTenantSettings: async (): Promise<AuthState> => {
    const { data } = await http.get<{
      groupName?: string | null;
      sportType?: SportType | null;
      logoUrl?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
    }>('/tenant/settings');

    const current = authStore.get();
    const next: AuthState = {
      ...current,
      groupName: data.groupName ?? current.groupName,
      sportType: data.sportType ?? current.sportType,
      logoUrl: data.logoUrl ?? current.logoUrl,
      primaryColor: data.primaryColor ?? current.primaryColor,
      secondaryColor: data.secondaryColor ?? current.secondaryColor,
    };

    authStore.set(next);
    return next;
  },

  // ─── Novo método ───
  syncPlan: async (): Promise<boolean> => {
    try {
      const { data } = await http.get('/checkout/status');
      const current = authStore.get();
      
      // Se o backend diz que não há assinatura ativa, o plano é Free
      const backendPlanName = data.planName || 'Free';
      const backendFeatures = data.features || [];
      
      if (backendPlanName !== (current.planName || 'Free')) {
        authStore.set({ 
          ...current, 
          planName: backendPlanName,
          features: backendFeatures 
        });
        
        window.dispatchEvent(new CustomEvent('plan-changed', { 
          detail: { 
            oldPlan: current.planName, 
            newPlan: backendPlanName 
          } 
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao sincronizar plano:', error);
    }
    return false;
  }
};
