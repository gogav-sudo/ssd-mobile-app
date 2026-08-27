import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarClock, ShieldQuestion } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { getRecentShifts, getShiftCountThisMonth } from '@/lib/shifts';
import type { Shift } from '@/lib/supabase';

export default function EmployeeProfileScreen() {
  const { employee } = useEmployee();
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [monthCount, setMonthCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Always scope strictly to THIS device's identity. Prefer the
      // telegram_chat_id already loaded on the current employee record
      // (guaranteed to be the exact row matched at login/registration);
      // fall back to AsyncStorage only if the employee hasn't loaded yet.
      // Never fall back to full_name — names are not unique across devices.
      const deviceId = employee?.telegram_chat_id ?? (await getDeviceIdentityId());
      if (!deviceId) {
        setShifts([]);
        setMonthCount(0);
        return;
      }
      const [recent, count] = await Promise.all([
        getRecentShifts(deviceId, 5),
        getShiftCountThisMonth(deviceId),
      ]);
      setShifts(recent);
      setMonthCount(count);
    } catch {
      setShifts([]);
      setMonthCount(null);
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleSupervisorEntry = () => {
    router.replace('/supervisor');
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[type.label, styles.headerLabel]}>ПРОФИЛЬ</Text>
            <Text style={[type.h1, styles.headerTitle]}>
              {employee?.full_name ?? 'Сотрудник'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={[type.caption, styles.rowLabel]}>ПОЛНОЕ ИМЯ</Text>
              <Text style={[type.body, styles.rowValue]}>
                {employee?.full_name ?? '—'}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={[type.caption, styles.rowLabel]}>ОБЪЕКТ</Text>
              <Text style={[type.body, styles.rowValue]}>
                {employee?.object_name ?? '—'}
              </Text>
            </View>
            <View style={[styles.cardRow, styles.rowLast]}>
              <Text style={[type.caption, styles.rowLabel]}>ДОЛЖНОСТЬ</Text>
              <Text style={[type.body, styles.rowValue]}>{employee?.role ?? '—'}</Text>
            </View>
          </View>

          <Text style={[type.caption, styles.sectionLabel]}>СМЕНЫ</Text>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <CalendarClock size={18} color={colors.gold} strokeWidth={1.6} />
            </View>
            <View style={styles.statTextWrap}>
              <Text style={[type.h2, styles.statValue]}>
                {loading || monthCount === null ? '—' : monthCount}
              </Text>
              <Text style={[type.caption, styles.statLabel]}>СМЕН В ЭТОМ МЕСЯЦЕ</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : shifts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[type.bodySmall, styles.emptyText]}>
                История смен появится здесь после первой смены.
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {shifts.map((shift) => (
                <View key={shift.id} style={styles.historyRow}>
                  <View style={styles.historyTextWrap}>
                    <Text style={[type.body, styles.historyDate]}>
                      {formatDate(shift.shift_date)}
                    </Text>
                    <Text style={[type.caption, styles.historyTimes]}>
                      {formatTime(shift.start_time)} — {formatTime(shift.end_time)}
                    </Text>
                  </View>
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
          )}

          <Pressable
            style={({ pressed }) => [
              styles.supervisorButton,
              pressed && styles.supervisorButtonPressed,
            ]}
            onPress={handleSupervisorEntry}
          >
            <ShieldQuestion size={16} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={[type.button, styles.supervisorLabel]}>Войти как руководитель</Text>
          </Pressable>

          <Text style={[type.caption, styles.footerText]}>
            Внутренняя система · v1.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  cardRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    color: colors.gold,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  rowValue: {
    color: colors.textPrimary,
  },
  sectionLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  statTextWrap: { flex: 1 },
  statValue: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  centerState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  historyTextWrap: { flex: 1 },
  historyDate: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  historyTimes: {
    color: colors.textTertiary,
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
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
  supervisorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  supervisorButtonPressed: {
    opacity: 0.75,
  },
  supervisorLabel: {
    color: colors.textSecondary,
  },
  footerText: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },
});
