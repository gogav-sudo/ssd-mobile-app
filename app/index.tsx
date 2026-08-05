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
import { useEmployee } from '@/context/EmployeeContext';

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

        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('telegram_chat_id', deviceId)
          .maybeSingle();

        if (!isMounted) return;

        if (!error && data) {
          setEmployee(data);
        }
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

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('telegram_chat_id', deviceId)
      .maybeSingle();

    if (!error && data) {
      setEmployee(data);
      router.replace('/employee');
    } else {
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
