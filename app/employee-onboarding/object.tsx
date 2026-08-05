import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';

export default function ObjectScreen() {
  const router = useRouter();
  const { data, setObjectName } = useOnboarding();
  const [value, setValue] = useState(data.objectName);

  const canContinue = value.trim().length >= 2;

  const handleNext = () => {
    setObjectName(value.trim());
    router.push('/employee-onboarding/role');
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={4}
      question="На каком объекте вы работаете?"
      footer={<Button label="Продолжить" onPress={handleNext} disabled={!canContinue} />}
    >
      <TextField
        placeholder="ЖК «Резиденция Парк», корпус 2"
        value={value}
        onChangeText={setValue}
        autoFocus
        autoCapitalize="sentences"
        returnKeyType="next"
        onSubmitEditing={canContinue ? handleNext : undefined}
      />
    </OnboardingLayout>
  );
}
