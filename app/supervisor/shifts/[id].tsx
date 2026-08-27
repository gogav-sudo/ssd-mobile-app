import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, ImageOff, XCircle } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { getShiftById } from '@/lib/supervisorData';
import type { Shift } from '@/lib/supabase';

export default function SupervisorShiftDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!numericId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const row = await getShiftById(numericId);
      setShift(row);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить смену.');
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
        ) : errorMessage || !shift ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>
              {errorMessage ?? 'Смена не найдена.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text style={[type.label, styles.headerLabel]}>СМЕНА №{shift.id}</Text>
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

            <Text style={[type.h1, styles.title]}>{shift.full_name}</Text>
            <Text style={[type.bodySmall, styles.subtitle]}>{shift.object_name}</Text>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={[type.caption, styles.rowLabel]}>ДАТА СМЕНЫ</Text>
                <Text style={[type.body, styles.rowValue]}>{formatDate(shift.shift_date)}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[type.caption, styles.rowLabel]}>НАЧАЛО</Text>
                <Text style={[type.body, styles.rowValue]}>{formatTime(shift.start_time)}</Text>
              </View>
              <View style={[styles.cardRow, styles.rowLast]}>
                <Text style={[type.caption, styles.rowLabel]}>ЗАВЕРШЕНИЕ</Text>
                <Text style={[type.body, styles.rowValue]}>{formatTime(shift.end_time)}</Text>
              </View>
            </View>

            <Text style={[type.caption, styles.sectionLabel]}>НАЧАЛО СМЕНЫ</Text>

            {shift.start_photo_url ? (
              <Image source={{ uri: shift.start_photo_url }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <ImageOff size={22} color={colors.textTertiary} strokeWidth={1.6} />
                <Text style={[type.caption, styles.photoPlaceholderText]}>Фото не загружено</Text>
              </View>
            )}

            <View style={styles.checksRow}>
              <ChecklistBadge label="Форма в порядке" value={shift.start_uniform_ok} />
              <ChecklistBadge label="Оборудование в порядке" value={shift.start_equipment_ok} />
            </View>

            {shift.start_notes ? (
              <View style={styles.notesCard}>
                <Text style={[type.caption, styles.notesLabel]}>ЗАМЕТКИ ПРИ НАЧАЛЕ</Text>
                <Text style={[type.bodySmall, styles.notesText]}>{shift.start_notes}</Text>
              </View>
            ) : null}

            <Text style={[type.caption, styles.sectionLabel]}>ЗАВЕРШЕНИЕ СМЕНЫ</Text>

            {shift.status === 'closed' ? (
              <>
                <View style={styles.checksRow}>
                  <ChecklistBadge
                    label="Оборудование в порядке"
                    value={shift.end_equipment_ok}
                  />
                </View>
                {shift.end_notes ? (
                  <View style={styles.notesCard}>
                    <Text style={[type.caption, styles.notesLabel]}>ЗАМЕТКИ ПРИ ЗАВЕРШЕНИИ</Text>
                    <Text style={[type.bodySmall, styles.notesText]}>{shift.end_notes}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.openNotice}>
                <Text style={[type.bodySmall, styles.openNoticeText]}>
                  Смена ещё не завершена.
                </Text>
              </View>
            )}

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

function ChecklistBadge({ label, value }: { label: string; value: boolean | null }) {
  const isOk = value === true;
  const isBad = value === false;
  return (
    <View
      style={[
        checklistStyles.badge,
        isOk && checklistStyles.badgeOk,
        isBad && checklistStyles.badgeBad,
      ]}
    >
      {isOk ? (
        <CheckCircle2 size={14} color={colors.success} strokeWidth={1.8} />
      ) : isBad ? (
        <XCircle size={14} color={colors.error} strokeWidth={1.8} />
      ) : null}
      <Text
        style={[
          checklistStyles.badgeText,
          isOk && checklistStyles.badgeTextOk,
          isBad && checklistStyles.badgeTextBad,
        ]}
      >
        {label}
        {value === null ? ' — нет данных' : ''}
      </Text>
    </View>
  );
}

const checklistStyles = StyleSheet.create({
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  badgeOk: {
    borderColor: colors.success,
    backgroundColor: colors.successMuted,
  },
  badgeBad: {
    borderColor: colors.error,
    backgroundColor: colors.errorMuted,
  },
  badgeText: {
    fontSize: 12,
    color: colors.textTertiary,
    flexShrink: 1,
  },
  badgeTextOk: {
    color: colors.success,
  },
  badgeTextBad: {
    color: colors.error,
  },
});

function formatDate(isoDate: string): string {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
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
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLabel: {
    color: colors.textTertiary,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    color: colors.gold,
    letterSpacing: 1.2,
  },
  rowValue: {
    color: colors.textPrimary,
  },
  sectionLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: spacing.md,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  photoPlaceholder: {
    height: 140,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  photoPlaceholderText: {
    color: colors.textTertiary,
  },
  checksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  notesCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  notesLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  notesText: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  openNotice: {
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  openNoticeText: {
    color: colors.gold,
    textAlign: 'center',
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
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
