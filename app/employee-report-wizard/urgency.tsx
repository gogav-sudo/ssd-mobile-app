import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { useReportProblem, Urgency } from '@/context/ReportProblemContext';
import { colors, radius, spacing, type } from '@/theme';

const URGENCY_OPTIONS: { label: Urgency; color: string; mutedColor: string }[] = [
  { label: 'Низкая', color: colors.success, mutedColor: colors.successMuted },
  { label: 'Средняя', color: colors.warning, mutedColor: colors.warningMuted },
  { label: 'Высокая', color: colors.error, mutedColor: colors.errorMuted },
];

export default function ReportUrgencyScreen() {
  const router = useRouter();
  const { setUrgency } = useReportProblem();

  const handleSelect = (value: Urgency) => {
    setUrgency(value);
    router.push('/employee-report-wizard/submitting');
  };

  return (
    <WizardLayout
      step={4}
      totalSteps={5}
      eyebrow="СООБЩИТЬ О ПРОБЛЕМЕ"
      question="Насколько это срочно?"
      footer={<View />}
      onClose={() => router.replace('/employee')}
      onBack={() => router.back()}
    >
      <View style={styles.list}>
        {URGENCY_OPTIONS.map(({ label, color, mutedColor }) => (
          <Pressable
            key={label}
            style={({ pressed }) => [
              styles.optionCard,
              { borderColor: color },
              pressed && styles.optionCardPressed,
            ]}
            onPress={() => handleSelect(label)}
          >
            <View style={[styles.stripe, { backgroundColor: color }]} />
            <Text style={[type.body, styles.optionLabel]}>{label}</Text>
            <View style={[styles.badge, { backgroundColor: mutedColor }]}>
              <View style={[styles.dot, { backgroundColor: color }]} />
            </View>
          </Pressable>
        ))}
      </View>
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  optionCardPressed: {
    opacity: 0.75,
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: spacing.md,
  },
  optionLabel: {
    flex: 1,
    color: colors.textPrimary,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
