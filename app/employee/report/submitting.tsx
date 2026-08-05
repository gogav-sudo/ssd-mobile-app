import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, spacing, type } from '@/theme';
import { useReportProblem } from '@/context/ReportProblemContext';
import { useEmployee } from '@/context/EmployeeContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { uploadIncidentPhoto, createIncident } from '@/lib/incidents';

export default function ReportSubmittingScreen() {
  const router = useRouter();
  const { data } = useReportProblem();
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
      if (!employee) throw new Error('Не удалось определить сотрудника.');
      if (!data.incidentType || !data.description || !data.urgency) {
        throw new Error('Недостаточно данных для отправки. Попробуйте начать заново.');
      }

      const deviceId = await getDeviceIdentityId();
      if (!deviceId) throw new Error('Не удалось определить устройство.');

      let photoUrl: string | null = null;
      if (data.wantsPhoto && data.photoUri) {
        photoUrl = await uploadIncidentPhoto(deviceId, data.photoUri);
      }

      await createIncident({
        telegramChatId: deviceId,
        fullName: employee.full_name,
        objectName: employee.object_name,
        description: data.description,
        incidentType: data.incidentType,
        urgency: data.urgency,
        photoUrl,
      });

      router.replace('/employee/report/success');
    } catch (err: any) {
      setErrorMessage(
        err?.message ?? 'Не удалось отправить данные. Проверьте подключение и попробуйте снова.'
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
              <Text style={[type.bodySmall, styles.loadingText]}>Отправляем данные…</Text>
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
              onPress={() => {
                router.replace('/employee/report');
                setTimeout(() => router.replace('/employee'), 0);
              }}
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
