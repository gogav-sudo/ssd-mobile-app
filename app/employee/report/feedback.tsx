import React, { useState } from 'react';
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

export default function ReportFeedbackScreen() {
  const router = useRouter();
  const { employee } = useEmployee();
  const { feedbackType } = useLocalSearchParams<{ feedbackType: FeedbackType }>();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const question = QUESTIONS[feedbackType] ?? QUESTIONS.blocker;

  const handleSubmit = async () => {
    const text = value.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);
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

      router.replace('/employee/report/success');
    } catch (err: any) {
      setErrorMessage(
        err?.message ?? 'Не удалось отправить ответ. Проверьте подключение и попробуйте снова.'
      );
    } finally {
      setSubmitting(false);
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
