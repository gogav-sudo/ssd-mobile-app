import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { getArticleById } from '@/lib/knowledgeBase';
import type { KnowledgeBaseEntry } from '@/lib/supabase';

export default function KnowledgeArticleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<KnowledgeBaseEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!numericId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const row = await getArticleById(numericId);
      setArticle(row);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить статью.');
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
        ) : errorMessage || !article ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>
              {errorMessage ?? 'Статья не найдена.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[type.label, styles.category]}>{article.category.toUpperCase()}</Text>
            <Text style={[type.h1, styles.title]}>{article.title}</Text>

            {article.question ? (
              <View style={styles.questionCard}>
                <Text style={[type.bodySmall, styles.questionText]}>{article.question}</Text>
              </View>
            ) : null}

            <View style={styles.answerBlock}>
              <Text style={[type.caption, styles.blockLabel]}>ОТВЕТ</Text>
              <Text style={[type.body, styles.answerText]}>{article.answer}</Text>
            </View>

            {article.forbidden ? (
              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <AlertTriangle size={16} color={colors.warning} strokeWidth={1.8} />
                  <Text style={[type.caption, styles.warningLabel]}>ЗАПРЕЩЕНО</Text>
                </View>
                <Text style={[type.bodySmall, styles.warningText]}>{article.forbidden}</Text>
              </View>
            ) : null}

            {article.example_good ? (
              <View style={styles.exampleCard}>
                <View style={styles.exampleHeader}>
                  <CheckCircle2 size={16} color={colors.success} strokeWidth={1.8} />
                  <Text style={[type.caption, styles.exampleGoodLabel]}>ПРАВИЛЬНО</Text>
                </View>
                <Text style={[type.bodySmall, styles.exampleText]}>{article.example_good}</Text>
              </View>
            ) : null}

            {article.example_bad ? (
              <View style={styles.exampleCard}>
                <View style={styles.exampleHeader}>
                  <XCircle size={16} color={colors.error} strokeWidth={1.8} />
                  <Text style={[type.caption, styles.exampleBadLabel]}>НЕПРАВИЛЬНО</Text>
                </View>
                <Text style={[type.bodySmall, styles.exampleText]}>{article.example_bad}</Text>
              </View>
            ) : null}

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
  category: {
    color: colors.gold,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  questionText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  answerBlock: {
    marginBottom: spacing.lg,
  },
  blockLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  answerText: {
    color: colors.textPrimary,
    lineHeight: 24,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  warningLabel: {
    color: colors.warning,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  warningText: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  exampleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  exampleGoodLabel: {
    color: colors.success,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  exampleBadLabel: {
    color: colors.error,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  exampleText: {
    color: colors.textSecondary,
    lineHeight: 20,
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
