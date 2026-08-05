import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';

export default function RoleScreen() {
  const router = useRouter();
  const { data, setRole } = useOnboarding();
  const [value, setValue] = useState(data.role);

  const canContinue = value.trim().length >= 2;

  const handleNext = () => {
    setRole(value.trim());
    router.push('/employee-onboarding/summary');
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={4}
      question="Какая у вас должность?"
      footer={<Button label="Продолжить" onPress={handleNext} disabled={!canContinue} />}
    >
      <TextField
        placeholder="Охранник / Старший смены"
        value={value}
        onChangeText={setValue}
        autoFocus
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={canContinue ? handleNext : undefined}
      />
    </OnboardingLayout>
  );
}
