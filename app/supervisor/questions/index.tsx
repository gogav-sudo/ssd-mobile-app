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
import { ChevronLeft, Filter, MessageCircleQuestion, X } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import {
  getResidentQuestions,
  getDistinctResidentQuestionObjectNames,
  ResidentQuestionsFilter,
} from '@/lib/residentQuestions';
import { todayIsoDate } from '@/lib/date';
import type { ResidentQuestion } from '@/lib/supabase';

type RangePreset = 'today' | '7d' | '30d' | 'all';

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
];

function rangeToDates(preset: RangePreset): { dateFrom: string | null; dateTo: string | null } {
  if (preset === 'all') return { dateFrom: null, dateTo: null };

  const today = todayIsoDate();
  if (preset === 'today') return { dateFrom: today, dateTo: today };

  const days = preset === '7d' ? 6 : 29;
  const from = new Date();
  from.setDate(from.getDate() - days);
  const year = from.getFullYear();
  const month = String(from.getMonth() + 1).padStart(2, '0');
  const day = String(from.getDate()).padStart(2, '0');
  return { dateFrom: `${year}-${month}-${day}`, dateTo: today };
}

export default function SupervisorQuestionsListScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<ResidentQuestion[]>([]);
  const [objects, setObjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [objectPickerOpen, setObjectPickerOpen] = useState(false);

  const [rangePreset, setRangePreset] = useState<RangePreset>('7d');
  const [objectName, setObjectName] = useState<string | null>(null);

  const filter: ResidentQuestionsFilter = useMemo(() => {
    const { dateFrom, dateTo } = rangeToDates(rangePreset);
    return { dateFrom, dateTo, objectName };
  }, [rangePreset, objectName]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [rows, objectNames] = await Promise.all([
        getResidentQuestions(filter),
        objects.length === 0 ? getDistinctResidentQuestionObjectNames() : Promise.resolve(objects),
      ]);
      setQuestions(rows);
      if (objects.length === 0) setObjects(objectNames);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить вопросы жителей.');
    } finally {
      setLoading(false);
    }
  }, [filter, objects]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenBackground webMaxWidth={1100}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={1.8} />
          </Pressable>
          <View>
            <Text style={[type.label, styles.headerLabel]}>ВОПРОСЫ ЖИТЕЛЕЙ</Text>
            <Text style={[type.h1, styles.headerTitle]}>Журнал вопросов</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rangeChipsRow}
          style={styles.rangeChipsScroll}
        >
          {RANGE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, rangePreset === option.value && styles.chipActive]}
              onPress={() => setRangePreset(option.value)}
            >
              <Text style={[styles.chipText, rangePreset === option.value && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterButton, objectName && styles.filterButtonActive]}
            onPress={() => setObjectPickerOpen(true)}
          >
            <Filter size={13} color={objectName ? colors.gold : colors.textSecondary} strokeWidth={1.8} />
            <Text
              style={[styles.filterButtonText, objectName && styles.filterButtonTextActive]}
              numberOfLines={1}
            >
              {objectName ?? 'Все объекты'}
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
        ) : questions.length === 0 ? (
          <View style={styles.centerState}>
            <MessageCircleQuestion size={22} color={colors.textTertiary} strokeWidth={1.6} />
            <Text style={[type.bodySmall, styles.emptyText]}>
              По выбранным фильтрам вопросов не найдено.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {questions.map((q) => (
              <View key={q.id} style={styles.card}>
                <Text style={[type.body, styles.cardQuestion]}>{q.question_text}</Text>
                <View style={styles.cardMetaRow}>
                  <Text style={[type.caption, styles.cardMeta]} numberOfLines={1}>
                    {q.full_name} · {q.object_name}
                  </Text>
                  <Text style={[type.caption, styles.cardDate]}>
                    {formatDateTime(q.created_at)}
                  </Text>
                </View>
              </View>
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
    </ScreenBackground>
  );
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
  flex: { flex: 1 },
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  rangeChipsScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  rangeChipsRow: {
    gap: spacing.xs,
    alignItems: 'center',
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
    maxWidth: 200,
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
    gap: spacing.sm,
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
  cardQuestion: {
    color: colors.textPrimary,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardMeta: {
    color: colors.textTertiary,
    flex: 1,
  },
  cardDate: {
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
