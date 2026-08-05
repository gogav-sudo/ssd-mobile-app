import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenBackground } from './ScreenBackground';
import { colors, spacing, type } from '@/theme';

type OnboardingLayoutProps = {
  step: number;
  totalSteps: number;
  question: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function OnboardingLayout({
  step,
  totalSteps,
  question,
  children,
  footer,
}: OnboardingLayoutProps) {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.progressRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < step ? styles.progressDotActive : styles.progressDotIdle,
                ]}
              />
            ))}
          </View>

          <View style={styles.body}>
            <Text style={[type.label, styles.stepLabel]}>
              ШАГ {step} ИЗ {totalSteps}
            </Text>
            <Text style={[type.h1, styles.question]}>{question}</Text>
            <View style={styles.inputArea}>{children}</View>
          </View>

          <View style={styles.footer}>{footer}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  progressDot: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  progressDotActive: {
    backgroundColor: colors.gold,
  },
  progressDotIdle: {
    backgroundColor: colors.borderSubtle,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  stepLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  question: {
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  inputArea: {
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
