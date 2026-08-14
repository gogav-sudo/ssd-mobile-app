import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, HelpCircle, Lightbulb, ShieldQuestion } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { useReportProblem } from '@/context/ReportProblemContext';
import type { FeedbackType } from '@/lib/employeeFeedback';

const FEEDBACK_OPTIONS: {
  label: string;
  icon: typeof ShieldQuestion;
  feedbackType: FeedbackType;
}[] = [
  {
    label: 'Что мешало вам работать безупречно сегодня?',
    icon: ShieldQuestion,
    feedbackType: 'blocker',
  },
  {
    label: 'Что нужно улучшить в процессе работы (даже мелочь)?',
    icon: Lightbulb,
    feedbackType: 'improvement',
  },
];

export default function ReportEntryScreen() {
  const router = useRouter();
  const { setIncidentType, reset } = useReportProblem();

  // Always start fresh on this screen — clears any leftover answers from a
  // previously submitted (or abandoned) report whenever the tab is opened.
  useFocusEffect(
    useCallback(() => {
      reset();
    }, [reset])
  );

  const handleSelectFeedback = (feedbackType: FeedbackType) => {
    router.push({ pathname: '/employee/report/feedback', params: { feedbackType } });
  };

  const handleSelectOther = () => {
    setIncidentType('Другое');
    router.push('/employee/report/description');
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={[type.label, styles.headerLabel]}>СООБЩИТЬ О ПРОБЛЕМЕ</Text>
          <Text style={[type.h1, styles.headerTitle]}>Что произошло?</Text>
        </View>

        <View style={styles.list}>
          {FEEDBACK_OPTIONS.map(({ label, icon: Icon, feedbackType }) => (
            <Pressable
              key={feedbackType}
              style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
              onPress={() => handleSelectFeedback(feedbackType)}
            >
              <View style={styles.optionIcon}>
                <Icon size={18} color={colors.gold} strokeWidth={1.6} />
              </View>
              <Text style={[type.body, styles.optionLabel]}>{label}</Text>
              <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
            onPress={handleSelectOther}
          >
            <View style={styles.optionIcon}>
              <HelpCircle size={18} color={colors.gold} strokeWidth={1.6} />
            </View>
            <Text style={[type.body, styles.optionLabel]}>Другое</Text>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionCardPressed: {
    opacity: 0.75,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldMuted,
  },
  optionLabel: {
    flex: 1,
    color: colors.textPrimary,
  },
});
