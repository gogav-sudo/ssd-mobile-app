import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { colors } from '@/theme';

export default function OnboardingLayoutRoot() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </OnboardingProvider>
  );
}
