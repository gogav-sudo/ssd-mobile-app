import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Employee } from '@/lib/supabase';

console.log('[EmployeeContext] Module evaluating.');

type EmployeeContextValue = {
  employee: Employee | null;
  setEmployee: (employee: Employee | null) => void;
};

const EmployeeContext = createContext<EmployeeContextValue | undefined>(undefined);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  console.log('[EmployeeContext] EmployeeProvider render start.');
  const [employee, setEmployeeState] = useState<Employee | null>(null);

  const setEmployee = useCallback((next: Employee | null) => {
    setEmployeeState(next);
  }, []);

  const value = useMemo(() => ({ employee, setEmployee }), [employee, setEmployee]);

  console.log('[EmployeeContext] EmployeeProvider about to render children.');
  return <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>;
}

export function useEmployee() {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployee must be used within EmployeeProvider');
  return ctx;
}
