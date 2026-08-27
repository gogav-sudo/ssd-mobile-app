import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, spacing, type } from '@/theme';
import { useEndShift } from '@/context/EndShiftContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { getTodayOpenShift } from '@/lib/shifts';

// 'unknown' means the check itself failed (network/timeout) — it must never
// be presented as "no open shift", since one could still exist server-side.
type CheckStatus = 'checking' | 'unknown';

// getTodayOpenShift goes through the ssd-api.ru proxy, which has confirmed
// occasional latency well above the shared 8s DEFAULT_QUERY_TIMEOUT_MS — give
// this specific status check more room before falling back to 'unknown'.
const STATUS_CHECK_TIMEOUT_MS = 20_000;

export default function EndShiftEntryScreen() {
  const router = useRouter();
  const { setShiftId } = useEndShift();
  const [status, setStatus] = useState<CheckStatus>('checking');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, []);

  const run = async () => {
    setStatus('checking');
    try {
      const deviceId = await getDeviceIdentityId();
      if (!deviceId) {
        setStatus('unknown');
        return;
      }

      const result = await getTodayOpenShift(deviceId, STATUS_CHECK_TIMEOUT_MS);

      if (result.status === 'open') {
        setShiftId(result.shift.id);
        router.replace('/employee-end-shift/equipment-check');
        return;
      }
      if (result.status === 'none') {
        router.replace('/employee-end-shift/exit?reason=none');
        return;
      }
      setStatus('unknown');
    } catch {
      setStatus('unknown');
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {status === 'unknown' ? (
            <>
              <Text style={[type.bodySmall, styles.errorText]}>
                Не удалось проверить статус смены. Проверьте подключение.
              </Text>
              <View style={{ height: spacing.lg }} />
              <Button label="Повторить" onPress={run} />
            </>
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
