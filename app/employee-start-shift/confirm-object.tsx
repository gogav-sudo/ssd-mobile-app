import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { YesNoButtons } from '@/components/ui/YesNoButtons';
import { Button } from '@/components/ui/Button';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { getTodayOpenShift } from '@/lib/shifts';
import { colors, spacing } from '@/theme';

// getTodayOpenShift goes through the ssd-api.ru proxy, which has confirmed
// occasional latency well above the shared 8s DEFAULT_QUERY_TIMEOUT_MS — give
// this specific status check more room before falling back to 'unknown'.
const STATUS_CHECK_TIMEOUT_MS = 20_000;

export default function ConfirmObjectScreen() {
  const router = useRouter();
  const { employee } = useEmployee();
  const [checking, setChecking] = useState(false);
  // 'unknown' from getTodayOpenShift (network/timeout) must never be treated
  // as "already open" or "none" — stay on this screen and let the person
  // retry the check, instead of guessing which branch to take.
  const [checkFailed, setCheckFailed] = useState(false);

  const handleYes = async () => {
    if (checking) return; // guard against repeated taps while a check is in flight
    setChecking(true);
    setCheckFailed(false);

    const deviceId = await getDeviceIdentityId();
    if (!deviceId) {
      setChecking(false);
      router.replace('/employee-start-shift/exit?reason=identity');
      return;
    }

    // getTodayOpenShift never throws — it resolves to { status: 'open' | 'none' | 'unknown' },
    // so there is nothing left here that needs a try/catch.
    const result = await getTodayOpenShift(deviceId, STATUS_CHECK_TIMEOUT_MS);
    setChecking(false);

    if (result.status === 'open') {
      router.replace('/employee-start-shift/exit?reason=already-open');
    } else if (result.status === 'none') {
      router.push('/employee-start-shift/photo');
    } else {
      setCheckFailed(true);
    }
  };

  const handleNo = () => {
    router.push('/employee-start-shift/exit?reason=object');
  };

  return (
    <WizardLayout
      step={2}
      totalSteps={6}
      eyebrow="НАЧАЛО СМЕНЫ"
      question={`Объект: ${employee?.object_name ?? '—'}. Верно?`}
      footer={
        checkFailed ? (
          <View>
            <Text style={styles.errorText}>
              Не удалось проверить статус смены. Проверьте подключение и повторите попытку.
            </Text>
            <View style={{ height: spacing.md }} />
            <Button label="Повторить" onPress={handleYes} loading={checking} disabled={checking} />
          </View>
        ) : (
          <YesNoButtons onYes={handleYes} onNo={handleNo} loading={checking} />
        )
      }
      onClose={() => router.replace('/employee')}
    />
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
