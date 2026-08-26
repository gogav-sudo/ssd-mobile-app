import React from 'react';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { YesNoButtons } from '@/components/ui/YesNoButtons';
import { useEndShift } from '@/context/EndShiftContext';

export default function EndShiftEquipmentCheckScreen() {
  const router = useRouter();
  const { setEquipmentOk } = useEndShift();

  const handleAnswer = (value: boolean) => {
    setEquipmentOk(value);
    router.push('/employee-end-shift/notes');
  };

  return (
    <WizardLayout
      step={1}
      totalSteps={2}
      eyebrow="ЗАВЕРШЕНИЕ СМЕНЫ"
      question="Техника исправна?"
      footer={<YesNoButtons onYes={() => handleAnswer(true)} onNo={() => handleAnswer(false)} />}
      onClose={() => router.replace('/employee')}
    />
  );
}
