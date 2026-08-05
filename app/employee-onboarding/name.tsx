import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';

export default function NameScreen() {
  const router = useRouter();
  const { data, setFullName } = useOnboarding();
  const [value, setValue] = useState(data.fullName);

  const canContinue = value.trim().length >= 2;

  const handleNext = () => {
    setFullName(value.trim());
    router.push('/employee-onboarding/object');
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={4}
      question="Как ваше полное имя?"
      footer={<Button label="Продолжить" onPress={handleNext} disabled={!canContinue} />}
    >
      <TextField
        placeholder="Иванов Иван Иванович"
        value={value}
        onChangeText={setValue}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={canContinue ? handleNext : undefined}
      />
    </OnboardingLayout>
  );
}
