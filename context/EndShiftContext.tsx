import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type EndShiftData = {
  shiftId: number | null;
  equipmentOk: boolean | null;
  notes: string;
};

type EndShiftContextValue = {
  data: EndShiftData;
  setShiftId: (v: number | null) => void;
  setEquipmentOk: (v: boolean) => void;
  setNotes: (v: string) => void;
  reset: () => void;
};

const initial: EndShiftData = {
  shiftId: null,
  equipmentOk: null,
  notes: '',
};

const EndShiftContext = createContext<EndShiftContextValue | undefined>(undefined);

export function EndShiftProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<EndShiftData>(initial);

  const setShiftId = useCallback((v: number | null) => setData((d) => ({ ...d, shiftId: v })), []);
  const setEquipmentOk = useCallback((v: boolean) => setData((d) => ({ ...d, equipmentOk: v })), []);
  const setNotes = useCallback((v: string) => setData((d) => ({ ...d, notes: v })), []);
  const reset = useCallback(() => setData(initial), []);

  const value = useMemo(
    () => ({ data, setShiftId, setEquipmentOk, setNotes, reset }),
    [data, setShiftId, setEquipmentOk, setNotes, reset]
  );

  return <EndShiftContext.Provider value={value}>{children}</EndShiftContext.Provider>;
}

export function useEndShift() {
  const ctx = useContext(EndShiftContext);
  if (!ctx) throw new Error('useEndShift must be used within EndShiftProvider');
  return ctx;
}
