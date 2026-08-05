import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ClipboardList, ShieldAlert } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { getEmployeeById, getEmployeeStats, EmployeeStats } from '@/lib/employeesData';
import { INCIDENT_STATUS_LABELS } from '@/lib/incidentsData';
import type { Employee } from '@/lib/supabase';

export default function SupervisorEmployeeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!numericId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const row = await getEmployeeById(numericId);
      setEmployee(row);
      if (row) {
        const statsRow = await getEmployeeStats(row.telegram_chat_id);
        setStats(statsRow);
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить данные сотрудника.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : errorMessage || !employee ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>
              {errorMessage ?? 'Сотрудник не найден.'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[type.label, styles.headerLabel]}>ПРОФИЛЬ СОТРУДНИКА</Text>
            <Text style={[type.h1, styles.title]}>{employee.full_name}</Text>
            <Text style={[type.bodySmall, styles.subtitle]}>
              {employee.object_name} · {employee.role}
            </Text>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={[type.caption, styles.rowLabel]}>ОБЪЕКТ</Text>
                <Text style={[type.body, styles.rowValue]}>{employee.object_name}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[type.caption, styles.rowLabel]}>ДОЛЖНОСТЬ</Text>
                <Text style={[type.body, styles.rowValue]}>{employee.role}</Text>
              </View>
              <View style={[styles.cardRow, styles.rowLast]}>
                <Text style={[type.caption, styles.rowLabel]}>ДАТА РЕГИСТРАЦИИ</Text>
                <Text style={[type.body, styles.rowValue]}>{formatDate(employee.created_at)}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <ClipboardList size={18} color={colors.gold} strokeWidth={1.6} />
                </View>
                <Text style={[type.h2, styles.statValue]}>{stats?.totalShifts ?? 0}</Text>
                <Text style={[type.caption, styles.statLabel]}>ВСЕГО СМЕН</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, styles.statIconWarning]}>
                  <ShieldAlert size={18} color={colors.warning} strokeWidth={1.6} />
                </View>
                <Text style={[type.h2, styles.statValue]}>{stats?.totalIncidents ?? 0}</Text>
                <Text style={[type.caption, styles.statLabel]}>ИНЦИДЕНТОВ ЗАЯВЛЕНО</Text>
              </View>
            </View>

            <Text style={[type.caption, styles.sectionLabel]}>ПОСЛЕДНИЕ СМЕНЫ</Text>
            {stats && stats.recentShifts.length > 0 ? (
              <View style={styles.historyList}>
                {stats.recentShifts.map((shift) => (
                  <View key={shift.id} style={styles.historyRow}>
                    <Text style={[type.bodySmall, styles.historyText]}>
                      {formatDate(shift.shift_date)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        shift.status === 'open' ? styles.statusBadgeOpen : styles.statusBadgeClosed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          shift.status === 'open'
                            ? styles.statusBadgeTextOpen
                            : styles.statusBadgeTextClosed,
                        ]}
                      >
                        {shift.status === 'open' ? 'ОТКРЫТА' : 'ЗАКРЫТА'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={[type.bodySmall, styles.emptyText]}>Смен пока не было.</Text>
              </View>
            )}

            <Text style={[type.caption, styles.sectionLabel]}>ПОСЛЕДНИЕ ИНЦИДЕНТЫ</Text>
            {stats && stats.recentIncidents.length > 0 ? (
              <View style={styles.historyList}>
                {stats.recentIncidents.map((incident) => (
                  <View key={incident.id} style={styles.historyRow}>
                    <Text style={[type.bodySmall, styles.historyText]} numberOfLines={1}>
                      {incident.incident_type}
                    </Text>
                    <View style={styles.statusChipSmall}>
                      <Text style={styles.statusChipSmallText}>
                        {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={[type.bodySmall, styles.emptyText]}>Инцидентов не заявлено.</Text>
              </View>
            )}

            <View style={styles.footerSpacer} />
          </ScrollView>
        )}

        <View style={styles.footer}>
          <Button label="Назад к списку" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function formatDate(iso: string): string {
  try {
    const hasTime = iso.includes('T');
    const date = hasTime ? new Date(iso) : new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    color: colors.gold,
    letterSpacing: 1.2,
  },
  rowValue: {
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldMuted,
    marginBottom: spacing.sm,
  },
  statIconWarning: {
    backgroundColor: colors.warningMuted,
  },
  statValue: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    color: colors.textSecondary,
    letterSpacing: 1,
    fontSize: 10,
  },
  sectionLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: spacing.md,
  },
  historyList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  historyText: {
    color: colors.textPrimary,
    flex: 1,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
  },
  statusBadgeOpen: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  statusBadgeClosed: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
  },
  statusBadgeText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
  },
  statusBadgeTextOpen: {
    color: colors.success,
  },
  statusBadgeTextClosed: {
    color: colors.textTertiary,
  },
  statusChipSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  statusChipSmallText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerSpacer: {
    height: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});
