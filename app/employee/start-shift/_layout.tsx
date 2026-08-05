import { Stack } from 'expo-router';
import { StartShiftProvider } from '@/context/StartShiftContext';
import { colors } from '@/theme';

export default function StartShiftLayout() {
  return (
    <StartShiftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </StartShiftProvider>
  );
}
