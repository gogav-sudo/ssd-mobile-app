import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  ClipboardCheck,
  Handshake,
  Search,
  ShieldAlert,
  ShieldOff,
  Truck,
  UserCheck,
  Wrench,
} from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, radius, spacing, type } from '@/theme';
import { KNOWLEDGE_TOPICS } from '@/lib/knowledgeBase';

const TOPIC_ICONS: Record<string, typeof ClipboardCheck> = {
  shift: ClipboardCheck,
  'service-standards': Handshake,
  visitors: UserCheck,
  'parcels-requests': Truck,
  workplace: Wrench,
  security: ShieldAlert,
  restrictions: ShieldOff,
  equipment: Wrench,
};

export default function KnowledgeEntryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/employee/knowledge/search-results?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[type.label, styles.headerLabel]}>БАЗА ЗНАНИЙ</Text>
            <Text style={[type.h1, styles.headerTitle]}>Регламенты и инструкции</Text>
          </View>

          <View style={styles.searchInput}>
            <Search size={16} color={colors.textTertiary} strokeWidth={1.8} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Например: что делать при пожаре?"
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmitSearch}
              returnKeyType="search"
              selectionColor={colors.gold}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              !query.trim() && styles.searchButtonDisabled,
              pressed && query.trim() && styles.searchButtonPressed,
            ]}
            onPress={handleSubmitSearch}
            disabled={!query.trim()}
          >
            <Text style={styles.searchButtonLabel}>НАЙТИ ОТВЕТ</Text>
          </Pressable>

          <Text style={[type.caption, styles.sectionLabel]}>РАЗДЕЛЫ</Text>

          <View style={styles.list}>
            {KNOWLEDGE_TOPICS.map((topic) => {
              const Icon = TOPIC_ICONS[topic.slug] ?? ClipboardCheck;
              return (
                <Pressable
                  key={topic.slug}
                  style={({ pressed }) => [
                    styles.optionCard,
                    pressed && styles.optionCardPressed,
                  ]}
                  onPress={() => router.push(`/employee/knowledge/${topic.slug}`)}
                >
                  <View style={styles.optionIcon}>
                    <Icon size={18} color={colors.gold} strokeWidth={1.6} />
                  </View>
                  <Text style={[type.body, styles.optionLabel]}>{topic.label}</Text>
                  <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.6} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchTextInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonPressed: {
    opacity: 0.75,
  },
  searchButtonLabel: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 1.4,
    fontWeight: '600',
  },
  sectionLabel: {
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
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
  },
  optionCardPressed: {
    opacity: 0.75,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldMuted,
  },
  optionLabel: {
    flex: 1,
    color: colors.textPrimary,
  },
});
