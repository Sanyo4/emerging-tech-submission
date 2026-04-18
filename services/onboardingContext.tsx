import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface OnboardingData {
  petName: string;
  userName: string;
  inputPreference: 'voice' | 'text';
  motivationFocuses: string[];
  monthlyIncome: number;
  fixedExpenses: { name: string; amount: number }[];
  flexibleSpending: number;
  financialPersona: 'beginner' | 'learner' | 'pro';
  selectedPlanId: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

const DEFAULT_DATA: OnboardingData = {
  petName: 'Buddy',
  userName: '',
  inputPreference: 'voice',
  motivationFocuses: [],
  monthlyIncome: 0,
  fixedExpenses: [],
  flexibleSpending: 0,
  financialPersona: 'beginner',
  selectedPlanId: '',
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({ ...DEFAULT_DATA });

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setData({ ...DEFAULT_DATA });
  }, []);

  return (
    <OnboardingContext.Provider value={{ data, updateData, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
}
