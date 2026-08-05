import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, spacing, type } from '@/theme';
import { useEndShift } from '@/context/EndShiftContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { getTodayOpenShift } from '@/lib/shifts';

export default function EndShiftEntryScreen() {
  const router = useRouter();
  const { setShiftId } = useEndShift();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, []);

  const run = async () => {
    setErrorMessage(null);
    try {
      const deviceId = await getDeviceIdentityId();
      if (!deviceId) {
        router.replace('/employee/end-shift/exit?reason=none');
        return;
      }

      const openShift = await getTodayOpenShift(deviceId);

      if (!openShift) {
        router.replace('/employee/end-shift/exit?reason=none');
        return;
      }

      setShiftId(openShift.id);
      router.replace('/employee/end-shift/equipment-check');
    } catch (err: any) {
      setErrorMessage(
        err?.message ?? 'Не удалось проверить статус смены. Попробуйте снова.'
      );
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {errorMessage ? (
            <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={[type.bodySmall, styles.loadingText]}>Проверяем текущую смену…</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});
