import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../types';
import { colors, radius } from '../theme/theme';

const BADGE_INFO: Record<Badge, { label: string; color: string; emoji: string }> = {
  halal: { label: 'Halal', color: colors.halal, emoji: '🕌' },
  avs: { label: 'AVS', color: colors.avs, emoji: '✅' },
  achahada: { label: 'Achahada', color: colors.achahada, emoji: '☪️' },
};

export function BadgePill({ badge }: { badge: Badge }) {
  const info = BADGE_INFO[badge];
  return (
    <View style={[styles.pill, { backgroundColor: `${info.color}1A`, borderColor: info.color }]}>
      <Text style={styles.emoji}>{info.emoji}</Text>
      <Text style={[styles.label, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  emoji: { fontSize: 11, marginRight: 4 },
  label: { fontSize: 11, fontWeight: '700' },
});
