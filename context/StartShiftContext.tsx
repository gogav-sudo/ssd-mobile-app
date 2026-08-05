import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type StartShiftData = {
  photoUri: string | null;
  shiftId: number | null;
  uniformOk: boolean | null;
  equipmentOk: boolean | null;
  notes: string;
};

type StartShiftContextValue = {
  data: StartShiftData;
  setPhotoUri: (v: string | null) => void;
  setShiftId: (v: number | null) => void;
  setUniformOk: (v: boolean) => void;
  setEquipmentOk: (v: boolean) => void;
  setNotes: (v: string) => void;
  reset: () => void;
};

const initial: StartShiftData = {
  photoUri: null,
  shiftId: null,
  uniformOk: null,
  equipmentOk: null,
  notes: '',
};

const StartShiftContext = createContext<StartShiftContextValue | undefined>(undefined);

export function StartShiftProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StartShiftData>(initial);

  const setPhotoUri = useCallback((v: string | null) => setData((d) => ({ ...d, photoUri: v })), []);
  const setShiftId = useCallback((v: number | null) => setData((d) => ({ ...d, shiftId: v })), []);
  const setUniformOk = useCallback((v: boolean) => setData((d) => ({ ...d, uniformOk: v })), []);
  const setEquipmentOk = useCallback((v: boolean) => setData((d) => ({ ...d, equipmentOk: v })), []);
  const setNotes = useCallback((v: string) => setData((d) => ({ ...d, notes: v })), []);
  const reset = useCallback(() => setData(initial), []);

  const value = useMemo(
    () => ({ data, setPhotoUri, setShiftId, setUniformOk, setEquipmentOk, setNotes, reset }),
    [data, setPhotoUri, setShiftId, setUniformOk, setEquipmentOk, setNotes, reset]
  );

  return <StartShiftContext.Provider value={value}>{children}</StartShiftContext.Provider>;
}

export function useStartShift() {
  const ctx = useContext(StartShiftContext);
  if (!ctx) throw new Error('useStartShift must be used within StartShiftProvider');
  return ctx;
}
