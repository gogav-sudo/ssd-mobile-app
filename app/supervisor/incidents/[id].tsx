import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import {
  getIncidentById,
  updateIncidentStatus,
  IncidentStatus,
  INCIDENT_STATUS_LABELS,
} from '@/lib/incidentsData';
import type { Incident } from '@/lib/supabase';

const STATUS_ORDER: IncidentStatus[] = ['new', 'in_progress', 'resolved'];

function urgencyColor(urgency: string): { fg: string; bg: string; border: string } {
  if (urgency === 'Высокая') return { fg: colors.error, bg: colors.errorMuted, border: colors.error };
  if (urgency === 'Средняя') return { fg: colors.warning, bg: colors.warningMuted, border: colors.warning };
  return { fg: colors.success, bg: colors.successMuted, border: colors.success };
}

export default function SupervisorIncidentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!numericId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const row = await getIncidentById(numericId);
      setIncident(row);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось загрузить инцидент.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleStatusChange = async (status: IncidentStatus) => {
    if (!incident || updating || incident.status === status) return;
    setUpdating(true);
    try {
      await updateIncidentStatus(incident.id, status);
      setIncident({ ...incident, status });
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось обновить статус.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : errorMessage && !incident ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>{errorMessage}</Text>
          </View>
        ) : !incident ? (
          <View style={styles.centerState}>
            <Text style={[type.bodySmall, styles.errorText]}>Инцидент не найден.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={[type.label, styles.headerLabel]}>ИНЦИДЕНТ №{incident.id}</Text>
              <View
                style={[
                  styles.urgencyBadge,
                  {
                    backgroundColor: urgencyColor(incident.urgency).bg,
                    borderColor: urgencyColor(incident.urgency).border,
                  },
                ]}
              >
                <Text style={[styles.urgencyBadgeText, { color: urgencyColor(incident.urgency).fg }]}>
                  {incident.urgency.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[type.h1, styles.title]}>{incident.incident_type}</Text>
            <Text style={[type.bodySmall, styles.subtitle]}>
              {incident.full_name} · {incident.object_name}
            </Text>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={[type.caption, styles.rowLabel]}>ДАТА СМЕНЫ</Text>
                <Text style={[type.body, styles.rowValue]}>{formatDate(incident.shift_date)}</Text>
              </View>
              <View style={[styles.cardRow, styles.rowLast]}>
                <Text style={[type.caption, styles.rowLabel]}>ЗАРЕГИСТРИРОВАН</Text>
                <Text style={[type.body, styles.rowValue]}>{formatDateTime(incident.created_at)}</Text>
              </View>
            </View>

            <Text style={[type.caption, styles.sectionLabel]}>ОПИСАНИЕ</Text>
            <View style={styles.descriptionCard}>
              <Text style={[type.body, styles.descriptionText]}>{incident.description}</Text>
            </View>

            <Text style={[type.caption, styles.sectionLabel]}>ФОТО</Text>
            {incident.photo_url ? (
              <Image source={{ uri: incident.photo_url }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <ImageOff size={22} color={colors.textTertiary} strokeWidth={1.6} />
                <Text style={[type.caption, styles.photoPlaceholderText]}>Фото не приложено</Text>
              </View>
            )}

            <Text style={[type.caption, styles.sectionLabel]}>СТАТУС</Text>
            <View style={styles.statusOptions}>
              {STATUS_ORDER.map((statusValue) => {
                const isActive = incident.status === statusValue;
                return (
                  <Pressable
                    key={statusValue}
                    style={[
                      styles.statusOption,
                      isActive && styles.statusOptionActive,
                    ]}
                    onPress={() => handleStatusChange(statusValue)}
                    disabled={updating}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        isActive && styles.statusOptionTextActive,
                      ]}
                    >
                      {INCIDENT_STATUS_LABELS[statusValue]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {errorMessage ? (
              <Text style={[type.caption, styles.updateError]}>{errorMessage}</Text>
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

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
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
  descriptionCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  descriptionText: {
    color: colors.textPrimary,
    lineHeight: 22,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  photoPlaceholderText: {
    color: colors.textTertiary,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statusOptionActive: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  statusOptionTextActive: {
    color: colors.gold,
  },
  updateError: {
    color: colors.error,
    marginTop: spacing.sm,
  },
  urgencyBadge: {
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  urgencyBadgeText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
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
