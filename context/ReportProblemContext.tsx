import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Urgency = 'Низкая' | 'Средняя' | 'Высокая';

type ReportProblemData = {
  incidentType: string | null;
  description: string;
  wantsPhoto: boolean | null;
  photoUri: string | null;
  urgency: Urgency | null;
};

type ReportProblemContextValue = {
  data: ReportProblemData;
  setIncidentType: (v: string) => void;
  setDescription: (v: string) => void;
  setWantsPhoto: (v: boolean) => void;
  setPhotoUri: (v: string | null) => void;
  setUrgency: (v: Urgency) => void;
  reset: () => void;
};

const initial: ReportProblemData = {
  incidentType: null,
  description: '',
  wantsPhoto: null,
  photoUri: null,
  urgency: null,
};

const ReportProblemContext = createContext<ReportProblemContextValue | undefined>(undefined);

export function ReportProblemProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ReportProblemData>(initial);

  const setIncidentType = useCallback(
    (v: string) => setData((d) => ({ ...d, incidentType: v })),
    []
  );
  const setDescription = useCallback(
    (v: string) => setData((d) => ({ ...d, description: v })),
    []
  );
  const setWantsPhoto = useCallback(
    (v: boolean) => setData((d) => ({ ...d, wantsPhoto: v })),
    []
  );
  const setPhotoUri = useCallback((v: string | null) => setData((d) => ({ ...d, photoUri: v })), []);
  const setUrgency = useCallback((v: Urgency) => setData((d) => ({ ...d, urgency: v })), []);
  const reset = useCallback(() => setData(initial), []);

  const value = useMemo(
    () => ({
      data,
      setIncidentType,
      setDescription,
      setWantsPhoto,
      setPhotoUri,
      setUrgency,
      reset,
    }),
    [data, setIncidentType, setDescription, setWantsPhoto, setPhotoUri, setUrgency, reset]
  );

  return <ReportProblemContext.Provider value={value}>{children}</ReportProblemContext.Provider>;
}

export function useReportProblem() {
  const ctx = useContext(ReportProblemContext);
  if (!ctx) throw new Error('useReportProblem must be used within ReportProblemProvider');
  return ctx;
}
