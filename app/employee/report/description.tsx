import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { Button } from '@/components/ui/Button';
import { useReportProblem } from '@/context/ReportProblemContext';
import { colors, radius, spacing } from '@/theme';

export default function ReportDescriptionScreen() {
  const router = useRouter();
  const { data, setDescription } = useReportProblem();
  const [value, setValue] = useState(data.description);

  const handleContinue = () => {
    setDescription(value.trim());
    router.push('/employee/report/photo-choice');
  };

  return (
    <WizardLayout
      step={2}
      totalSteps={5}
      eyebrow="СООБЩИТЬ О ПРОБЛЕМЕ"
      question="Кратко опишите, что произошло"
      footer={<Button label="Продолжить" onPress={handleContinue} disabled={!value.trim()} />}
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
});
