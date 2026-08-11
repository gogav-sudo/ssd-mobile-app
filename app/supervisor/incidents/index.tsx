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
  getIncidents,
  getDistinctIncidentObjectNames,
  IncidentsFilter,
  IncidentStatusFilter,
  IncidentUrgencyFilter,
  INCIDENT_STATUS_LABELS,
} from '@/lib/incidentsData';
import { todayIsoDate } from '@/lib/date';
import type { Incident } from '@/lib/supabase';

const STATUS_OPTIONS: { value: IncidentStatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'resolved', label: 'Решённые' },
];

const URGENCY_OPTIONS: { value: IncidentUrgencyFilter; label: string }[] = [
  { value: 'all', label: 'Любая' },
  { value: 'Высокая', label: 'Высокая' },
  { value: 'Средняя', label: 'Средняя' },
  { value: 'Низкая', label: 'Низкая' },
];

function urgencyColor(urgency: string): { fg: string; bg: string; border: string } {
  if (urgency === 'Высокая') return { fg: colors.error, bg: colors.errorMuted, border: colors.error };
  if (urgency === 'Средняя') return { fg: colors.warning, bg: colors.warningMuted, border: colors.warning };
  return { fg: colors.success, bg: colors.successMuted, border: colors.success };
}

export default function SupervisorIncidentsListScreen() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [objects, setObjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [objectPickerOpen, setObjectPickerOpen] = useState(false);
  const [urgencyPickerOpen, setUrgencyPickerOpen] = useState(false);

  const [date, setDate] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string | null>(null);
  const [status, setStatus] = useState<IncidentStatusFilter>('all');
  const [urgency, setUrgency] = useState<IncidentUrgencyFilter>('all');

  const filter: IncidentsFilter = useMemo(
    () => ({ date, objectName, status, urgency }),
    [date, objectName, status, urgency]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [rows, objectNames] = await Promise.all([
        getIncidents(filter),
        objects.length === 0 ? getDistinctIncidentObjectNames() : Promise.resolve(objects),
      ]);
      setIncidents(rows);
      if (objects.length === 0) setObjects(objectNames);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить инциденты.');
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

  const activeUrgencyLabel =
    URGENCY_OPTIONS.find((option) => option.value === urgency)?.label ?? 'Любая';

  return (
    <ScreenBackground webMaxWidth={1100}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={[type.label, styles.headerLabel]}>ИНЦИДЕНТЫ</Text>
          <Text style={[type.h1, styles.headerTitle]}>Журнал происшествий</Text>
        </View>

        <View style={styles.dateRow}>
          <Pressable style={styles.dateArrowButton} onPress={() => shiftDay(-1)} disabled={!date}>
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

          <Pressable style={styles.dateArrowButton} onPress={() => shiftDay(1)} disabled={!date}>
            <ChevronRight
              size={18}
              color={date ? colors.textSecondary : colors.textTertiary}
              strokeWidth={1.8}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsRow}
          style={styles.statusChipsScroll}
        >
          {STATUS_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, status === option.value && styles.chipActive]}
              onPress={() => setStatus(option.value)}
            >
              <Text style={[styles.chipText, status === option.value && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterButton, urgency !== 'all' && styles.filterButtonActive]}
            onPress={() => setUrgencyPickerOpen(true)}
          >
            <Filter size={13} color={urgency !== 'all' ? colors.gold : colors.textSecondary} strokeWidth={1.8} />
            <Text style={[styles.filterButtonText, urgency !== 'all' && styles.filterButtonTextActive]}>
              {activeUrgencyLabel}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterButton, objectName && styles.filterButtonActive]}
            onPress={() => setObjectPickerOpen(true)}
          >
            <Filter size={13} color={objectName ? colors.gold : colors.textSecondary} strokeWidth={1.8} />
            <Text
              style={[styles.filterButtonText, objectName && styles.filterButtonTextActive]}
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
        ) : incidents.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.emptyText]}>
              По выбранным фильтрам инцидентов не найдено.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {incidents.map((incident) => {
              const urgencyStyle = urgencyColor(incident.urgency);
              return (
                <Pressable
                  key={incident.id}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => router.push(`/supervisor/incidents/${incident.id}`)}
                >
                  <View style={styles.cardTop}>
                    <Text style={[type.body, styles.cardTitle]} numberOfLines={1}>
                      {incident.incident_type}
                    </Text>
                    <View
                      style={[
                        styles.urgencyBadge,
                        { backgroundColor: urgencyStyle.bg, borderColor: urgencyStyle.border },
                      ]}
                    >
                      <Text style={[styles.urgencyBadgeText, { color: urgencyStyle.fg }]}>
                        {incident.urgency.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[type.bodySmall, styles.cardDescription]} numberOfLines={2}>
                    {incident.description}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <Text style={[type.caption, styles.cardMeta]} numberOfLines={1}>
                      {incident.full_name} · {incident.object_name}
                    </Text>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={[type.caption, styles.cardDate]}>
                      {formatDateTime(incident.created_at)}
                    </Text>
                    <View style={styles.statusChipSmall}>
                      <Text style={styles.statusChipSmallText}>
                        {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
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
                  style={[type.body, styles.modalOptionText, !objectName && styles.modalOptionTextActive]}
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

      <Modal
        visible={urgencyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUrgencyPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setUrgencyPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[type.h2, styles.modalTitle]}>Приоритет</Text>
              <Pressable onPress={() => setUrgencyPickerOpen(false)} hitSlop={12}>
                <X size={20} color={colors.textSecondary} strokeWidth={1.8} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {URGENCY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    setUrgency(option.value);
                    setUrgencyPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      type.body,
                      styles.modalOptionText,
                      urgency === option.value && styles.modalOptionTextActive,
                    ]}
                  >
                    {option.label}
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

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
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
  statusChipsScroll: {
    marginBottom: spacing.sm,
  },
  statusChipsRow: {
    gap: spacing.xs,
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    maxWidth: 150,
  },
  filterButtonActive: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
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
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    color: colors.textPrimary,
    flex: 1,
  },
  cardDescription: {
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardMetaRow: {
    marginBottom: spacing.sm,
  },
  cardMeta: {
    color: colors.textTertiary,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
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
  urgencyBadge: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
  },
  urgencyBadgeText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
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
