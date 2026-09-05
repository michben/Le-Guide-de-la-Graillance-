import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing, typography } from '../theme/theme';
import { SpotCard } from '../components/SpotCard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MapList'>;

export default function MapListScreen({ navigation }: Props) {
  const { spots, selectedCategory, setSelectedCategory, location } = useApp();
  const [view, setView] = useState<'map' | 'list'>('map');

  const filtered = useMemo(
    () =>
      selectedCategory
        ? spots.filter((s) => s.category === selectedCategory || (selectedCategory === 'Halal' && s.badges.includes('halal')))
        : spots,
    [spots, selectedCategory]
  );

  const bounds = useMemo(() => {
    const lats = filtered.map((s) => s.lat);
    const lngs = filtered.map((s) => s.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [filtered]);

  const openSpot = (id: string) => navigation.navigate('SpotDetail', { spotId: id });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{selectedCategory ?? 'Tous les spots'}</Text>
          {location ? <Text style={styles.subtitle}>📍 {location}</Text> : null}
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

      {view === 'map' ? (
        <View style={styles.mapWrap}>
          <View style={styles.map}>
            {filtered.map((spot) => {
              const latSpan = bounds.maxLat - bounds.minLat || 1;
              const lngSpan = bounds.maxLng - bounds.minLng || 1;
              const top = 10 + (1 - (spot.lat - bounds.minLat) / latSpan) * 80;
              const left = 10 + ((spot.lng - bounds.minLng) / lngSpan) * 80;
              return (
                <Pressable
                  key={spot.id}
                  style={[styles.pin, { top: `${top}%`, left: `${left}%` }]}
                  onPress={() => openSpot(spot.id)}
                >
                  <View style={styles.pinBubble}>
                    <Text style={styles.pinText}>⭐ {spot.rating}</Text>
                  </View>
                  <Text style={styles.pinDot}>📍</Text>
                </Pressable>
              );
            })}
          </View>
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
  title: { ...typography.h2, color: colors.text },
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
  mapWrap: { flex: 1 },
  map: {
    flex: 1,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#DCEEDC',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pin: { position: 'absolute', alignItems: 'center' },
  pinBubble: {
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinText: { fontSize: 10, fontWeight: '700', color: colors.text },
  pinDot: { fontSize: 22 },
  mapListStrip: { maxHeight: 90, marginVertical: spacing.md },
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    width: 150,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  miniName: { fontWeight: '700', color: colors.text, fontSize: 13, marginBottom: 4 },
  miniMeta: { fontSize: 11, color: colors.textLight },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: spacing.xl },
});
