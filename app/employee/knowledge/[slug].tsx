import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookX, ChevronRight, FileText } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { getTopicBySlug, getArticlesForTopic } from '@/lib/knowledgeBase';
import type { KnowledgeBaseEntry } from '@/lib/supabase';

export default function KnowledgeTopicScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const topic = getTopicBySlug(slug ?? '');
  const [articles, setArticles] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!topic) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const rows = await getArticlesForTopic(topic);
      setArticles(rows);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить статьи.');
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <ArrowLeft size={18} color={colors.textSecondary} strokeWidth={1.8} />
          </Pressable>
          <Text style={[type.label, styles.topLabel]}>БАЗА ЗНАНИЙ</Text>
        </View>

        <View style={styles.header}>
          <Text style={[type.h2, styles.headerTitle]}>{topic?.label ?? 'Раздел'}</Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIconWrap}>
              <BookX size={24} color={colors.textTertiary} strokeWidth={1.6} />
            </View>
            <Text style={[type.bodySmall, styles.emptyText]}>
              В этом разделе пока нет статей
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {articles.map((article) => (
              <Pressable
                key={article.id}
                style={({ pressed }) => [
                  styles.optionCard,
                  pressed && styles.optionCardPressed,
                ]}
                onPress={() => router.push(`/employee/knowledge/article/${article.id}`)}
              >
                <View style={styles.optionIcon}>
                  <FileText size={16} color={colors.gold} strokeWidth={1.6} />
                </View>
                <Text style={[type.body, styles.optionLabel]}>{article.title}</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  topLabel: {
    color: colors.textTertiary,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  headerTitle: {
    color: colors.textPrimary,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldMuted,
  },
  optionLabel: {
    flex: 1,
    color: colors.textPrimary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});
