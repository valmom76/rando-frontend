import { useEffect, useState } from 'react';
import { authStore } from '../auth/store';

export function usePlanChanged() {
  const [planName, setPlanName] = useState(
    authStore.get().planName || 'Free'
  );

  useEffect(() => {
    const handlePlanChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newPlan = customEvent.detail?.newPlan;
      if (newPlan) {
        setPlanName(newPlan);
      }
    };

    window.addEventListener('plan-changed', handlePlanChange);
    return () => window.removeEventListener('plan-changed', handlePlanChange);
  }, []);

  return planName;
}