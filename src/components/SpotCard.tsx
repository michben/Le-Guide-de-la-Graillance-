import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Spot } from '../types';
import { colors, radius, spacing, typography } from '../theme/theme';
import { BadgePill } from './BadgePill';

const CATEGORY_EMOJI: Record<string, string> = {
  Pizza: '🍕',
  Kebab: '🌯',
  Sushi: '🍣',
  Burger: '🍔',
  Tacos: '🌮',
  Poulet: '🍗',
  Asiatique: '🥡',
};

export function SpotCard({ spot, onPress }: { spot: Spot; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.thumb}>
        <Text style={styles.thumbEmoji}>{CATEGORY_EMOJI[spot.category] ?? '🍽️'}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.rowBetween}>
          <Text style={styles.name} numberOfLines={1}>
            {spot.name}
          </Text>
          <Text style={styles.rating}>⭐ {spot.rating}</Text>
        </View>
        <Text style={styles.meta}>
          {spot.category} · {spot.priceRange} · {spot.distanceKm} km · {spot.reviewCount} avis
        </Text>
        <View style={styles.badgeRow}>
          {spot.badges.map((b) => (
            <BadgePill key={b} badge={b} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  thumbEmoji: { fontSize: 30 },
  info: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.h3, color: colors.text, flexShrink: 1, marginRight: spacing.xs },
  rating: { ...typography.small, fontWeight: '700', color: colors.text },
  meta: { ...typography.small, color: colors.textLight, marginTop: 2, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
