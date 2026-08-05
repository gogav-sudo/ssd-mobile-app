import React from 'react';
import { ImageBackground, StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

// Splash-only background: a dimmed, warm-toned hospitality/security interior
// photo with a dark overlay + subtle gold vignette — matching the website's
// hero treatment. Every other screen keeps the flat graphite ScreenBackground.
export function SplashBackground({ style, children, ...rest }: ViewProps) {
  return (
    <ImageBackground
      source={require('@/assets/images/splash-background.jpg')}
      style={[styles.root, style]}
      resizeMode="cover"
      {...rest}
    >
      <View style={styles.darkOverlay} />
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(11,11,12,0.78)', 'rgba(11,11,12,0.95)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(201,162,75,0.14)', 'transparent']}
        style={styles.goldVignetteTop}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
      />
      <LinearGradient
        colors={['rgba(201,162,75,0.10)', 'transparent']}
        style={styles.goldVignetteBottom}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.3, y: 0.3 }}
      />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  goldVignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '40%',
  },
  goldVignetteBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '90%',
    height: '50%',
  },
  content: {
    flex: 1,
  },
});
