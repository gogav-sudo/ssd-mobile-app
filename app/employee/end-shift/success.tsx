import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, spacing, type } from '@/theme';
import { useEndShift } from '@/context/EndShiftContext';

export default function EndShiftSuccessScreen() {
  const router = useRouter();
  const { reset } = useEndShift();

  useEffect(() => {
    return () => reset();
  }, []);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <CheckCircle2 size={30} color={colors.gold} strokeWidth={1.5} />
          </View>
          <Text style={[type.h1, styles.title]}>Смена завершена</Text>
          <Text style={[type.bodySmall, styles.subtitle]}>Хорошего дня.</Text>
        </View>

        <View style={styles.footer}>
          <Button label="Вернуться на главную" onPress={() => router.replace('/employee')} />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
