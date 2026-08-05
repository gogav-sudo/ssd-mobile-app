import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

export function TextField(props: TextInputProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[type.body, styles.input]}
        selectionColor={colors.gold}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderSubtle,
  },
  input: {
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
});
