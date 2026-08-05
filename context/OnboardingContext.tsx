import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type OnboardingData = {
  fullName: string;
  objectName: string;
  role: string;
};

type OnboardingContextValue = {
  data: OnboardingData;
  setFullName: (v: string) => void;
  setObjectName: (v: string) => void;
  setRole: (v: string) => void;
  reset: () => void;
};

const initial: OnboardingData = { fullName: '', objectName: '', role: '' };

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initial);

  const setFullName = useCallback((v: string) => setData((d) => ({ ...d, fullName: v })), []);
  const setObjectName = useCallback((v: string) => setData((d) => ({ ...d, objectName: v })), []);
  const setRole = useCallback((v: string) => setData((d) => ({ ...d, role: v })), []);
  const reset = useCallback(() => setData(initial), []);

  const value = useMemo(
    () => ({ data, setFullName, setObjectName, setRole, reset }),
    [data, setFullName, setObjectName, setRole, reset]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
