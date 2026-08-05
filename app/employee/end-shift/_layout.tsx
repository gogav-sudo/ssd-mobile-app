import { Stack } from 'expo-router';
import { EndShiftProvider } from '@/context/EndShiftContext';
import { colors } from '@/theme';

export default function EndShiftLayout() {
  return (
    <EndShiftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </EndShiftProvider>
  );
}
