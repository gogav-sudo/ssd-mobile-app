import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';
import { useStartShift } from '@/context/StartShiftContext';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { uploadStartShiftPhoto } from '@/lib/shifts';
import { todayIsoDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';

export default function UploadingScreen() {
  const router = useRouter();
  const { data, setShiftId } = useStartShift();
  const { employee } = useEmployee();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, []);

  const run = async () => {
    setErrorMessage(null);
    try {
      if (!data.photoUri || !employee) throw new Error('Недостаточно данных для начала смены.');

      const deviceId = await getDeviceIdentityId();
      if (!deviceId) throw new Error('Не удалось определить устройство.');

      const publicUrl = await uploadStartShiftPhoto(deviceId, data.photoUri);

      const { data: inserted, error } = await supabase
        .from('shifts')
        .insert({
          telegram_chat_id: deviceId,
          full_name: employee.full_name,
          object_name: employee.object_name,
          start_time: new Date().toISOString(),
          start_photo_url: publicUrl,
          status: 'open',
          shift_date: todayIsoDate(),
        })
        .select()
        .single();

      if (error) throw error;

      setShiftId(inserted.id);
      router.replace('/employee/start-shift/uniform-check');
    } catch (err: any) {
      setErrorMessage(
        err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.'
      );
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {errorMessage ? (
            <>
              <View style={styles.iconWrap}>
                <AlertTriangle size={26} color={colors.error} strokeWidth={1.6} />
              </View>
              <Text style={[type.h2, styles.title]}>Ошибка</Text>
              <Text style={[type.bodySmall, styles.message]}>{errorMessage}</Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={[type.bodySmall, styles.loadingText]}>
                Загружаем фото и открываем смену…
              </Text>
            </>
          )}
        </View>

        {errorMessage ? (
          <View style={styles.footer}>
            <Button label="Повторить" onPress={run} />
            <View style={{ height: spacing.md }} />
            <Button
              label="Вернуться на главную"
              variant="secondary"
              onPress={() => router.replace('/employee')}
            />
          </View>
        ) : null}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
