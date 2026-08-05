import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '@/theme';

export function ScreenBackground({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.root, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
