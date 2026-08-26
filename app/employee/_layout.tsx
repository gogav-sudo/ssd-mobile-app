import { Tabs } from 'expo-router';
import { Home, ClipboardList, MessageCircleQuestion, BookOpen, User } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { colors, fontFamily } from '@/theme';

export default function EmployeeTabsLayout() {
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
          title: 'Главная',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Проблема',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size - 2} strokeWidth={1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: 'Вопросы',
          tabBarIcon: ({ color, size }) => (
            <MessageCircleQuestion color={color} size={size - 2} strokeWidth={1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: 'База знаний',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size - 2} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={1.6} />,
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
