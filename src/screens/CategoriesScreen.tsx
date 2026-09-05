import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '../data/spots';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing, typography } from '../theme/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

export default function CategoriesScreen({ navigation }: Props) {
  const { setSelectedCategory, location } = useApp();

  const choose = (cat: string | null) => {
    setSelectedCategory(cat);
    navigation.navigate('MapList');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Tu graille quoi ?</Text>
      {location ? <Text style={styles.subtitle}>📍 {location}</Text> : null}

      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <Pressable key={cat.key} style={styles.tile} onPress={() => choose(cat.key)}>
            <Text style={styles.tileEmoji}>{cat.emoji}</Text>
            <Text style={styles.tileLabel}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.allBtn} onPress={() => choose(null)}>
        <Text style={styles.allBtnText}>Je sais pas, montre-moi tout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  title: { ...typography.h1, color: colors.text, marginBottom: 4 },
  subtitle: { ...typography.small, color: colors.textLight, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileEmoji: { fontSize: 30, marginBottom: 6 },
  tileLabel: { ...typography.small, fontWeight: '700', color: colors.text },
  allBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  allBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
