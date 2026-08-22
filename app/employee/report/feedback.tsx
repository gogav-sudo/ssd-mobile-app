import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { Button } from '@/components/ui/Button';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { createEmployeeFeedback } from '@/lib/employeeFeedback';
import type { FeedbackType } from '@/lib/employeeFeedback';
import { colors, radius, spacing, type } from '@/theme';

const QUESTIONS: Record<FeedbackType, string> = {
  blocker: 'Что мешало вам работать безупречно сегодня?',
  improvement: 'Что нужно улучшить в процессе работы (даже мелочь)?',
};

// Same idea as app/employee/start-shift/uploading.tsx: this is a WRITE, so on
// timeout we surface an explicit error and let the person retry rather than
// silently continuing — we don't know whether the insert actually landed.
const SUBMIT_TIMEOUT_MS = 8000;

export default function ReportFeedbackScreen() {
  const router = useRouter();
  const { employee } = useEmployee();
  const { feedbackType } = useLocalSearchParams<{ feedbackType: FeedbackType }>();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tracks whether this attempt has already been resolved (by the request
  // finishing, or by the force timer firing first) so whichever happens LAST
  // is a no-op.
  const settledRef = useRef(false);
  const forceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    };
  }, []);

  const question = QUESTIONS[feedbackType] ?? QUESTIONS.blocker;

  const handleSubmit = async () => {
    const text = value.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);
    settledRef.current = false;

    if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    forceTimerRef.current = setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      setSubmitting(false);
      setErrorMessage(
        'Отправка занимает больше времени, чем ожидалось. Проверьте подключение и попробуйте снова.'
      );
    }, SUBMIT_TIMEOUT_MS);

    try {
      if (!employee) throw new Error('Не удалось определить сотрудника.');
      const deviceId = await getDeviceIdentityId();
      if (!deviceId) throw new Error('Не удалось определить устройство.');

      await createEmployeeFeedback({
        telegramChatId: deviceId,
        fullName: employee.full_name,
        objectName: employee.object_name,
        feedbackType: feedbackType ?? 'blocker',
        feedbackText: text,
      });

      if (settledRef.current) return; // force timer already showed the error
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);

      setSubmitting(false);
      router.replace('/employee/report/success');
    } catch (err: any) {
      if (settledRef.current) return; // force timer already fired
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
      setSubmitting(false);
      setErrorMessage(
        err?.message ?? 'Не удалось отправить ответ. Проверьте подключение и попробуйте снова.'
      );
    }
  };

  return (
    <WizardLayout
      eyebrow="СООБЩИТЬ О ПРОБЛЕМЕ"
      question={question}
      footer={
        <Button
          label="Отправить"
          onPress={handleSubmit}
          disabled={!value.trim()}
          loading={submitting}
        />
      }
      onClose={() => router.replace('/employee')}
      onBack={() => router.back()}
    >
      <TextInput
        style={styles.textArea}
        placeholder="Опишите ситуацию как можно точнее"
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={setValue}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        selectionColor={colors.gold}
        autoFocus
      />
      {errorMessage ? <Text style={[type.caption, styles.errorText]}>{errorMessage}</Text> : null}
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing.md,
    minHeight: 160,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.md,
  },
});
