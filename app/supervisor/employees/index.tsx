import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, UserRound } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { getAllEmployees } from '@/lib/employeesData';
import type { Employee } from '@/lib/supabase';

export default function SupervisorEmployeesListScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const rows = await getAllEmployees();
      setEmployees(rows);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить сотрудников.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenBackground webMaxWidth={1000}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={[type.label, styles.headerLabel]}>СОТРУДНИКИ</Text>
          <Text style={[type.h1, styles.headerTitle]}>Личный состав</Text>
          {!loading && !errorMessage ? (
            <Text style={[type.caption, styles.headerCount]}>
              Всего: {employees.length}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.emptyText]}>Сотрудники пока не зарегистрированы.</Text>
          </View>
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {employees.map((employee) => (
              <Pressable
                key={employee.id}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/supervisor/employees/${employee.id}`)}
              >
                <View style={styles.avatar}>
                  <UserRound size={18} color={colors.gold} strokeWidth={1.6} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={[type.body, styles.cardName]} numberOfLines={1}>
                    {employee.full_name}
                  </Text>
                  <Text style={[type.caption, styles.cardMeta]} numberOfLines={1}>
                    {employee.object_name} · {employee.role}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  flex: { flex: 1 },
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerCount: {
    color: colors.textSecondary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cardPressed: {
    opacity: 0.75,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldMuted,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardName: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardMeta: {
    color: colors.textTertiary,
  },
});
