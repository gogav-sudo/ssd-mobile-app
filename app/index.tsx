import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SplashBackground } from '@/components/ui/SplashBackground';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { colors, spacing, type } from '@/theme';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { supabase } from '@/lib/supabase';
import { useEmployee } from '@/context/EmployeeContext';

console.log('[Splash] Module evaluating (app/index.tsx loaded).');

const LOOKUP_TIMEOUT_MS = 8000;

export default function SplashScreen() {
  console.log('[Splash] Component function called (render start).');
  const router = useRouter();
  const { setEmployee } = useEmployee();
  const [checking, setChecking] = useState(true);
  const [entryLoading, setEntryLoading] = useState(false);

  const settledRef = useRef(false);
  const entrySettledRef = useRef(false);
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    console.log('[Splash] useEffect body running.');
    let isMounted = true;
    settledRef.current = false;

    const stopChecking = () => {
      if (settledRef.current) return;
      settledRef.current = true;
      if (isMounted) setChecking(false);
    };

    const forceTimer = setTimeout(() => {
      console.warn('[Splash] Lookup timed out after', LOOKUP_TIMEOUT_MS, 'ms - showing entry buttons.');
      stopChecking();
    }, LOOKUP_TIMEOUT_MS);

    (async () => {
      try {
        console.log('[Splash] Reading device_identity_id from AsyncStorage...');
        const deviceId = await getDeviceIdentityId();
        console.log('[Splash] device_identity_id =', deviceId);

        if (!deviceId) {
          console.log('[Splash] No saved identity - showing entry buttons.');
          clearTimeout(forceTimer);
          stopChecking();
          return;
        }

        console.log('[Splash] Querying employees for telegram_chat_id =', deviceId);
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('telegram_chat_id', deviceId)
          .maybeSingle();
        console.log(
          '[Splash] Query settled. error=',
          error?.message ?? null,
          'data=',
          data ? 'found' : 'none'
        );

        clearTimeout(forceTimer);
        if (settledRef.current || !isMounted) {
          console.log('[Splash] Already settled by timeout, or unmounted - ignoring result.');
          return;
        }

        if (!error && data) {
          console.log('[Splash] Employee found - pre-loading into context.');
          setEmployee(data);
        }
        stopChecking();
      } catch (err: any) {
        console.warn('[Splash] Lookup threw:', err?.message ?? err);
        clearTimeout(forceTimer);
        stopChecking();
      }
    })();

    return () => {
      console.log('[Splash] Unmount / effect cleanup.');
      isMounted = false;
      clearTimeout(forceTimer);
    };
  }, []);

  const handleEmployeeEntry = useCallback(() => {
    console.log('[Splash] "Voyti kak sotrudnik" pressed.');
    entrySettledRef.current = false;
    setEntryLoading(true);

    const goToOnboarding = () => {
      if (entrySettledRef.current) return;
      entrySettledRef.current = true;
      if (entryTimerRef.current) clearTimeout(entryTimerRef.current);
      setEntryLoading(false);
      router.push('/employee-onboarding/name');
    };

    const goToEmployeeHome = (employeeData: any) => {
      if (entrySettledRef.current) return;
      entrySettledRef.current = true;
      if (entryTimerRef.current) clearTimeout(entryTimerRef.current);
      setEntryLoading(false);
      setEmployee(employeeData);
      router.replace('/employee');
    };

    entryTimerRef.current = setTimeout(() => {
      console.warn('[Splash] Entry lookup timed out after', LOOKUP_TIMEOUT_MS, 'ms - going to onboarding as fallback.');
      goToOnboarding();
    }, LOOKUP_TIMEOUT_MS);

    (async () => {
      try {
        const deviceId = await getDeviceIdentityId();
        if (!deviceId) {
          console.log('[Splash] No device id on entry press - going to onboarding.');
          goToOnboarding();
          return;
        }

        console.log('[Splash] Entry lookup: querying employees for telegram_chat_id =', deviceId);
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('telegram_chat_id', deviceId)
          .maybeSingle();
        console.log(
          '[Splash] Entry lookup settled. error=',
          error?.message ?? null,
          'data=',
          data ? 'found' : 'none'
        );

        if (entrySettledRef.current) {
          console.log('[Splash] Entry already settled by timeout - ignoring late result.');
          return;
        }

        if (!error && data) {
          goToEmployeeHome(data);
        } else {
          goToOnboarding();
        }
      } catch (err: any) {
        console.warn('[Splash] Entry lookup threw:', err?.message ?? err);
        goToOnboarding();
      }
    })();
  }, [router, setEmployee]);

  const handleSupervisorEntry = useCallback(() => {
    router.push('/supervisor-pin');
  }, [router]);

  console.log('[Splash] Rendering. checking=', checking, 'entryLoading=', entryLoading);

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
              <Text style={[type.caption, styles.loadingText]}>ПРОВЕРКА ДАННЫХ...</Text>
            </View>
          ) : (
            <>
              <Button
                label="Войти как сотрудник"
                onPress={handleEmployeeEntry}
                loading={entryLoading}
              />
              <View style={{ height: spacing.md }} />
              <Button
                label="Войти как руководитель"
                variant="secondary"
                onPress={handleSupervisorEntry}
                disabled={entryLoading}
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
