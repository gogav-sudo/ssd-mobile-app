import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { ScreenBackground } from './ScreenBackground';
import { colors, spacing, type } from '@/theme';

type WizardLayoutProps = {
  step?: number;
  totalSteps?: number;
  eyebrow?: string;
  question: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  onClose?: () => void;
  onBack?: () => void;
};

export function WizardLayout({
  step,
  totalSteps,
  eyebrow,
  question,
  children,
  footer,
  onClose,
  onBack,
}: WizardLayoutProps) {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topRow}>
            {onBack ? (
              <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
                <ArrowLeft size={18} color={colors.textSecondary} strokeWidth={1.8} />
              </Pressable>
            ) : null}
            {totalSteps ? (
              <View style={styles.progressRow}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      step && i < step ? styles.progressDotActive : styles.progressDotIdle,
                    ]}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.progressRow} />
            )}
            {onClose ? (
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
                <X size={18} color={colors.textTertiary} strokeWidth={1.6} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.body}>
              {eyebrow ? <Text style={[type.label, styles.eyebrow]}>{eyebrow}</Text> : null}
              <Text style={[type.h1, styles.question]}>{question}</Text>
              {children ? <View style={styles.inputArea}>{children}</View> : null}
            </View>

            <View style={styles.footer}>{footer}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginRight: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  eyebrow: {
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
