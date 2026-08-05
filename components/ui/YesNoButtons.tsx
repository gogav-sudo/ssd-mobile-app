import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { spacing } from '@/theme';

type YesNoButtonsProps = {
  onYes: () => void;
  onNo: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function YesNoButtons({ onYes, onNo, disabled, loading }: YesNoButtonsProps) {
  return (
    <View>
      <Button label="Да" onPress={onYes} disabled={disabled} loading={loading} />
      <View style={{ height: spacing.md }} />
      <Button label="Нет" variant="secondary" onPress={onNo} disabled={disabled || loading} />
    </View>
  );
}
