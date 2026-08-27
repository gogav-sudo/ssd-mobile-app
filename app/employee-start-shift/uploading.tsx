import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
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

// Photo upload + shift insert is a WRITE, not a read — unlike raceWithTimeout
// (lib/withFallbackTimeout.ts), we cannot fall back to empty/null data on
// timeout: we don't know whether the storage upload or the insert actually
// landed. So on timeout we surface an explicit error and let the person
// retry, instead of silently continuing or guessing forward. Re-uploading
// is safe (upsert: true on the storage object), but a retry after a
// timed-out-but-actually-succeeded insert can leave a duplicate 'open' row
// for the day — acceptable trade-off vs. leaving the screen stuck forever.
const UPLOAD_TIMEOUT_MS = 60000;

export default function UploadingScreen() {
  const router = useRouter();
  const { data, setShiftId } = useStartShift();
  const { employee } = useEmployee();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Same idea as app/employee-onboarding/summary.tsx: tracks whether this
  // attempt has already been resolved (by the request finishing, or by the
  // force timer firing first) so whichever happens LAST is a no-op.
  const settledRef = useRef(false);
  const forceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // TEMP DIAGNOSTIC: tracks the last stage number ([1]-[6] below) reached by
  // run(), so the [TIMEOUT] log can report exactly where execution stalled.
  const lastStageRef = useRef(0);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, []);

  useEffect(() => {
    return () => {
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    };
  }, []);

  const run = async () => {
    console.log('[Uploading] run() starting.');
    setErrorMessage(null);
    settledRef.current = false;
    lastStageRef.current = 0;

    if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    forceTimerRef.current = setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      console.warn('[Uploading] Timed out after', UPLOAD_TIMEOUT_MS, 'ms - showing error.');
      console.log('[Uploading][TIMEOUT]', Date.now(), 'lastStage=', lastStageRef.current);
      setErrorMessage(
        'Загрузка занимает больше времени, чем ожидалось. Проверьте подключение и попробуйте снова.'
      );
    }, UPLOAD_TIMEOUT_MS);

    try {
      if (!data.photoUri || !employee) throw new Error('Недостаточно данных для начала смены.');

      console.log('[Uploading] Reading device_identity_id from AsyncStorage...');
      console.log('[Uploading][1] starting identity', Date.now());
      const deviceId = await getDeviceIdentityId();
      console.log('[Uploading] device_identity_id =', deviceId);
      console.log('[Uploading][2] identity ready', deviceId, Date.now());
      lastStageRef.current = 2;
      if (!deviceId) throw new Error('Не удалось определить устройство.');

      console.log('[Uploading] Uploading photo to Storage...');
      console.log('[Uploading][3] starting photo upload', Date.now());
      const publicUrl = await uploadStartShiftPhoto(deviceId, data.photoUri);
      console.log('[Uploading] Photo uploaded. publicUrl =', publicUrl);
      console.log('[Uploading][4] photo upload completed', publicUrl, Date.now());
      lastStageRef.current = 4;

      console.log('[Uploading] Inserting shift row...');
      console.log('[Uploading][5] starting shift insert', Date.now());
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
      console.log(
        '[Uploading] Insert settled. error=',
        error?.message ?? null,
        'shiftId=',
        inserted?.id ?? null
      );

      if (error) throw error;

      console.log('[Uploading][6] shift insert completed', Date.now());
      lastStageRef.current = 6;

      if (settledRef.current) {
        console.log('[Uploading] Already settled by timeout - ignoring result.');
        return;
      }
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);

      setShiftId(inserted.id);
      router.replace('/employee-start-shift/uniform-check');
    } catch (err: any) {
      console.warn('[Uploading] run() threw:', err?.message ?? err);
      console.log('[Uploading][ERROR]', Date.now(), 'lastStage=', lastStageRef.current, err);
      if (settledRef.current) return; // force timer already fired
      settledRef.current = true;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
      setErrorMessage(
        err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.'
      );
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
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
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between' },
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
