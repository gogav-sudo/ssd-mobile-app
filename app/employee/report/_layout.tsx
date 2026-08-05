import { Stack } from 'expo-router';
import { ReportProblemProvider } from '@/context/ReportProblemContext';
import { colors } from '@/theme';

export default function ReportLayout() {
  return (
    <ReportProblemProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </ReportProblemProvider>
  );
}
