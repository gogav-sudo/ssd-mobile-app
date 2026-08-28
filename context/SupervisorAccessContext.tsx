import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// In-memory-only gate for the supervisor UI (app/supervisor/**). Deliberately
// holds no PIN value and nothing here is persisted — no AsyncStorage,
// SecureStore, localStorage, sessionStorage, or cookies. A full page reload
// (or a new tab) always starts with `supervisorAccessGranted: false`, so the
// PIN must be re-entered every time. This is a UI-only convenience gate, not
// a substitute for server-side Auth/RLS: it prevents casual navigation and
// direct-URL access to the supervisor screens within this app, but anyone
// with the Supabase URL/anon key can still reach the underlying data
// directly, outside this app entirely.
type SupervisorAccessContextValue = {
  supervisorAccessGranted: boolean;
  grantSupervisorAccess: () => void;
  revokeSupervisorAccess: () => void;
};

const SupervisorAccessContext = createContext<SupervisorAccessContextValue | undefined>(undefined);

export function SupervisorAccessProvider({ children }: { children: React.ReactNode }) {
  const [supervisorAccessGranted, setSupervisorAccessGranted] = useState(false);

  const grantSupervisorAccess = useCallback(() => {
    setSupervisorAccessGranted(true);
  }, []);

  const revokeSupervisorAccess = useCallback(() => {
    setSupervisorAccessGranted(false);
  }, []);

  const value = useMemo(
    () => ({ supervisorAccessGranted, grantSupervisorAccess, revokeSupervisorAccess }),
    [supervisorAccessGranted, grantSupervisorAccess, revokeSupervisorAccess]
  );

  return (
    <SupervisorAccessContext.Provider value={value}>{children}</SupervisorAccessContext.Provider>
  );
}

export function useSupervisorAccess() {
  const ctx = useContext(SupervisorAccessContext);
  if (!ctx) throw new Error('useSupervisorAccess must be used within SupervisorAccessProvider');
  return ctx;
}
