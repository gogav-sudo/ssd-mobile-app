import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { CheckCircle2, MessageCircleQuestion } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { createResidentQuestion, getTodayResidentQuestions } from '@/lib/residentQuestions';
import type { ResidentQuestion } from '@/lib/supabase';

export default function EmployeeQuestionsScreen() {
  const { employee } = useEmployee();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [questions, setQuestions] = useState<ResidentQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = employee?.telegram_chat_id ?? (await getDeviceIdentityId());
      if (!deviceId) {
        setQuestions([]);
        return;
      }
      const rows = await getTodayResidentQuestions(deviceId);
      setQuestions(rows);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [loadToday])
  );

  const handleSave = async () => {
    const questionText = value.trim();
    if (!questionText || saving) return;

    setSaving(true);
    setErrorMessage(null);
    setJustSaved(false);
    try {
      const deviceId = employee?.telegram_chat_id ?? (await getDeviceIdentityId());
      if (!deviceId || !employee) {
        throw new Error('Не удалось определить сотрудника.');
      }

      const created = await createResidentQuestion({
        telegramChatId: deviceId,
        fullName: employee.full_name,
        objectName: employee.object_name,
        questionText,
      });

      setQuestions((current) => [created, ...current]);
      setValue('');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Не удалось сохранить вопрос. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={16}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={[type.label, styles.headerLabel]}>ВОПРОСЫ ЖИТЕЛЕЙ</Text>
              <Text style={[type.h1, styles.headerTitle]}>Что спросили?</Text>
              <Text style={[type.bodySmall, styles.headerSubtitle]}>
                Короткая запись вопроса жителя, гостя или курьера — без ответа и категории.
                Записывайте сразу после разговора или все вопросы одним списком в конце смены.
              </Text>
            </View>

            <Text style={[type.caption, styles.fieldLabel]}>КАКОЙ ВОПРОС ЗАДАЛИ?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Например: где находится ближайший шлагбаум для гостей?"
              placeholderTextColor={colors.textTertiary}
              value={value}
              onChangeText={setValue}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              selectionColor={colors.gold}
            />

            {errorMessage ? (
              <Text style={[type.caption, styles.errorText]}>{errorMessage}</Text>
            ) : null}

            <Button
              label="Записать"
              onPress={handleSave}
              disabled={!value.trim()}
              loading={saving}
            />

            {justSaved ? (
              <View style={styles.confirmRow}>
                <CheckCircle2 size={16} color={colors.success} strokeWidth={1.8} />
                <Text style={[type.caption, styles.confirmText]}>Вопрос записан</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <Text style={[type.caption, styles.sectionLabel]}>СЕГОДНЯ ЗАПИСАНО</Text>

            {loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={colors.gold} />
              </View>
            ) : questions.length === 0 ? (
              <View style={styles.emptyCard}>
                <MessageCircleQuestion size={20} color={colors.textTertiary} strokeWidth={1.6} />
                <Text style={[type.bodySmall, styles.emptyText]}>
                  Сегодня вы ещё не записали ни одного вопроса.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {questions.map((q) => (
                  <View key={q.id} style={styles.listRow}>
                    <Text style={[type.body, styles.listQuestion]}>{q.question_text}</Text>
                    <Text style={[type.caption, styles.listTime]}>
                      {formatTime(q.created_at)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    lineHeight: 19,
  },
  fieldLabel: {
    color: colors.gold,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing.md,
    minHeight: 110,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  confirmText: {
    color: colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xl,
  },
  sectionLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: spacing.md,
  },
  centerState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  list: {
    gap: spacing.sm,
  },
  listRow: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  listQuestion: {
    color: colors.textPrimary,
    lineHeight: 21,
    marginBottom: spacing.xs,
  },
  listTime: {
    color: colors.textTertiary,
  },
});
