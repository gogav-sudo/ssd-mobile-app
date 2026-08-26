import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, RotateCcw } from 'lucide-react-native';
import { WizardLayout } from '@/components/ui/WizardLayout';
import { Button } from '@/components/ui/Button';
import { useStartShift } from '@/context/StartShiftContext';
import { colors, radius, spacing, type } from '@/theme';

export default function StartShiftPhotoScreen() {
  const router = useRouter();
  const { data, setPhotoUri } = useStartShift();
  const [busy, setBusy] = useState(false);

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
        setPhotoUri(result.assets[0].uri);
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
        setPhotoUri(result.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = () => {
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
          disabled={!data.photoUri || busy}
        />
      }
      onClose={() => router.replace('/employee')}
    >
      {data.photoUri ? (
        <View>
          <Image source={{ uri: data.photoUri }} style={styles.preview} />
          <Pressable
            style={styles.retakeRow}
            onPress={() => setPhotoUri(null)}
            hitSlop={8}
          >
            <RotateCcw size={14} color={colors.gold} strokeWidth={1.8} />
            <Text style={styles.retakeText}>Выбрать другое фото</Text>
          </Pressable>
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
