import { Redirect, Tabs } from 'expo-router';
import { LayoutGrid, ShieldAlert, CalendarClock, Users, BookOpen } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { colors, fontFamily } from '@/theme';
import { useSupervisorAccess } from '@/context/SupervisorAccessContext';

export default function SupervisorTabsLayout() {
  const { supervisorAccessGranted } = useSupervisorAccess();

  // Single guard for the entire /supervisor/** tree (dashboard, shifts,
  // shift details, incidents, incident details, employees, employee
  // details, questions, feedback, knowledge, and any other route nested
  // under this layout) — every one of them renders as a child of this
  // Tabs layout, so gating here covers all of them without touching each
  // screen individually. /supervisor-pin lives outside app/supervisor/, so
  // it never passes through this guard — no redirect loop is possible.
  if (!supervisorAccessGranted) {
    return <Redirect href="/supervisor-pin" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Обзор',
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid color={color} size={size - 3} strokeWidth={1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: 'Смены',
          tabBarIcon: ({ color, size }) => (
            <CalendarClock color={color} size={size - 3} strokeWidth={1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Инциденты',
          tabBarIcon: ({ color, size }) => (
            <ShieldAlert color={color} size={size - 3} strokeWidth={1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Сотрудники',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size - 3} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: 'База знаний',
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size - 3} strokeWidth={1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 84,
    paddingTop: 10,
    paddingBottom: 24,
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontFamily: fontFamily.body,
    fontSize: 9.5,
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
