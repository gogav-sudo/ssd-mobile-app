import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Tracks the *server-confirmed* state of the start-of-shift photo, separate
// from `photoUri` (which is just the local preview). 'uploaded' is only ever
// set together with a real objectPath/publicUrl returned by Supabase Storage
// — a local preview alone must never be treated as a successful upload.
export type PhotoUploadState = 'idle' | 'uploading' | 'uploaded' | 'error';

type StartShiftData = {
  photoUri: string | null;
  photoUploadState: PhotoUploadState;
  photoObjectPath: string | null;
  photoPublicUrl: string | null;
  shiftId: number | null;
  uniformOk: boolean | null;
  equipmentOk: boolean | null;
  notes: string;
};

type StartShiftContextValue = {
  data: StartShiftData;
  setPhotoUri: (v: string | null) => void;
  setPhotoUploadState: (v: PhotoUploadState) => void;
  setPhotoUpload: (objectPath: string, publicUrl: string) => void;
  setShiftId: (v: number | null) => void;
  setUniformOk: (v: boolean) => void;
  setEquipmentOk: (v: boolean) => void;
  setNotes: (v: string) => void;
  reset: () => void;
};

const initial: StartShiftData = {
  photoUri: null,
  photoUploadState: 'idle',
  photoObjectPath: null,
  photoPublicUrl: null,
  shiftId: null,
  uniformOk: null,
  equipmentOk: null,
  notes: '',
};

const StartShiftContext = createContext<StartShiftContextValue | undefined>(undefined);

export function StartShiftProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StartShiftData>(initial);

  // Every call means "this is a new/changed candidate photo, not yet
  // uploaded" — so it always clears any previous upload confirmation too,
  // even when re-set to the same uri, to avoid a stale 'uploaded' state
  // surviving a retake.
  const setPhotoUri = useCallback(
    (v: string | null) =>
      setData((d) => ({
        ...d,
        photoUri: v,
        photoUploadState: 'idle',
        photoObjectPath: null,
        photoPublicUrl: null,
      })),
    []
  );
  const setPhotoUploadState = useCallback(
    (v: PhotoUploadState) => setData((d) => ({ ...d, photoUploadState: v })),
    []
  );
  // Sets objectPath/publicUrl and 'uploaded' atomically so there is never a
  // moment where the state says "uploaded" without a confirmed path.
  const setPhotoUpload = useCallback(
    (objectPath: string, publicUrl: string) =>
      setData((d) => ({
        ...d,
        photoUploadState: 'uploaded',
        photoObjectPath: objectPath,
        photoPublicUrl: publicUrl,
      })),
    []
  );
  const setShiftId = useCallback((v: number | null) => setData((d) => ({ ...d, shiftId: v })), []);
  const setUniformOk = useCallback((v: boolean) => setData((d) => ({ ...d, uniformOk: v })), []);
  const setEquipmentOk = useCallback((v: boolean) => setData((d) => ({ ...d, equipmentOk: v })), []);
  const setNotes = useCallback((v: string) => setData((d) => ({ ...d, notes: v })), []);
  const reset = useCallback(() => setData(initial), []);

  const value = useMemo(
    () => ({
      data,
      setPhotoUri,
      setPhotoUploadState,
      setPhotoUpload,
      setShiftId,
      setUniformOk,
      setEquipmentOk,
      setNotes,
      reset,
    }),
    [
      data,
      setPhotoUri,
      setPhotoUploadState,
      setPhotoUpload,
      setShiftId,
      setUniformOk,
      setEquipmentOk,
      setNotes,
      reset,
    ]
  );

  return <StartShiftContext.Provider value={value}>{children}</StartShiftContext.Provider>;
}

export function useStartShift() {
  const ctx = useContext(StartShiftContext);
  if (!ctx) throw new Error('useStartShift must be used within StartShiftProvider');
  return ctx;
}
