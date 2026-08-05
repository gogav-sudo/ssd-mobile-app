import React from 'react';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { YesNoButtons } from '@/components/ui/YesNoButtons';
import { useEmployee } from '@/context/EmployeeContext';

export default function ConfirmIdentityScreen() {
  const router = useRouter();
  const { employee } = useEmployee();

  const handleYes = () => {
    router.push('/employee/start-shift/confirm-object');
  };

  const handleNo = () => {
    router.push('/employee/start-shift/exit?reason=identity');
  };

  return (
    <WizardLayout
      step={1}
      totalSteps={6}
      eyebrow="НАЧАЛО СМЕНЫ"
      question={`Вы ${employee?.full_name ?? '—'}?`}
      footer={<YesNoButtons onYes={handleYes} onNo={handleNo} />}
      onClose={() => router.replace('/employee')}
    />
  );
}
