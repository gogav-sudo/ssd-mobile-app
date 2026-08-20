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

function lookupEmployeeByDeviceId(deviceId: string) {
  return withTimeout(
    supabase.from('employees').select('*').eq('telegram_chat_id', deviceId).maybeSingle(),
    LOOKUP_TIMEOUT_MS
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const { setEmployee } = useEmployee();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log('[Splash] Mount — starting device identity check.');

    (async () => {
      try {
        console.log('[Splash] Reading device_identity_id from AsyncStorage…');
        const deviceId = await getDeviceIdentityId();
        console.log('[Splash] device_identity_id =', deviceId);

        if (!deviceId) {
          console.log('[Splash] No saved identity — showing entry buttons.');
          if (isMounted) setChecking(false);
          return;
        }

        console.log('[Splash] Querying employees for telegram_chat_id =', deviceId);
        const { data, error } = await lookupEmployeeByDeviceId(deviceId);
        console.log('[Splash] Query settled. error=', error?.message ?? null, 'data=', data ? 'found' : 'none');

        if (!isMounted) {
          console.log('[Splash] Unmounted before query settled — ignoring result.');
          return;
        }

        if (!error && data) {
          console.log('[Splash] Employee found — pre-loading into context.');
          setEmployee(data);
        }
      } catch (err: any) {
        console.warn('[Splash] Lookup failed or timed out:', err?.message ?? err);
        // Timed out or failed — fall through to showing the entry buttons.
      } finally {
        console.log('[Splash] Finished checking. isMounted=', isMounted);
        if (isMounted) setChecking(false);
      }
    })();

    return () => {
      console.log('[Splash] Unmount.');
      isMounted = false;
    };
  }, []);

  const handleEmployeeEntry = useCallback(async () => {
    console.log('[Splash] "Войти как сотрудник" pressed.');
    const deviceId = await getDeviceIdentityId();
    if (!deviceId) {
      router.push('/employee-onboarding/name');
      return;
    }

    try {
      const { data, error } = await lookupEmployeeByDeviceId(deviceId);
      console.log('[Splash] Entry lookup settled. error=', error?.message ?? null, 'data=', data ? 'found' : 'none');

      if (!error && data) {
        setEmployee(data);
        router.replace('/employee');
      } else {
        router.push('/employee-onboarding/name');
      }
    } catch (err: any) {
      console.warn('[Splash] Entry lookup failed or timed out:', err?.message ?? err);
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
