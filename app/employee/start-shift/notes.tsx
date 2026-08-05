import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { Button } from '@/components/ui/Button';
import { useStartShift } from '@/context/StartShiftContext';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, type } from '@/theme';

export default function NotesScreen() {
  const router = useRouter();
  const { data, setNotes } = useStartShift();
  const [value, setValue] = useState(data.notes);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finalize = async (notes: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (!data.shiftId) throw new Error('Смена не найдена. Попробуйте начать заново.');

      const { error } = await supabase
        .from('shifts')
        .update({
          start_uniform_ok: data.uniformOk,
          start_equipment_ok: data.equipmentOk,
          start_notes: notes || null,
        })
        .eq('id', data.shiftId);

      if (error) throw error;

      setNotes(notes);
      router.replace('/employee/start-shift/success');
    } catch (err: any) {
      setErrorMessage(
        err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WizardLayout
      step={6}
      totalSteps={6}
      eyebrow="НАЧАЛО СМЕНЫ"
      question="Есть замечания по смене?"
      footer={
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
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        </View>
      }
    >
      <TextInput
        style={styles.textArea}
        placeholder="Опишите замечания, если они есть"
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={setValue}
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
