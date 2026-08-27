import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarClock, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import {
  getShifts,
  getDistinctObjectNames,
  ShiftsFilter,
  ShiftStatusFilter,
} from '@/lib/supervisorData';
import { todayIsoDate } from '@/lib/date';
import type { Shift } from '@/lib/supabase';

const STATUS_OPTIONS: { value: ShiftStatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'open', label: 'Открытые' },
  { value: 'closed', label: 'Закрытые' },
];

export default function SupervisorShiftsListScreen() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [objects, setObjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [objectPickerOpen, setObjectPickerOpen] = useState(false);

  const [date, setDate] = useState<string | null>(todayIsoDate());
  const [objectName, setObjectName] = useState<string | null>(null);
  const [status, setStatus] = useState<ShiftStatusFilter>('all');

  const filter: ShiftsFilter = useMemo(
    () => ({ date, objectName, status }),
    [date, objectName, status]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [rows, objectNames] = await Promise.all([
        getShifts(filter),
        objects.length === 0 ? getDistinctObjectNames() : Promise.resolve(objects),
      ]);
      setShifts(rows);
      if (objects.length === 0) setObjects(objectNames);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить смены.');
    } finally {
      setLoading(false);
    }
  }, [filter, objects]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shiftDay = (deltaDays: number) => {
    setDate((current) => {
      const base = current ? new Date(`${current}T00:00:00`) : new Date();
      base.setDate(base.getDate() + deltaDays);
      return toIsoDate(base);
    });
  };

  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        weekday: 'short',
      })
    : 'Все даты';

  return (
    <ScreenBackground webMaxWidth={1100}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={[type.label, styles.headerLabel]}>СМЕНЫ</Text>
          <Text style={[type.h1, styles.headerTitle]}>Журнал смен</Text>
        </View>

        <View style={styles.dateRow}>
          <Pressable
            style={styles.dateArrowButton}
            onPress={() => shiftDay(-1)}
            disabled={!date}
          >
            <ChevronLeft
              size={18}
              color={date ? colors.textSecondary : colors.textTertiary}
              strokeWidth={1.8}
            />
          </Pressable>

          <Pressable
            style={styles.dateLabelButton}
            onPress={() => setDate((current) => (current ? null : todayIsoDate()))}
          >
            <CalendarClock size={14} color={colors.gold} strokeWidth={1.8} />
            <Text style={[type.bodySmall, styles.dateLabelText]}>{capitalize(dateLabel)}</Text>
          </Pressable>

          <Pressable
            style={styles.dateArrowButton}
            onPress={() => shiftDay(1)}
            disabled={!date}
          >
            <ChevronRight
              size={18}
              color={date ? colors.textSecondary : colors.textTertiary}
              strokeWidth={1.8}
            />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.statusChips}>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  status === option.value && styles.chipActive,
                ]}
                onPress={() => setStatus(option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    status === option.value && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.objectFilterButton, objectName && styles.objectFilterButtonActive]}
            onPress={() => setObjectPickerOpen(true)}
          >
            <Filter
              size={13}
              color={objectName ? colors.gold : colors.textSecondary}
              strokeWidth={1.8}
            />
            <Text
              style={[
                styles.objectFilterText,
                objectName && styles.objectFilterTextActive,
              ]}
              numberOfLines={1}
            >
              {objectName ?? 'Объект'}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
          </View>
        ) : shifts.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.emptyText]}>
              По выбранным фильтрам смен не найдено.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {shifts.map((shift) => (
              <Pressable
                key={shift.id}
                style={({ pressed }) => [
                  styles.shiftCard,
                  pressed && styles.shiftCardPressed,
                ]}
                onPress={() => router.push(`/supervisor/shifts/${shift.id}`)}
              >
                <View style={styles.shiftCardTop}>
                  <Text style={[type.body, styles.shiftName]} numberOfLines={1}>
                    {shift.full_name}
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
                <Text style={[type.caption, styles.shiftObject]} numberOfLines={1}>
                  {shift.object_name}
                </Text>
                <View style={styles.shiftTimesRow}>
                  <Text style={[type.caption, styles.shiftTimes]}>
                    {formatTime(shift.start_time)} — {formatTime(shift.end_time)}
                  </Text>
                  <Text style={[type.caption, styles.shiftDate]}>
                    {formatDate(shift.shift_date)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal
        visible={objectPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setObjectPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setObjectPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[type.h2, styles.modalTitle]}>Объект</Text>
              <Pressable onPress={() => setObjectPickerOpen(false)} hitSlop={12}>
                <X size={20} color={colors.textSecondary} strokeWidth={1.8} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              <Pressable
                style={styles.modalOption}
                onPress={() => {
                  setObjectName(null);
                  setObjectPickerOpen(false);
                }}
              >
                <Text
                  style={[
                    type.body,
                    styles.modalOptionText,
                    !objectName && styles.modalOptionTextActive,
                  ]}
                >
                  Все объекты
                </Text>
              </Pressable>
              {objects.map((name) => (
                <Pressable
                  key={name}
                  style={styles.modalOption}
                  onPress={() => {
                    setObjectName(name);
                    setObjectPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      type.body,
                      styles.modalOptionText,
                      objectName === name && styles.modalOptionTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBackground>
  );
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(isoDate: string): string {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  flex: { flex: 1 },
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateArrowButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  dateLabelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
  },
  dateLabelText: {
    color: colors.gold,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipActive: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.gold,
  },
  objectFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    maxWidth: 130,
  },
  objectFilterButtonActive: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
  },
  objectFilterText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  objectFilterTextActive: {
    color: colors.gold,
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
  shiftCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  shiftCardPressed: {
    opacity: 0.75,
  },
  shiftCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  shiftName: {
    color: colors.textPrimary,
    flex: 1,
  },
  shiftObject: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  shiftTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftTimes: {
    color: colors.textSecondary,
  },
  shiftDate: {
    color: colors.textTertiary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalTitle: {
    color: colors.textPrimary,
  },
  modalList: {
    paddingHorizontal: spacing.xl,
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalOptionText: {
    color: colors.textSecondary,
  },
  modalOptionTextActive: {
    color: colors.gold,
    fontWeight: '600',
  },
});
