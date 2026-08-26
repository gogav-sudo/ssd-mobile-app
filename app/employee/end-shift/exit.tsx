import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarX } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, spacing, type } from '@/theme';

const MESSAGES: Record<string, string> = {
  none: 'Открытой смены за сегодня нет.',
};

export default function EndShiftExitScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const title = MESSAGES[reason ?? ''] ?? MESSAGES.none;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          <View style={styles.center}>
            <View style={styles.iconWrap}>
              <CalendarX size={26} color={colors.gold} strokeWidth={1.6} />
            </View>
            <Text style={[type.h2, styles.title]}>{title}</Text>
          </View>

          <View style={styles.footer}>
            <Button label="Вернуться на главную" onPress={() => router.replace('/employee')} />
          </View>
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
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
