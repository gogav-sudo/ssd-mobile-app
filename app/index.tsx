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

// How long we wait on the "do I already have an account" lookup before we
// give up and just show the entry buttons. This is a plain setTimeout race,
// NOT an AbortController — it does not try to cancel the network request,
// it only stops the SCREEN from waiting on it forever.
const LOOKUP_TIMEOUT_MS = 8000;

export default function SplashScreen() {
  console.log('[Splash] Component function called (render start).');
  const router = useRouter();
  const { setEmployee } = useEmployee();
  const [checking, setChecking] = useState(true);

  // Guards against the timeout AND the real network response both trying
  // to flip `checking` — whichever happens first wins, the second is a no-op.
  const settledRef = useRef(false);

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
      console.warn('[Splash] Lookup timed out after', LOOKUP_TIMEOUT_MS, 'ms — showing entry buttons.');
      stopChecking();
    }, LOOKUP_TIMEOUT_MS);

    (async () => {
      try {
        console.log('[Splash] Reading device_identity_id from AsyncStorage…');
        const deviceId = await getDeviceIdentityId();
        console.log('[Splash] device_identity_id =', deviceId);

        if (!deviceId) {
          console.log('[Splash] No saved identity — showing entry buttons.');
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
          console.log('[Splash] Already settled by timeout, or unmounted — ignoring result.');
          return;
        }

        if (!error && data) {
          console.log('[Splash] Employee found — pre-loading into context.');
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

  const handleEmployeeEntry = useCallback(async () => {
    console.log('[Splash] "Войти как сотрудник" pressed.');
    const deviceId = await getDeviceIdentityId();
    if (!deviceId) {
      router.push('/employee-onboarding/name');
      return;
    }

    try {
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

      if (!error && data) {
        setEmployee(data);
        router.replace('/employee');
      } else {
        router.push('/employee-onboarding/name');
      }
    } catch (err: any) {
      console.warn('[Splash] Entry lookup threw:', err?.message ?? err);
      router.push('/employee-onboarding/name');
    }
  }, [router, setEmployee]);

  const handleSupervisorEntry = useCallback(() => {
    router.push('/supervisor-pin');
  }, [router]);

  console.log('[Splash] Rendering. checking=', checking);

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
