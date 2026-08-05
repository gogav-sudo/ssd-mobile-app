import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fontFamily } from '@/theme';

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
};

// Vector recreation of the company crest — crown + СД monogram.
// Built as SVG so it renders crisp at any size, on every platform.
export function Logo({ size = 108, showWordmark = true, showTagline = true }: LogoProps) {
  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          {/* Crown */}
          <Path
            d="M30 40 L38 24 L48 36 L60 20 L72 36 L82 24 L90 40 L86 46 L34 46 Z"
            fill={colors.gold}
          />
          <Circle cx="38" cy="24" r="3.2" fill={colors.gold} />
          <Circle cx="60" cy="20" r="3.4" fill={colors.gold} />
          <Circle cx="82" cy="24" r="3.2" fill={colors.gold} />
          <Path d="M34 46 L86 46 L84 52 L36 52 Z" fill={colors.gold} />

          {/* С */}
          <Path
            d="M56 62
               C56 50 46 42 36 42
               C24 42 15 52 15 66
               C15 80 24 90 36 90
               C46 90 55 83 56 72
               L48 72
               C47 78 42 82 36 82
               C29 82 24 75 24 66
               C24 57 29 50 36 50
               C42 50 47 54 48 60
               Z"
            fill={colors.gold}
          />

          {/* Д */}
          <Path
            d="M62 42 H72 V80 H84 V42 H94 V88 H100 V98 H92 V88 H58 V98 H50 V88 H56
               C60 82 62 74 62 66 Z"
            fill={colors.gold}
          />
        </Svg>
      </View>

      {showWordmark && (
        <View style={styles.textBlock}>
          <Text style={styles.title}>СЕКЬЮРИТИ</Text>
          <Text style={styles.subtitle}>СЕРВИС ДЕЛЮКС</Text>
          {showTagline && (
            <>
              <View style={styles.rule} />
              <Text style={styles.tagline}>БЕЗОПАСНОСТЬ • СЕРВИС • ДОВЕРИЕ</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 18,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    letterSpacing: 6,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    letterSpacing: 4,
    color: colors.gold,
    marginTop: 6,
    fontWeight: '500',
  },
  rule: {
    width: 40,
    height: 1,
    backgroundColor: colors.goldBorder,
    marginTop: 16,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: fontFamily.body,
    fontSize: 10.5,
    letterSpacing: 2,
    color: colors.textSecondary,
  },
});
