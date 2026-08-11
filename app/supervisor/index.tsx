import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AlertOctagon,
  ChevronRight,
  LogOut,
  MessageCircleQuestion,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { getDashboardStats, DashboardStats } from '@/lib/supervisorData';

export default function SupervisorOverviewScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExit = () => {
    router.replace('/');
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить данные.');
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

  const todayLabel = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScreenBackground webMaxWidth={1000}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.gold}
            />
          }
        >
          <View style={styles.header}>
            <Text style={[type.label, styles.headerLabel]}>ОБЗОР · СЕГОДНЯ</Text>
            <Text style={[type.h1, styles.headerTitle]}>Сводка по объектам</Text>
            <Text style={[type.caption, styles.headerDate]}>{capitalize(todayLabel)}</Text>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : errorMessage ? (
            <View style={styles.centerState}>
              <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardGold]}>
                <View style={styles.statIconWrap}>
                  <ShieldCheck size={20} color={colors.gold} strokeWidth={1.6} />
                </View>
                <Text style={[type.h1, styles.statValue]}>{stats?.openShiftsToday ?? 0}</Text>
                <Text style={[type.caption, styles.statLabel]}>ОТКРЫТЫХ СМЕН СЕЙЧАС</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, styles.statIconWrapWarning]}>
                  <AlertOctagon size={20} color={colors.warning} strokeWidth={1.6} />
                </View>
                <Text style={[type.h1, styles.statValue]}>{stats?.newIncidents ?? 0}</Text>
                <Text style={[type.caption, styles.statLabel]}>НОВЫХ ИНЦИДЕНТОВ</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, styles.statIconWrapError]}>
                  <ShieldAlert size={20} color={colors.error} strokeWidth={1.6} />
                </View>
                <Text style={[type.h1, styles.statValue]}>{stats?.highUrgencyToday ?? 0}</Text>
                <Text style={[type.caption, styles.statLabel]}>ВЫСОКИЙ ПРИОРИТЕТ СЕГОДНЯ</Text>
              </View>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
            onPress={() => router.push('/supervisor/questions')}
          >
            <View style={[styles.statIconWrap, styles.statIconWrapGoldSmall]}>
              <MessageCircleQuestion size={18} color={colors.gold} strokeWidth={1.6} />
            </View>
            <View style={styles.linkCardTextWrap}>
              <Text style={[type.bodySmall, styles.linkCardTitle]}>Вопросы жителей</Text>
              <Text style={[type.caption, styles.linkCardSubtitle]}>
                {loading ? 'Загрузка…' : `${stats?.residentQuestionsToday ?? 0} за сегодня`}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.exitButton, pressed && styles.exitButtonPressed]}
            onPress={handleExit}
          >
            <LogOut size={16} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={[type.button, styles.exitLabel]}>Выйти из режима руководителя</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
    marginBottom: spacing.xs,
  },
  headerDate: {
    color: colors.textSecondary,
  },
  centerState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  statsGrid: {
    gap: spacing.md,
  },
  statCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  statCardGold: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    marginBottom: spacing.md,
  },
  statIconWrapWarning: {
    backgroundColor: colors.warningMuted,
  },
  statIconWrapError: {
    backgroundColor: colors.errorMuted,
  },
  statIconWrapGoldSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 0,
    backgroundColor: colors.goldMuted,
  },
  linkCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  linkCardPressed: {
    opacity: 0.75,
  },
  linkCardTextWrap: {
    flex: 1,
  },
  linkCardTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkCardSubtitle: {
    color: colors.textTertiary,
  },
  statValue: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontSize: 36,
  },
  statLabel: {
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  exitButtonPressed: {
    opacity: 0.75,
  },
  exitLabel: {
    color: colors.textSecondary,
  },
});
