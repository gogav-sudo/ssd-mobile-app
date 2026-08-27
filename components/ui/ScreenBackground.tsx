import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '@/theme';

type ScreenBackgroundProps = ViewProps & {
  // Max width of the centered content column on wide desktop web viewports.
  // Ignored on native — mobile/tablet apps always use the full device width.
  webMaxWidth?: number;
};

export function ScreenBackground({
  style,
  children,
  webMaxWidth = 560,
  ...rest
}: ScreenBackgroundProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter} {...rest}>
        <View style={[styles.webInner, { maxWidth: webMaxWidth }, style]}>{children}</View>
      </View>
    );
  }

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
  // Web only: the outer layer paints the dark background full-bleed across
  // the whole viewport and allows the document to scroll naturally; the
  // inner layer centers a comfortably-sized content column on top of it so
  // buttons/inputs/cards never stretch to fill an ultra-wide browser window.
  webOuter: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  webInner: {
    width: '100%',
    flex: 1,
  },
});
