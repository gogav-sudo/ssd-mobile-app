import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, RotateCcw } from 'lucide-react-native';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { Button } from '@/components/ui/Button';
import { useStartShift } from '@/context/StartShiftContext';
import { getDeviceIdentityId } from '@/lib/deviceIdentity';
import { uploadStartShiftPhoto } from '@/lib/shifts';
import { colors, radius, spacing, type } from '@/theme';

// Same independent-timer pattern as app/employee-start-shift/uploading.tsx:
// on some networks/devices the upload's fetch/arrayBuffer/storage-upload
// chain can stall below the fetch layer and never resolve or reject at all,
// which would otherwise leave photoUploadState stuck on 'uploading' forever
// (confirmed via read-only audit: no AbortController/timeout previously
// guarded this step). This does NOT cancel the underlying upload — it only
// stops the SCREEN from waiting on it forever; a late result is discarded
// via the token/timedOut guards in startUpload below.
const UPLOAD_TIMEOUT_MS = 60000;

export default function StartShiftPhotoScreen() {
  const router = useRouter();
  const { data, setPhotoUri, setPhotoUploadState, setPhotoUpload } = useStartShift();
  const [busy, setBusy] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);

  // Guards against a stale upload (for a photo the user has since replaced,
  // or an earlier retry) applying its result after a newer one has started —
  // whichever upload's token no longer matches is ignored on completion.
  const uploadTokenRef = useRef(0);
  const forceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    };
  }, []);

  const startUpload = async (uri: string) => {
    const token = ++uploadTokenRef.current;
    // Local to this attempt (not the shared token) — distinguishes "the
    // force timer already gave up on THIS attempt" from "a newer attempt
    // started", since a retry always bumps the token but a same-attempt
    // late settle after timeout does not.
    let timedOut = false;
    setUploadErrorMessage(null);
    setPhotoUploadState('uploading');

    if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    forceTimerRef.current = setTimeout(() => {
      if (uploadTokenRef.current !== token) return; // superseded by a newer attempt
      timedOut = true;
      setPhotoUploadState('error');
      setUploadErrorMessage(
        'Не удалось загрузить фото. Проверьте подключение и попробуйте снова.'
      );
    }, UPLOAD_TIMEOUT_MS);

    try {
      const deviceId = await getDeviceIdentityId();
      if (!deviceId) throw new Error('Не удалось определить устройство.');
      const result = await uploadStartShiftPhoto(deviceId, uri);
      if (uploadTokenRef.current !== token || timedOut) return; // superseded or already timed out
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
      setPhotoUpload(result.objectPath, result.publicUrl);
    } catch (err: any) {
      if (uploadTokenRef.current !== token || timedOut) return;
      if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
      setPhotoUploadState('error');
      setUploadErrorMessage(
        err?.message ?? 'Не удалось загрузить фото. Проверьте подключение и попробуйте снова.'
      );
    }
  };

  const handleTakePhoto = async () => {
    setBusy(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нет доступа', 'Разрешите доступ к камере в настройках устройства.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        startUpload(uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePickFromLibrary = async () => {
    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках устройства.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        mediaTypes: ['images'],
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        startUpload(uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRetakePhoto = () => {
    uploadTokenRef.current += 1; // invalidate any in-flight upload for the old photo
    if (forceTimerRef.current) clearTimeout(forceTimerRef.current);
    setUploadErrorMessage(null);
    setPhotoUri(null);
  };

  const handleRetryUpload = () => {
    if (data.photoUri) startUpload(data.photoUri);
  };

  const canContinue = data.photoUploadState === 'uploaded' && !!data.photoObjectPath;

  const handleContinue = () => {
    if (!canContinue) return;
    router.push('/employee-start-shift/uploading');
  };

  return (
    <WizardLayout
      step={3}
      totalSteps={6}
      eyebrow="НАЧАЛО СМЕНЫ"
      question="Фото на посту"
      footer={
        <Button
          label="Продолжить"
          onPress={handleContinue}
          disabled={!canContinue || busy}
        />
      }
      onClose={() => router.replace('/employee')}
    >
      {data.photoUri ? (
        <View>
          <Image source={{ uri: data.photoUri }} style={styles.preview} />
          <Pressable
            style={styles.retakeRow}
            onPress={handleRetakePhoto}
            hitSlop={8}
          >
            <RotateCcw size={14} color={colors.gold} strokeWidth={1.8} />
            <Text style={styles.retakeText}>Выбрать другое фото</Text>
          </Pressable>

          {data.photoUploadState === 'uploading' ? (
            <View style={styles.uploadStatusRow}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={styles.uploadStatusText}>Загружаем фото…</Text>
            </View>
          ) : null}

          {data.photoUploadState === 'error' ? (
            <View style={styles.uploadStatusRow}>
              <Text style={styles.uploadErrorText}>
                {uploadErrorMessage ?? 'Не удалось загрузить фото.'}
              </Text>
              <Pressable onPress={handleRetryUpload} hitSlop={8} style={styles.retryLink}>
                <Text style={styles.retryLinkText}>Повторить загрузку</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <View>
          <Text style={[type.bodySmall, styles.hint]}>
            Требуется фотография для подтверждения начала смены на объекте.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
            onPress={handleTakePhoto}
            disabled={busy}
          >
            <Camera size={20} color={colors.gold} strokeWidth={1.6} />
            <Text style={[type.body, styles.optionLabel]}>Сделать фото</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
            onPress={handlePickFromLibrary}
            disabled={busy}
          >
            <ImagePlus size={20} color={colors.gold} strokeWidth={1.6} />
            <Text style={[type.body, styles.optionLabel]}>Выбрать из галереи</Text>
          </Pressable>
        </View>
      )}
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  uploadStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  uploadStatusText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  uploadErrorText: {
    color: colors.error,
    fontSize: 13,
    flexShrink: 1,
  },
  retryLink: {
    marginTop: spacing.xs,
  },
  retryLinkText: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 0.4,
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
    marginBottom: spacing.md,
  },
  optionCardPressed: {
    opacity: 0.75,
  },
  optionLabel: {
    color: colors.textPrimary,
  },
  preview: {
    width: '100%',
    height: 320,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  retakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  retakeText: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
