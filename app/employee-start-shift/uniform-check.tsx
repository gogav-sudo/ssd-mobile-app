import React from 'react';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { YesNoButtons } from '@/components/ui/YesNoButtons';
import { useStartShift } from '@/context/StartShiftContext';

export default function UniformCheckScreen() {
  const router = useRouter();
  const { setUniformOk } = useStartShift();

  const handleAnswer = (value: boolean) => {
    setUniformOk(value);
    router.push('/employee-start-shift/equipment-check');
  };

  return (
    <WizardLayout
      step={4}
      totalSteps={6}
      eyebrow="НАЧАЛО СМЕНЫ"
      question="Форма соответствует стандарту?"
      footer={<YesNoButtons onYes={() => handleAnswer(true)} onNo={() => handleAnswer(false)} />}
    />
  );
}
