import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  const { employee, setEmployee } = useEmployee();
  const [entryLoading, setEntryLoading] = useState(false);

  const entrySettledRef = useRef(false);
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buttons render immediately (see below) - this effect only warms up the
  // context in the background so a returning employee's tap on "Voyti kak
  // sotrudnik" can skip straight to their home screen instead of hitting
  // onboarding. It must never block the initial render, so there is no
  // "checking" state and no force-timer gating the UI - the lookup just
  // resolves whenever it resolves, or is silently abandoned on unmount.
  useEffect(() => {
    console.log('[Splash] Background identity warm-up starting.');
    let isMounted = true;

    (async () => {
      try {
        const deviceId = await getDeviceIdentityId();
        console.log('[Splash] device_identity_id =', deviceId);
        if (!deviceId || !isMounted) return;

        console.log('[Splash] Querying employees for telegram_chat_id =', deviceId);
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('telegram_chat_id', deviceId)
          .maybeSingle();
        console.log(
          '[Splash] Background query settled. error=',
          error?.message ?? null,
          'data=',
          data ? 'found' : 'none'
        );

        if (!isMounted) return;
        if (!error && data) {
          console.log('[Splash] Employee found - pre-loading into context.');
          setEmployee(data);
        }
      } catch (err: any) {
        console.warn('[Splash] Background warm-up threw:', err?.message ?? err);
      }
    })();

    return () => {
      console.log('[Splash] Unmount / effect cleanup.');
      isMounted = false;
    };
  }, []);

  const handleEmployeeEntry = useCallback(() => {
    console.log('[Splash] "Voyti kak sotrudnik" pressed.');

    // Background warm-up already found this device's employee - skip the
    // lookup entirely and go straight to their home screen.
    if (employee) {
      console.log('[Splash] Employee already warmed up in context - skipping lookup.');
      router.replace('/employee');
      return;
    }

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
  }, [employee, router, setEmployee]);

  const handleSupervisorEntry = useCallback(() => {
    router.push('/supervisor-pin');
  }, [router]);

  console.log('[Splash] Rendering. entryLoading=', entryLoading);

  return (
    <SplashBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Logo size={112} />
        </View>

        <View style={styles.footer}>
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
  version: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.lg,
  },
});
