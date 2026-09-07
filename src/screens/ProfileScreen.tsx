import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { RankBadge } from '../components/RankBadge';
import { GradientButton } from '../components/GradientButton';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';
import { confirmAsync, notify } from '../utils/confirm';
import { compressPhotoToDataUrl } from '../utils/imageCompression';

export default function ProfileScreen() {
  const { user, isPremium, setPremium, logout, updateProfilePhoto, isFirebaseConfigured } = useApp();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickProfilePhoto = async () => {
    if (!isFirebaseConfigured) {
      notify('Mode démo', "La photo de profil n'est disponible qu'avec un compte connecté.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressPhotoToDataUrl(result.assets[0].uri);
      await updateProfilePhoto(dataUrl);
    } catch {
      notify('Erreur', "Échec de l'envoi de la photo, réessaie.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirmAsync('Se déconnecter ?', 'Tu pourras te reconnecter à tout moment.');
    if (ok) logout();
  };

  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.screen}>
      <Pressable style={styles.avatarWrap} onPress={pickProfilePhoto} disabled={uploadingPhoto}>
        {user.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.avatarEditBadge}>
          {uploadingPhoto ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.avatarEditIcon}>📷</Text>
          )}
        </View>
      </Pressable>
      <Text style={styles.avatarHint}>Touche la photo pour la changer</Text>

      <Text style={styles.name}>{user.name}</Text>
      <RankBadge rank={user.rank} />
      <Text style={styles.stat}>{user.reviewsPosted} avis publiés</Text>

      {!isPremium ? (
        <View style={styles.premiumBox}>
          <Text style={styles.premiumTitle}>👑 Passe Premium</Text>
          <Text style={styles.premiumBody}>
            Avis illimités, badges exclusifs, stats avancées. 4,99 €/mois ou 49,99 €/an.
          </Text>
          <Pressable style={styles.premiumBtn} onPress={() => setPremium(true)}>
            <Text style={styles.premiumBtnText}>Devenir Premium</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.premiumActive}>👑 Tu es déjà Premium, merci grailleur !</Text>
      )}

      <GradientButton variant="navy" style={styles.logoutBtn} onPress={handleLogout}>
        Se déconnecter
      </GradientButton>
    </View>
  );
}

const AVATAR_SIZE = 104;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xl },
  avatarWrap: { marginBottom: spacing.xs },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: { backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: colors.white, fontSize: 40, fontWeight: '800' },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarEditIcon: { fontSize: 15 },
  avatarHint: { ...typography.small, color: colors.textLight, marginBottom: spacing.md },
  name: { ...typography.h2, color: colors.secondary, marginTop: spacing.sm },
  stat: { ...typography.small, color: colors.textLight, marginTop: spacing.sm, marginBottom: spacing.md },
  premiumBox: {
    backgroundColor: `${colors.premium}1A`,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
    ...shadow.card,
  },
  premiumTitle: { fontWeight: '800', color: colors.text, marginBottom: 4 },
  premiumBody: { fontSize: 12, color: colors.textLight, marginBottom: spacing.sm, lineHeight: 17 },
  premiumBtn: { backgroundColor: colors.premium, borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center' },
  premiumBtnText: { fontWeight: '800', color: colors.secondary },
  premiumActive: { color: colors.success, fontWeight: '700', marginTop: spacing.sm },
  logoutBtn: { width: '100%', marginTop: spacing.xl },
});
