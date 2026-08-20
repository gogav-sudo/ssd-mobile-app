import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SplashBackground } from '@/components/ui/SplashBackground';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { colors, spacing, type } from '@/theme';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { useEmployee } from '@/context/EmployeeContext';

// Looking up a saved device identity should never leave the user stuck on
// the splash screen — if Supabase doesn't answer in time, fall back to
// showing the entry buttons instead of spinning forever.
const LOOKUP_TIMEOUT_MS = 8000;

export default function SplashScreen() {
  const router = useRouter();
  const { setEmployee } = useEmployee();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const deviceId = await getDeviceIdentityId();
        if (!deviceId) {
          if (isMounted) setChecking(false);
          return;
        }

        const { data, error } = await withTimeout(
          supabase.from('employees').select('*').eq('telegram_chat_id', deviceId).maybeSingle(),
          LOOKUP_TIMEOUT_MS
        );

        if (!isMounted) return;

        if (!error && data) {
          setEmployee(data);
        }
      } catch {
        // Timed out or failed — fall through to showing the entry buttons.
      } finally {
        if (isMounted) setChecking(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmployeeEntry = useCallback(async () => {
    const deviceId = await getDeviceIdentityId();
    if (!deviceId) {
      router.push('/employee-onboarding/name');
      return;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from('employees').select('*').eq('telegram_chat_id', deviceId).maybeSingle(),
        LOOKUP_TIMEOUT_MS
      );

      if (!error && data) {
        setEmployee(data);
        router.replace('/employee');
      } else {
        router.push('/employee-onboarding/name');
      }
    } catch {
      router.push('/employee-onboarding/name');
    }
  }, [router, setEmployee]);

  const handleSupervisorEntry = useCallback(() => {
    router.push('/supervisor-pin');
  }, [router]);

  return (
    <SplashBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Logo size={112} />
        </View>

        <View style={styles.footer}>
          {checking ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.gold} />
              <Text style={[type.caption, styles.loadingText]}>ПРОВЕРКА ДАННЫХ…</Text>
            </View>
          ) : (
            <>
              <Button label="Войти как сотрудник" onPress={handleEmployeeEntry} />
              <View style={{ height: spacing.md }} />
              <Button
                label="Войти как руководитель"
                variant="secondary"
                onPress={handleSupervisorEntry}
              />
            </>
          )}
          <Text style={[type.caption, styles.version]}>ВНУТРЕННЯЯ СИСТЕМА · v1.0</Text>
        </View>
      </SafeAreaView>
    </SplashBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  version: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.lg,
  },
});
