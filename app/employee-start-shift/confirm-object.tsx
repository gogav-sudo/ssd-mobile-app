import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { YesNoButtons } from '@/components/ui/YesNoButtons';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { getTodayOpenShift } from '@/lib/shifts';

export default function ConfirmObjectScreen() {
  const router = useRouter();
  const { employee } = useEmployee();
  const [checking, setChecking] = useState(false);

  const handleYes = async () => {
    setChecking(true);
    try {
      const deviceId = await getDeviceIdentityId();
      if (!deviceId) {
        router.replace('/employee-start-shift/exit?reason=identity');
        return;
      }

      const openShift = await getTodayOpenShift(deviceId);

      if (openShift) {
        router.replace('/employee-start-shift/exit?reason=already-open');
      } else {
        router.push('/employee-start-shift/photo');
      }
    } catch {
      router.replace('/employee-start-shift/exit?reason=already-open');
    } finally {
      setChecking(false);
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
      footer={<YesNoButtons onYes={handleYes} onNo={handleNo} loading={checking} />}
      onClose={() => router.replace('/employee')}
    />
  );
}
