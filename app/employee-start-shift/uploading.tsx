import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { useStartShift } from '@/context/StartShiftContext';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { ensureOpenShift } from '@/lib/shifts';

// This screen no longer uploads the photo itself — that already happened
// (and was confirmed) on the photo step. It only creates/confirms the shift
// row, via `ensureOpenShift`, which is idempotent: a retry never inserts a
// second row, it only re-confirms whatever shiftId this attempt already has
// (see StartShiftContext.shiftId) or checks for an existing open shift
// before creating one. On timeout we surface an explicit error and let the
// person retry, instead of silently continuing or guessing forward.
const CREATE_SHIFT_TIMEOUT_MS = 60000;

export default function UploadingScreen() {
  const router = useRouter();
  const { data, setShiftId } = useStartShift();
  const { employee } = useEmployee();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startedRef = useRef(false);

  // Same idea as app/employee-onboarding/summary.tsx: tracks whether this
  // attempt has already been resolved (by the request finishing, or by the
  // force timer firing first) so whichever happens LAST is a no-op.
  const settledRef = useRef(false);
  const forceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, []);

  useEffect(() => {
    return () => {
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    };
  }, []);

  const run = async () => {
    if (busy) return; // guard against parallel/double-tap invocations of "Повторить"
    setBusy(true);
    setErrorMessage(null);
    settledRef.current = false;

    if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    forceTimerRef.current = setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      setBusy(false);
      console.warn('[Uploading] Timed out after', CREATE_SHIFT_TIMEOUT_MS, 'ms - showing error.');
      setErrorMessage(
        'Открытие смены занимает больше времени, чем ожидалось. Проверьте подключение и попробуйте снова.'
      );
    }, CREATE_SHIFT_TIMEOUT_MS);

    try {
      if (data.photoUploadState !== 'uploaded' || !data.photoObjectPath || !data.photoPublicUrl) {
        throw new Error(
          'Фото ещё не загружено. Вернитесь на предыдущий шаг и дождитесь завершения загрузки.'
        );
      }
      if (!employee) throw new Error('Недостаточно данных для начала смены.');

      const deviceId = await getDeviceIdentityId();
      if (!deviceId) throw new Error('Не удалось определить устройство.');

      const result = await ensureOpenShift({
        deviceId,
        fullName: employee.full_name,
        objectName: employee.object_name,
        photoPublicUrl: data.photoPublicUrl,
        existingShiftId: data.shiftId,
      });

      if (settledRef.current) {
        return; // force timer already fired
      }
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);

      if (!result.ok) {
        // Remember any id we now know about so a later retry only confirms
        // it instead of inserting a second row.
        if (result.shiftId) setShiftId(result.shiftId);
        setBusy(false);
        setErrorMessage(result.message);
        return;
      }

      setShiftId(result.shiftId);
      setBusy(false);
      router.replace('/employee-start-shift/uniform-check');
    } catch (err: any) {
      if (settledRef.current) return; // force timer already fired
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
      setBusy(false);
      setErrorMessage(
        err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.'
      );
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          <View style={styles.center}>
            {errorMessage ? (
              <>
                <View style={styles.iconWrap}>
                  <AlertTriangle size={26} color={colors.error} strokeWidth={1.6} />
                </View>
                <Text style={[type.h2, styles.title]}>Ошибка</Text>
                <Text style={[type.bodySmall, styles.message]}>{errorMessage}</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={[type.bodySmall, styles.loadingText]}>
                  Открываем смену…
                </Text>
              </>
            )}
          </View>

          {errorMessage ? (
            <View style={styles.footer}>
              <Button label="Повторить" onPress={run} loading={busy} disabled={busy} />
              <View style={{ height: spacing.md }} />
              <Button
                label="Вернуться на главную"
                variant="secondary"
                onPress={() => router.replace('/employee')}
                disabled={busy}
              />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
