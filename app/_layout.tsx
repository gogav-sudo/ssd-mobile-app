if (typeof document !== 'undefined' && !document.getElementById('genvibe-inspector')) {
  var __gvInspector = document.createElement('script');
  __gvInspector.id = 'genvibe-inspector';
  __gvInspector.src = 'https://genvibe.pro/inspector-script.js?v=e2b-route2';
  document.head.appendChild(__gvInspector);
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { EmployeeProvider } from '@/context/EmployeeContext';
import { colors } from '@/theme';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <EmployeeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="supervisor-pin" />
      </Stack>
      <StatusBar style="light" />
    </EmployeeProvider>
  );
}
