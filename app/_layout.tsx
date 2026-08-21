if (typeof document !== 'undefined' && !document.getElementById('genvibe-inspector')) {
  var __gvInspector = document.createElement('script');
  __gvInspector.id = 'genvibe-inspector';
  __gvInspector.src = 'https://genvibe.pro/inspector-script.js?v=e2b-route2';
  document.head.appendChild(__gvInspector);
}

// NOTE: with ES module syntax, `import` statements are hoisted by the
// bundler and evaluated before any other top-level code in this file,
// regardless of where they're written. So the true "earliest" log we can
// get is right after the imports resolve, at module-eval time — before the
// RootLayout function is ever called by React.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { EmployeeProvider } from '@/context/EmployeeContext';
import { colors } from '@/theme';

console.log('[RootLayout] Module evaluated — all imports resolved, before first render.');

export default function RootLayout() {
  console.log('[RootLayout] Component function called (render start).');
  useFrameworkReady();
  console.log('[RootLayout] useFrameworkReady() returned — about to render tree.');

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
