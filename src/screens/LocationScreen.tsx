import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing, typography } from '../theme/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Location'>;

export default function LocationScreen({ navigation }: Props) {
  const { setLocation } = useApp();
  const [manualAddress, setManualAddress] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const useGps = async () => {
    setStatus('Recherche de ta position...');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus("Permission refusée. Entre ton adresse manuellement.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(`GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
      navigation.navigate('Categories');
    } catch (e) {
      setStatus("Impossible de récupérer ta position. Entre ton adresse manuellement.");
    }
  };

  const useManual = () => {
    if (!manualAddress.trim()) return;
    setLocation(manualAddress.trim());
    navigation.navigate('Categories');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Où tu veux graille ?</Text>
      <Text style={styles.subtitle}>On te trouve les meilleurs spots autour de toi.</Text>

      <Pressable style={styles.gpsBtn} onPress={useGps}>
        <Text style={styles.gpsBtnText}>📍 Utiliser ma position GPS</Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.divider} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Entre une adresse, une ville..."
        placeholderTextColor={colors.muted}
        value={manualAddress}
        onChangeText={setManualAddress}
      />
      <Pressable
        style={[styles.primaryBtn, !manualAddress.trim() && styles.disabledBtn]}
        onPress={useManual}
        disabled={!manualAddress.trim()}
      >
        <Text style={styles.primaryBtnText}>Valider l'adresse</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textLight, marginBottom: spacing.xl },
  gpsBtn: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  gpsBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  status: { textAlign: 'center', color: colors.textLight, marginTop: spacing.sm, fontSize: 13 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.muted, fontSize: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.4 },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
