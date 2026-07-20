import { useEffect, useMemo, useState } from 'react';
import { authStore } from '../auth/store';
import { applyTenantCssVariables, createTenantTheme } from '../theme';

export function useTenantTheme() {
  const [colors, setColors] = useState(() => {
    const auth = authStore.get();
    return {
      primaryColor: auth.primaryColor,
      secondaryColor: auth.secondaryColor,
    };
  });

  useEffect(() => {
    const refresh = () => {
      const auth = authStore.get();
      setColors({
        primaryColor: auth.primaryColor,
        secondaryColor: auth.secondaryColor,
      });
    };

    window.addEventListener('auth-changed', refresh);
    return () => window.removeEventListener('auth-changed', refresh);
  }, []);

  useEffect(() => {
    applyTenantCssVariables(colors.primaryColor, colors.secondaryColor);
  }, [colors]);

  return useMemo(
    () => createTenantTheme(colors.primaryColor, colors.secondaryColor),
    [colors],
  );
}
