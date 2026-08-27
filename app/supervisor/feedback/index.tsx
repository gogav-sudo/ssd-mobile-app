import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Lightbulb, MessageSquareText, ShieldQuestion } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { getEmployeeFeedback, EmployeeFeedbackFilter, FeedbackTypeFilter } from '@/lib/employeeFeedback';
import { todayIsoDate } from '@/lib/date';
import type { EmployeeFeedback } from '@/lib/supabase';

type RangePreset = 'today' | '7d' | '30d' | 'all';

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
];

const TYPE_OPTIONS: { value: FeedbackTypeFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'blocker', label: 'Что мешало' },
  { value: 'improvement', label: 'Что улучшить' },
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

export default function SupervisorFeedbackListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<EmployeeFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rangePreset, setRangePreset] = useState<RangePreset>('7d');
  const [feedbackType, setFeedbackType] = useState<FeedbackTypeFilter>('all');

  const filter: EmployeeFeedbackFilter = useMemo(() => {
    const { dateFrom, dateTo } = rangeToDates(rangePreset);
    return { dateFrom, dateTo, feedbackType };
  }, [rangePreset, feedbackType]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const rows = await getEmployeeFeedback(filter);
      setItems(rows);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить ответы сотрудников.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

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
            <Text style={[type.label, styles.headerLabel]}>ОТВЕТЫ СОТРУДНИКОВ</Text>
            <Text style={[type.h1, styles.headerTitle]}>Журнал обратной связи</Text>
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rangeChipsRow}
          style={styles.typeChipsScroll}
        >
          {TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, feedbackType === option.value && styles.chipActive]}
              onPress={() => setFeedbackType(option.value)}
            >
              <Text style={[styles.chipText, feedbackType === option.value && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerState}>
            <MessageSquareText size={22} color={colors.textTertiary} strokeWidth={1.6} />
            <Text style={[type.bodySmall, styles.emptyText]}>
              По выбранным фильтрам ответов не найдено.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const isBlocker = item.feedback_type === 'blocker';
              const Icon = isBlocker ? ShieldQuestion : Lightbulb;
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTypeRow}>
                    <View
                      style={[
                        styles.cardTypeBadge,
                        isBlocker ? styles.cardTypeBadgeBlocker : styles.cardTypeBadgeImprovement,
                      ]}
                    >
                      <Icon
                        size={12}
                        color={isBlocker ? colors.warning : colors.gold}
                        strokeWidth={1.8}
                      />
                      <Text
                        style={[
                          styles.cardTypeText,
                          isBlocker ? styles.cardTypeTextBlocker : styles.cardTypeTextImprovement,
                        ]}
                      >
                        {isBlocker ? 'Что мешало' : 'Что улучшить'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[type.body, styles.cardText]}>{item.feedback_text}</Text>
                  <View style={styles.cardMetaRow}>
                    <Text style={[type.caption, styles.cardMeta]} numberOfLines={1}>
                      {item.full_name} · {item.object_name}
                    </Text>
                    <Text style={[type.caption, styles.cardDate]}>
                      {formatDateTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
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
  typeChipsScroll: {
    flexGrow: 0,
    marginBottom: spacing.lg,
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
  cardTypeRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  cardTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  cardTypeBadgeBlocker: {
    backgroundColor: colors.warningMuted,
  },
  cardTypeBadgeImprovement: {
    backgroundColor: colors.goldMuted,
  },
  cardTypeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardTypeTextBlocker: {
    color: colors.warning,
  },
  cardTypeTextImprovement: {
    color: colors.gold,
  },
  cardText: {
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
});
