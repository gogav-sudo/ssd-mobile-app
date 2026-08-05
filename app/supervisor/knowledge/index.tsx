import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ChevronRight,
  ClipboardCheck,
  Handshake,
  MessageCircleQuestion,
  ShieldAlert,
  ShieldOff,
  Truck,
  UserCheck,
  Wrench,
} from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { KNOWLEDGE_TOPICS } from '@/lib/knowledgeBase';
import { getRecentKbQueries, KbQuery } from '@/lib/kbQueries';

const TOPIC_ICONS: Record<string, typeof ClipboardCheck> = {
  shift: ClipboardCheck,
  'service-standards': Handshake,
  visitors: UserCheck,
  'parcels-requests': Truck,
  workplace: Wrench,
  security: ShieldAlert,
  restrictions: ShieldOff,
  equipment: Wrench,
};

const STATUS_LABELS: Record<string, string> = {
  matched: 'Найдено',
  ambiguous: 'Неоднозначно',
  no_match: 'Не найдено',
};

export default function SupervisorKnowledgeScreen() {
  const router = useRouter();
  const [queries, setQueries] = useState<KbQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      const rows = await getRecentKbQueries(30);
      setQueries(rows);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить запросы.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
          }
        >
          <View style={styles.header}>
            <Text style={[type.label, styles.headerLabel]}>БАЗА ЗНАНИЙ</Text>
            <Text style={[type.h1, styles.headerTitle]}>Обзор и запросы</Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <MessageCircleQuestion size={16} color={colors.gold} strokeWidth={1.8} />
            <Text style={[type.caption, styles.sectionLabel]}>ЗАПРОСЫ СОТРУДНИКОВ</Text>
          </View>

          {loading ? (
            <View style={styles.centerStateSmall}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : errorMessage ? (
            <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
          ) : queries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[type.bodySmall, styles.emptyText]}>
                Пока никто не задавал вопросов через базу знаний.
              </Text>
            </View>
          ) : (
            <View style={styles.queryList}>
              {queries.map((q) => (
                <View key={q.id} style={styles.queryCard}>
                  <View style={styles.queryTopRow}>
                    <Text style={[type.bodySmall, styles.queryName]} numberOfLines={1}>
                      {q.full_name ?? 'Неизвестный сотрудник'}
                    </Text>
                    <Text style={[type.caption, styles.queryDate]}>
                      {formatDateTime(q.created_at)}
                    </Text>
                  </View>
                  <Text style={[type.body, styles.queryText]}>{q.question}</Text>
                  <View style={styles.queryBottomRow}>
                    <View
                      style={[
                        styles.matchBadge,
                        q.status === 'matched'
                          ? styles.matchBadgeMatched
                          : q.status === 'ambiguous'
                            ? styles.matchBadgeAmbiguous
                            : styles.matchBadgeNoMatch,
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchBadgeText,
                          q.status === 'matched'
                            ? styles.matchBadgeTextMatched
                            : q.status === 'ambiguous'
                              ? styles.matchBadgeTextAmbiguous
                              : styles.matchBadgeTextNoMatch,
                        ]}
                      >
                        {STATUS_LABELS[q.status ?? ''] ?? 'Не найдено'}
                      </Text>
                    </View>
                    <Text style={[type.caption, styles.matchTitle]} numberOfLines={1}>
                      {q.matched_title ?? 'Не найдено'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={[type.caption, styles.sectionLabel, styles.categoriesLabel]}>
            РАЗДЕЛЫ БАЗЫ ЗНАНИЙ
          </Text>

          <View style={styles.list}>
            {KNOWLEDGE_TOPICS.map((topic) => {
              const Icon = TOPIC_ICONS[topic.slug] ?? ClipboardCheck;
              return (
                <Pressable
                  key={topic.slug}
                  style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                  onPress={() => router.push(`/supervisor/knowledge/${topic.slug}`)}
                >
                  <View style={styles.optionIcon}>
                    <Icon size={18} color={colors.gold} strokeWidth={1.6} />
                  </View>
                  <Text style={[type.body, styles.optionLabel]}>{topic.label}</Text>
                  <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
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
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.4,
  },
  categoriesLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  centerStateSmall: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  queryList: {
    gap: spacing.sm,
  },
  queryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  queryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  queryName: {
    color: colors.gold,
    fontWeight: '600',
    flex: 1,
  },
  queryDate: {
    color: colors.textTertiary,
  },
  queryText: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  queryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchBadge: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
  },
  matchBadgeMatched: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  matchBadgeAmbiguous: {
    backgroundColor: colors.warningMuted,
    borderColor: colors.warning,
  },
  matchBadgeNoMatch: {
    backgroundColor: colors.errorMuted,
    borderColor: colors.error,
  },
  matchBadgeText: {
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  matchBadgeTextMatched: {
    color: colors.success,
  },
  matchBadgeTextAmbiguous: {
    color: colors.warning,
  },
  matchBadgeTextNoMatch: {
    color: colors.error,
  },
  matchTitle: {
    color: colors.textTertiary,
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  optionCard: {
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
  optionCardPressed: {
    opacity: 0.75,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldMuted,
  },
  optionLabel: {
    flex: 1,
    color: colors.textPrimary,
  },
});
