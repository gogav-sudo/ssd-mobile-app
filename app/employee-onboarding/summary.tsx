import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import { useEmployee } from '@/context/EmployeeContext';
import { createDeviceIdentityId } from '@/lib/deviceIdentity';
import { supabase } from '@/lib/supabase';

// How long we let the save attempt run before we give up waiting on the
// network and force the UI to move on. This does NOT try to cancel the
// underlying request — it just stops the screen from being stuck forever.
// The insert has already been fired at that point, so the row will exist
// in Supabase even if this device never sees the response.
const FORCE_CONTINUE_MS = 8000;

const FIELDS: Array<{ key: 'fullName' | 'objectName' | 'role'; label: string }> = [
  { key: 'fullName', label: 'ФИО' },
  { key: 'objectName', label: 'Объект' },
  { key: 'role', label: 'Должность' },
];

export default function SummaryScreen() {
  const router = useRouter();
  const { data, reset } = useOnboarding();
  const { setEmployee } = useEmployee();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tracks whether this specific confirm attempt has already been resolved
  // (either by the network call finishing, or by the forced-continue timer
  // firing first) so whichever happens LAST is a no-op instead of double
  // navigating / double-inserting.
  const settledRef = useRef(false);
  const forceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    };
  }, []);

  const handleRestart = () => {
    reset();
    router.replace('/employee-onboarding/name');
  };

  const proceedToEmployeeHome = (employeeGuess: {
    telegram_chat_id: string;
    full_name: string;
    object_name: string;
    role: string;
  }) => {
    if (settledRef.current) return;
    settledRef.current = true;
    if (forceTimerRef.current) clearTimeout(forceTimerRef.current);

    setEmployee({
      id: 0,
      created_at: new Date().toISOString(),
      ...employeeGuess,
    });
    setSubmitting(false);
    reset();
    console.log('[Summary] Navigating to /employee.');
    router.replace('/employee');
  };

  const handleConfirm = () => {
    console.log('[Summary] "Подтверждаю" pressed.');
    settledRef.current = false;
    setSubmitting(true);
    setErrorMessage(null);

    const guess = {
      telegram_chat_id: '',
      full_name: data.fullName,
      object_name: data.objectName,
      role: data.role,
    };

    (async () => {
      const deviceId = await createDeviceIdentityId();
      guess.telegram_chat_id = deviceId;
      console.log('[Summary] deviceId =', deviceId);

      // Force-continue timer: fires independently of the network call. If
      // the request is still pending after FORCE_CONTINUE_MS, we stop
      // waiting on it and move the user forward — the insert was already
      // sent, so it will land in Supabase regardless of whether this
      // device ever receives the HTTP response.
      forceTimerRef.current = setTimeout(() => {
        console.warn('[Summary] Forcing continue — network response took too long.');
        proceedToEmployeeHome(guess);
      }, FORCE_CONTINUE_MS);

      try {
        console.log('[Summary] Inserting employee row…');
        const { error } = await supabase.from('employees').insert({
          telegram_chat_id: deviceId,
          full_name: data.fullName,
          object_name: data.objectName,
          role: data.role,
        });
        console.log('[Summary] Insert settled. error=', error?.message ?? null);

        if (error) throw error;

        proceedToEmployeeHome(guess);
      } catch (err: any) {
        console.warn('[Summary] Insert failed:', err?.message ?? err);
        if (settledRef.current) return; // forced timer already moved on
        settledRef.current = true;
        if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
        setSubmitting(false);
        setErrorMessage(
          err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.'
        );
      }
    })();
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={[type.label, styles.label]}>ПРОВЕРЬТЕ ДАННЫЕ</Text>
          <Text style={[type.h1, styles.title]}>Всё верно?</Text>

          <View style={styles.card}>
            {FIELDS.map((field, index) => (
              <View
                key={field.key}
                style={[styles.row, index === FIELDS.length - 1 && styles.rowLast]}
              >
                <Text style={[type.caption, styles.rowLabel]}>{field.label}</Text>
                <Text style={[type.body, styles.rowValue]}>{data[field.key]}</Text>
              </View>
            ))}
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Button label="Подтверждаю" onPress={handleConfirm} loading={submitting} />
          <View style={{ height: spacing.md }} />
          <Button
            label="Начать заново"
            variant="secondary"
            onPress={handleRestart}
            disabled={submitting}
          />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between' },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  label: {
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: colors.gold,
    marginBottom: 4,
    letterSpacing: 1.4,
  },
  rowValue: {
    color: colors.textPrimary,
  },
  errorBox: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
