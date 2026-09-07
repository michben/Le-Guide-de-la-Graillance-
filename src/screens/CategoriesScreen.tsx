import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORIES } from '../data/spots';
import { useApp } from '../context/AppContext';
import { GradientButton } from '../components/GradientButton';
import { colors, flameGradient, radius, spacing, typography } from '../theme/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

const TILE_TINTS = ['#FFE8DE', '#FFF3D6', '#E4F3E6', '#E3ECFB', '#F3E6FB', '#FFE0E9'];

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
        {CATEGORIES.map((cat, index) => (
          <Pressable key={cat.key} style={styles.tile} onPress={() => choose(cat.key)}>
            {cat.key === 'Tendance' ? (
              <LinearGradient colors={flameGradient} style={styles.tileEmojiWrap}>
                <Text style={styles.tileEmoji}>{cat.emoji}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.tileEmojiWrap, { backgroundColor: TILE_TINTS[index % TILE_TINTS.length] }]}>
                <Text style={styles.tileEmoji}>{cat.emoji}</Text>
              </View>
            )}
            <Text style={styles.tileLabel}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      <GradientButton variant="navy" onPress={() => choose(null)}>
        Je sais pas, montre-moi tout
      </GradientButton>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  title: { ...typography.h1, color: colors.secondary, marginBottom: 4 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tileEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileEmoji: { fontSize: 22 },
  tileLabel: { ...typography.small, fontWeight: '700', color: colors.text },
});
