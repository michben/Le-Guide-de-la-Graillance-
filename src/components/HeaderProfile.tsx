import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing, typography } from '../theme/theme';
import { RankBadge } from './RankBadge';

export function HeaderProfile() {
  const { user, setPremium, isPremium } = useApp();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.chip}>
        <RankBadge rank={user.rank} small />
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.card}>
            <Text style={styles.title}>{user.name}</Text>
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
            <Pressable onPress={() => setVisible(false)}>
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: { marginRight: spacing.md },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '85%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text },
  stat: { ...typography.small, color: colors.textLight },
  premiumBox: {
    backgroundColor: `${colors.premium}1A`,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  premiumTitle: { fontWeight: '800', color: colors.text, marginBottom: 4 },
  premiumBody: { fontSize: 12, color: colors.textLight, marginBottom: spacing.sm, lineHeight: 17 },
  premiumBtn: { backgroundColor: colors.premium, borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center' },
  premiumBtnText: { fontWeight: '800', color: colors.secondary },
  premiumActive: { color: colors.success, fontWeight: '700', marginTop: spacing.sm },
  close: { color: colors.primary, fontWeight: '700', marginTop: spacing.md },
});
