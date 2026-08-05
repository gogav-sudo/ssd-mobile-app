import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenBackground } from './ScreenBackground';
import { colors, spacing, type } from '@/theme';
import { LucideIcon } from 'lucide-react-native';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function PlaceholderScreen({ title, description, icon: Icon }: PlaceholderScreenProps) {
  return (
    <ScreenBackground style={styles.root}>
      <View style={styles.iconWrap}>
        <Icon size={26} color={colors.gold} strokeWidth={1.5} />
      </View>
      <Text style={[type.h2, styles.title]}>{title}</Text>
      <Text style={[type.bodySmall, styles.description]}>{description}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>РАЗДЕЛ В РАЗРАБОТКЕ</Text>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  badge: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  badgeText: {
    color: colors.textTertiary,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '600',
  },
});
