import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, FileText, SearchX } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { searchKnowledgeBase, SearchCandidate } from '@/lib/knowledgeBase';
import { useEmployee } from '@/context/EmployeeContext';

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'candidates'; candidates: SearchCandidate[] }
  | { status: 'no_match' };

export default function KnowledgeSearchResultsScreen() {
  const router = useRouter();
  const { employee } = useEmployee();
  const { q } = useLocalSearchParams<{ q: string }>();
  const question = q ?? '';
  const [state, setState] = useState<ViewState>({ status: 'loading' });

  const run = useCallback(async () => {
    if (!question) {
      setState({ status: 'no_match' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const result = await searchKnowledgeBase(question, {
        telegramChatId: employee?.telegram_chat_id,
        fullName: employee?.full_name,
      });
      if (result.result === 'match') {
        router.replace(`/employee/knowledge/article/${result.article.id}?from=search`);
        return;
      }
      if (result.result === 'candidates' && result.candidates.length > 0) {
        setState({ status: 'candidates', candidates: result.candidates });
        return;
      }
      setState({ status: 'no_match' });
    } catch (err: any) {
      setState({
        status: 'error',
        message: err?.message ?? 'Не удалось выполнить поиск. Попробуйте снова.',
      });
    }
  }, [question, router, employee]);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run])
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
          <Text style={[type.caption, styles.questionLabel]}>ВОПРОС</Text>
          <Text style={[type.h2, styles.questionTitle]}>{question}</Text>
        </View>

        {state.status === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={[type.bodySmall, styles.loadingText]}>Ищем ответ…</Text>
          </View>
        ) : state.status === 'error' ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>{state.message}</Text>
            <View style={{ height: spacing.lg }} />
            <Button label="Повторить" onPress={run} />
          </View>
        ) : state.status === 'candidates' ? (
          <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <Text style={[type.bodySmall, styles.hintText]}>
              Похоже, подходит несколько статей — выберите нужную:
            </Text>
            {state.candidates.map((candidate) => (
              <Pressable
                key={candidate.id}
                style={({ pressed }) => [
                  styles.optionCard,
                  pressed && styles.optionCardPressed,
                ]}
                onPress={() =>
                  router.push(`/employee/knowledge/article/${candidate.id}?from=search`)
                }
              >
                <View style={styles.optionIcon}>
                  <FileText size={16} color={colors.gold} strokeWidth={1.6} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[type.body, styles.optionLabel]}>{candidate.title}</Text>
                  <Text style={[type.caption, styles.optionCategory]}>{candidate.category}</Text>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.centerState}>
            <View style={styles.emptyIconWrap}>
              <SearchX size={24} color={colors.textTertiary} strokeWidth={1.6} />
            </View>
            <Text style={[type.body, styles.noMatchTitle]}>
              К сожалению, ответа на этот вопрос нет в базе знаний.
            </Text>
            <Text style={[type.bodySmall, styles.noMatchSubtitle]}>Обратитесь к руководителю.</Text>
            <View style={{ height: spacing.xl }} />
            <Button
              label="Сообщить о проблеме"
              onPress={() => router.replace('/employee/report')}
            />
          </View>
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
  questionLabel: {
    color: colors.gold,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  questionTitle: {
    color: colors.textPrimary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  hintText: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionCategory: {
    color: colors.textTertiary,
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
  noMatchTitle: {
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  noMatchSubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
