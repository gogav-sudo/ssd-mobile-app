import React from 'react';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { YesNoButtons } from '@/components/ui/YesNoButtons';
import { useStartShift } from '@/context/StartShiftContext';

export default function EquipmentCheckScreen() {
  const router = useRouter();
  const { setEquipmentOk } = useStartShift();

  const handleAnswer = (value: boolean) => {
    setEquipmentOk(value);
    router.push('/employee-start-shift/notes');
  };

  return (
    <WizardLayout
      step={5}
      totalSteps={6}
      eyebrow="НАЧАЛО СМЕНЫ"
      question="Техника исправна?"
      footer={<YesNoButtons onYes={() => handleAnswer(true)} onNo={() => handleAnswer(false)} />}
    />
  );
}
