import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserRank } from '../types';
import { colors, radius } from '../theme/theme';

const RANK_INFO: Record<UserRank, { color: string; emoji: string }> = {
  'Grailleur Bronze': { color: colors.bronze, emoji: '🥉' },
  Validateur: { color: colors.success, emoji: '🛡️' },
  Premium: { color: colors.premium, emoji: '👑' },
};

export function RankBadge({ rank, small }: { rank: UserRank; small?: boolean }) {
  const info = RANK_INFO[rank];
  return (
    <View style={[styles.wrap, { backgroundColor: info.color }, small && styles.small]}>
      <Text style={[styles.text, small && styles.textSmall]}>
        {info.emoji} {rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  small: { paddingHorizontal: 8, paddingVertical: 3 },
  text: { color: colors.white, fontWeight: '800', fontSize: 13 },
  textSmall: { fontSize: 11 },
});
