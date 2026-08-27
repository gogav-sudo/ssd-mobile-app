import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertTriangle, ChevronRight, LogOut, ShieldCheck, ShieldX } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { getTodayOpenShift } from '@/lib/shifts';
import type { Shift } from '@/lib/supabase';

// 'unknown' means the check itself failed (network/timeout) — it must never
// be presented as "not open", since a real open shift could still exist
// server-side (see lib/shifts.ts ShiftLookupResult).
type ShiftStatus = 'checking' | 'open' | 'none' | 'unknown';

// getTodayOpenShift goes through the ssd-api.ru proxy, which has confirmed
// occasional latency well above the shared 8s DEFAULT_QUERY_TIMEOUT_MS — give
// this specific status check more room before falling back to 'unknown'.
const STATUS_CHECK_TIMEOUT_MS = 20_000;

export default function EmployeeHomeScreen() {
  const { employee } = useEmployee();
  const router = useRouter();
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus>('checking');
  const [openShift, setOpenShift] = useState<Shift | null>(null);

  const loadShiftStatus = useCallback(async () => {
    setShiftStatus('checking');
    const deviceId = await getDeviceIdentityId();
    if (!deviceId) {
      setOpenShift(null);
      setShiftStatus('unknown');
      return;
    }
    const result = await getTodayOpenShift(deviceId, STATUS_CHECK_TIMEOUT_MS);
    if (result.status === 'open') {
      setOpenShift(result.shift);
      setShiftStatus('open');
    } else if (result.status === 'none') {
      setOpenShift(null);
      setShiftStatus('none');
    } else {
      setOpenShift(null);
      setShiftStatus('unknown');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShiftStatus();
    }, [loadShiftStatus])
  );

  const loadingShift = shiftStatus === 'checking';

  const handleStartShift = () => {
    // Fail closed: only allow starting a new shift once the server has
    // confirmed none is already open — never while checking or unknown.
    if (shiftStatus !== 'none') return;
    router.push('/employee-start-shift/confirm-identity');
  };

  const handleEndShift = () => {
    router.push('/employee-end-shift');
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={[type.label, styles.headerLabel]}>ЛИЧНЫЙ КАБИНЕТ</Text>
          <Text style={[type.h1, styles.headerTitle]}>
            {employee?.full_name ?? 'Сотрудник'}
          </Text>
        </View>

        <View style={styles.card}>
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

        <Pressable
          style={({ pressed }) => [
            styles.statusCard,
            shiftStatus === 'open'
              ? styles.statusCardOpen
              : shiftStatus === 'unknown'
                ? styles.statusCardUnknown
                : styles.statusCardClosed,
            pressed && (shiftStatus === 'none' || shiftStatus === 'unknown') && styles.statusCardPressed,
          ]}
          onPress={shiftStatus === 'unknown' ? loadShiftStatus : handleStartShift}
          disabled={loadingShift || shiftStatus === 'open'}
        >
          <View
            style={[
              styles.statusIcon,
              shiftStatus === 'open'
                ? styles.statusIconOpen
                : shiftStatus === 'unknown'
                  ? styles.statusIconUnknown
                  : styles.statusIconClosed,
            ]}
          >
            {loadingShift ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : shiftStatus === 'open' ? (
              <ShieldCheck size={20} color={colors.success} strokeWidth={1.6} />
            ) : shiftStatus === 'unknown' ? (
              <AlertTriangle size={20} color={colors.warning} strokeWidth={1.6} />
            ) : (
              <ShieldX size={20} color={colors.gold} strokeWidth={1.6} />
            )}
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={[type.bodySmall, styles.statusTitle]}>
              {loadingShift
                ? 'Проверяем статус смены…'
                : shiftStatus === 'open'
                  ? 'Смена открыта'
                  : shiftStatus === 'unknown'
                    ? 'Не удалось проверить статус смены'
                    : 'Смена не открыта'}
            </Text>
            <Text style={[type.caption, styles.statusSubtitle]}>
              {loadingShift
                ? 'Подождите'
                : shiftStatus === 'open'
                  ? `Начата в ${formatTime(openShift!.start_time)}`
                  : shiftStatus === 'unknown'
                    ? 'Нажмите, чтобы повторить проверку'
                    : 'Нажмите, чтобы начать смену'}
            </Text>
          </View>
          {!loadingShift && shiftStatus !== 'open' ? (
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
          ) : null}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.endShiftButton, pressed && styles.endShiftButtonPressed]}
          onPress={handleEndShift}
        >
          <LogOut size={16} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={[type.button, styles.endShiftLabel]}>Завершить смену</Text>
        </Pressable>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
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
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
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
  statusCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statusCardClosed: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
  },
  statusCardOpen: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusCardUnknown: {
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
  },
  statusCardPressed: {
    opacity: 0.8,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statusIconClosed: {
    backgroundColor: colors.surface,
  },
  statusIconOpen: {
    backgroundColor: colors.successMuted,
  },
  statusIconUnknown: {
    backgroundColor: colors.warningMuted,
  },
  statusTextWrap: { flex: 1 },
  statusTitle: {
    color: colors.textPrimary,
    marginBottom: 3,
    fontWeight: '600',
  },
  statusSubtitle: {
    color: colors.textSecondary,
    lineHeight: 16,
  },
  endShiftButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  endShiftButtonPressed: {
    opacity: 0.75,
  },
  endShiftLabel: {
    color: colors.textSecondary,
  },
});
