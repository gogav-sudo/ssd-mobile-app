import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { Button } from '@/components/ui/Button';
import { useStartShift } from '@/context/StartShiftContext';
import { supabaseDirect } from '@/lib/supabase';
import { getShiftByIdDirect, logShiftWriteOutcome } from '@/lib/shifts';
import { colors, radius, spacing, type } from '@/theme';

// This covers the WHOLE update + confirmation-read sequence (both now via
// supabaseDirect), not just the update — 60s, matching the same budget given
// to ensureOpenShift, since the underlying ssd-api.ru-bypass network calls
// can occasionally take much longer than a "normal" 8s read (confirmed via
// live testing: the proxy has, separately, taken 2+ minutes on a plain GET).
// On timeout we surface an explicit error and let the person retry rather
// than silently continuing — we don't know whether the update actually landed.
const SAVE_TIMEOUT_MS = 60000;

export default function NotesScreen() {
  const router = useRouter();
  const { data, setNotes } = useStartShift();
  const [value, setValue] = useState(data.notes);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The exact text of the last (possibly failed) save attempt — "Повторить
  // сохранение" always resubmits this, never a silently-emptied value.
  const [lastAttemptedNotes, setLastAttemptedNotes] = useState<string | null>(null);

  // Tracks whether this attempt has already been resolved (by the request
  // finishing, or by the force timer firing first) so whichever happens LAST
  // is a no-op.
  const settledRef = useRef(false);
  const forceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    };
  }, []);

  const finalize = async (notes: string) => {
    if (submitting) return; // guard against parallel/double-tap invocations
    setSubmitting(true);
    setErrorMessage(null);
    setLastAttemptedNotes(notes);
    settledRef.current = false;
    const startedAt = Date.now();

    if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    forceTimerRef.current = setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      setSubmitting(false);
      // A network-level timeout at the screen's own force-timer — never
      // conflate this with a server-reported failure.
      logShiftWriteOutcome({
        operation: 'start-notes-finalize',
        elapsedMs: Date.now() - startedAt,
        outcome: 'timeout',
        shiftId: data.shiftId,
      });
      setErrorMessage(
        'Сохранение занимает больше времени, чем ожидалось. Проверьте подключение и попробуйте снова.'
      );
    }, SAVE_TIMEOUT_MS);

    try {
      if (!data.shiftId) throw new Error('Смена не найдена. Попробуйте начать заново.');

      const normalizedNotes = notes || null;
      const { error } = await supabaseDirect
        .from('shifts')
        .update({
          start_uniform_ok: data.uniformOk,
          start_equipment_ok: data.equipmentOk,
          start_notes: normalizedNotes,
        })
        .eq('id', data.shiftId);

      if (error) throw error;

      // Don't trust the update's own { error: null } response alone — read
      // the row back (via supabaseDirect, same as the update) and confirm it
      // actually reflects what was just written before ever showing success.
      const confirmation = await getShiftByIdDirect(data.shiftId);

      if (settledRef.current) return; // force timer already showed the error
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);

      if (confirmation.status === 'unknown') {
        setSubmitting(false);
        logShiftWriteOutcome({
          operation: 'start-notes-finalize',
          elapsedMs: Date.now() - startedAt,
          outcome: 'network-error',
          shiftId: data.shiftId,
          message: 'confirmation read did not resolve',
        });
        setErrorMessage('Не удалось подтвердить сохранение. Проверьте подключение и повторите.');
        return;
      }
      if (confirmation.status === 'not_found' || confirmation.shift.start_notes !== normalizedNotes) {
        setSubmitting(false);
        logShiftWriteOutcome({
          operation: 'start-notes-finalize',
          elapsedMs: Date.now() - startedAt,
          outcome: 'supabase-error',
          shiftId: data.shiftId,
          message: `confirmation mismatch (status=${confirmation.status})`,
        });
        setErrorMessage('Не удалось подтвердить сохранение. Попробуйте снова.');
        return;
      }

      logShiftWriteOutcome({
        operation: 'start-notes-finalize',
        elapsedMs: Date.now() - startedAt,
        outcome: 'success',
        shiftId: data.shiftId,
      });
      setNotes(notes);
      setSubmitting(false);
      router.replace('/employee-start-shift/success');
    } catch (err: any) {
      if (settledRef.current) return; // force timer already fired
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
      setSubmitting(false);
      logShiftWriteOutcome({
        operation: 'start-notes-finalize',
        elapsedMs: Date.now() - startedAt,
        outcome: 'network-error',
        shiftId: data.shiftId,
        message: err?.message ?? String(err),
      });
      setErrorMessage(
        err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.'
      );
    }
  };

  const handleRetry = () => {
    if (lastAttemptedNotes !== null) finalize(lastAttemptedNotes);
  };

  const handleChangeText = (text: string) => {
    setValue(text);
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <WizardLayout
      step={6}
      totalSteps={6}
      eyebrow="НАЧАЛО СМЕНЫ"
      question="Есть замечания по смене?"
      footer={
        errorMessage ? (
          <View>
            <Text style={styles.error}>{errorMessage}</Text>
            <View style={{ height: spacing.md }} />
            <Button label="Повторить сохранение" onPress={handleRetry} loading={submitting} disabled={submitting} />
            <View style={{ height: spacing.md }} />
            <Button
              label="Назад"
              variant="secondary"
              onPress={() => router.back()}
              disabled={submitting}
            />
          </View>
        ) : (
          <View>
            <Button
              label="Сохранить"
              onPress={() => finalize(value.trim())}
              loading={submitting}
              disabled={!value.trim()}
            />
            <View style={{ height: spacing.md }} />
            <Button
              label="Пропустить"
              variant="secondary"
              onPress={() => finalize('')}
              disabled={submitting}
            />
          </View>
        )
      }
    >
      <TextInput
        style={styles.textArea}
        placeholder="Опишите замечания, если они есть"
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={handleChangeText}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        selectionColor={colors.gold}
      />
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing.md,
    minHeight: 140,
    fontSize: 16,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
