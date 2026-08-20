import React, { useState } from 'react';
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
import { withTimeout } from '@/lib/withTimeout';

const SAVE_TIMEOUT_MS = 12000;

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

  const handleRestart = () => {
    reset();
    router.replace('/employee-onboarding/name');
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const deviceId = await createDeviceIdentityId();

      const payload = {
        telegram_chat_id: deviceId,
        full_name: data.fullName,
        object_name: data.objectName,
        role: data.role,
      };

      const { error } = await withTimeout(
        supabase.from('employees').insert(payload),
        SAVE_TIMEOUT_MS
      );

      if (error) throw error;

      // Re-fetch by telegram_chat_id instead of chaining .select().single()
      // onto the insert — the combined insert+representation response can
      // stall on some network paths (e.g. tunnelled dev previews) even
      // though the insert itself already succeeded server-side.
      const { data: inserted, error: fetchError } = await withTimeout(
        supabase
          .from('employees')
          .select('*')
          .eq('telegram_chat_id', deviceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        SAVE_TIMEOUT_MS
      );

      if (fetchError) throw fetchError;

      setEmployee(
        inserted ?? {
          id: 0,
          created_at: new Date().toISOString(),
          telegram_chat_id: deviceId,
          full_name: data.fullName,
          object_name: data.objectName,
          role: data.role,
        }
      );
      reset();
      router.replace('/employee');
    } catch (err: any) {
      setErrorMessage(
        err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.'
      );
    } finally {
      setSubmitting(false);
    }
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
