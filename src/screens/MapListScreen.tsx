import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';
import { SpotCard } from '../components/SpotCard';
import { SpotsMap } from '../components/SpotsMap';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MapList'>;

export default function MapListScreen({ navigation }: Props) {
  const { spots, spotsLoading, spotsError, selectedCategory, setSelectedCategory, location } = useApp();
  const [view, setView] = useState<'map' | 'list'>('map');

  const filtered = useMemo(
    () =>
      selectedCategory
        ? spots.filter((s) => s.category === selectedCategory || (selectedCategory === 'Halal' && s.badges.includes('halal')))
        : spots,
    [spots, selectedCategory]
  );

  const openSpot = (id: string) => navigation.navigate('SpotDetail', { spotId: id });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Image source={require('../../assets/logo/mark.png')} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <Text style={styles.title}>{selectedCategory ?? 'Tous les spots'}</Text>
            {location ? <Text style={styles.subtitle}>📍 {location}</Text> : null}
          </View>
        </View>
        <Pressable onPress={() => setSelectedCategory(null)}>
          <Text style={styles.reset}>Réinitialiser</Text>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
          onPress={() => setView('map')}
        >
          <Text style={[styles.toggleText, view === 'map' && styles.toggleTextActive]}>🗺️ Carte</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
          onPress={() => setView('list')}
        >
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>📋 Liste</Text>
        </Pressable>
      </View>

      {spotsLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerStateText}>Recherche des spots...</Text>
        </View>
      ) : spotsError ? (
        <View style={styles.centerState}>
          <Text style={styles.centerStateText}>
            Impossible de charger les spots ({spotsError}).
          </Text>
        </View>
      ) : view === 'map' ? (
        <View style={styles.mapWrap}>
          <SpotsMap spots={filtered} onSelectSpot={openSpot} />
          <FlatList
            style={styles.mapListStrip}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filtered}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
            renderItem={({ item }) => (
              <Pressable style={styles.miniCard} onPress={() => openSpot(item.id)}>
                <Text style={styles.miniName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.miniMeta}>
                  ⭐ {item.rating} · {item.distanceKm} km
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => <SpotCard spot={item} onPress={() => openSpot(item.id)} />}
          ListEmptyComponent={<Text style={styles.empty}>Aucun spot trouvé par ici.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingBottom: 0,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerLogo: { width: 36, height: 36 },
  title: { ...typography.h2, color: colors.secondary },
  subtitle: { ...typography.small, color: colors.textLight, marginTop: 2 },
  reset: { color: colors.primary, fontWeight: '700', fontSize: 13, marginTop: 6 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontWeight: '700', color: colors.textLight, fontSize: 13 },
  toggleTextActive: { color: colors.white },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  centerStateText: { ...typography.body, color: colors.textLight, textAlign: 'center' },
  mapWrap: { flex: 1 },
  mapListStrip: { maxHeight: 90, marginVertical: spacing.md },
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    width: 150,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    ...shadow.card,
  },
  miniName: { fontWeight: '700', color: colors.text, fontSize: 13, marginBottom: 4 },
  miniMeta: { fontSize: 11, color: colors.textLight },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: spacing.xl },
});
