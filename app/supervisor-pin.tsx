import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useSupervisorAccess } from '@/context/SupervisorAccessContext';
import { colors, radius, spacing, type } from '@/theme';

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;
const CORRECT_PIN = process.env.EXPO_PUBLIC_SUPERVISOR_PIN ?? '';

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function SupervisorPinScreen() {
  const router = useRouter();
  const { grantSupervisorAccess } = useSupervisorAccess();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockedUntil !== null && secondsLeft > 0;

  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        setLockedUntil(null);
        setAttempts(0);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setSecondsLeft(remaining);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockedUntil]);

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (isLocked) return;
      setError(false);
      setPin((current) => {
        if (current.length >= PIN_LENGTH) return current;
        const next = current + digit;

        if (next.length === PIN_LENGTH) {
          if (next === CORRECT_PIN) {
            grantSupervisorAccess();
            setTimeout(() => router.replace('/supervisor'), 150);
          } else {
            const nextAttempts = attempts + 1;
            setAttempts(nextAttempts);
            setError(true);
            setTimeout(() => setPin(''), 400);

            if (nextAttempts >= MAX_ATTEMPTS) {
              setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
              setSecondsLeft(LOCKOUT_SECONDS);
            }
          }
        }

        return next;
      });
    },
    [attempts, isLocked, router, grantSupervisorAccess]
  );

  const handleDelete = useCallback(() => {
    if (isLocked) return;
    setError(false);
    setPin((current) => current.slice(0, -1));
  }, [isLocked]);

  const attemptsLeft = MAX_ATTEMPTS - attempts;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <ArrowLeft size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Lock size={22} color={colors.gold} strokeWidth={1.6} />
          </View>
          <Text style={[type.label, styles.headerLabel]}>РЕЖИМ РУКОВОДИТЕЛЯ</Text>
          <Text style={[type.h1, styles.headerTitle]}>Введите PIN-код</Text>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </View>

        {isLocked ? (
          <Text style={[type.bodySmall, styles.lockText]}>
            Слишком много попыток. Повторите через {secondsLeft} с.
          </Text>
        ) : error ? (
          <Text style={[type.bodySmall, styles.errorText]}>
            Неверный PIN-код{attemptsLeft > 0 && attemptsLeft < MAX_ATTEMPTS ? ` · осталось попыток: ${attemptsLeft}` : ''}
          </Text>
        ) : (
          <Text style={[type.bodySmall, styles.hintText]}> </Text>
        )}

        <View style={styles.keypad}>
          {DIGIT_KEYS.map((key, index) => {
            if (key === '') {
              return <View key={`spacer-${index}`} style={styles.keyButton} />;
            }
            if (key === 'del') {
              return (
                <Pressable
                  key="del"
                  style={({ pressed }) => [
                    styles.keyButton,
                    pressed && !isLocked && styles.keyButtonPressed,
                  ]}
                  onPress={handleDelete}
                  disabled={isLocked}
                >
                  <Text style={[styles.keyText, isLocked && styles.keyTextDisabled]}>⌫</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.keyButton,
                  pressed && !isLocked && styles.keyButtonPressed,
                ]}
                onPress={() => handleDigitPress(key)}
                disabled={isLocked}
              >
                <Text style={[styles.keyText, isLocked && styles.keyTextDisabled]}>{key}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginLeft: -spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
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
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dotError: {
    borderColor: colors.error,
    backgroundColor: colors.error,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  lockText: {
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  hintText: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  keyButton: {
    width: '30%',
    aspectRatio: 1.5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyButtonPressed: {
    backgroundColor: colors.surfaceRaised,
    opacity: 0.8,
  },
  keyText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  keyTextDisabled: {
    color: colors.textTertiary,
  },
});
