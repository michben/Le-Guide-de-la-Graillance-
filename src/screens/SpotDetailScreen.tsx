import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { BadgePill } from '../components/BadgePill';
import { RankBadge } from '../components/RankBadge';
import { GradientButton } from '../components/GradientButton';
import { colors, radius, spacing, typography } from '../theme/theme';
import { confirmAsync, notify } from '../utils/confirm';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SpotDetail'>;

export default function SpotDetailScreen({ route, navigation }: Props) {
  const { spotId } = route.params;
  const { spots, spotsLoading, addReview, user, isAdmin, deleteReview, deleteSpot, deleteUserAccount } = useApp();
  const spot = spots.find((s) => s.id === spotId);
  const [modalVisible, setModalVisible] = useState(false);
  const [deletingSpot, setDeletingSpot] = useState(false);
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);

  if (!spot) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        {spotsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Text style={styles.empty}>Spot introuvable.</Text>
        )}
      </View>
    );
  }

  const confirmDeleteSpot = async () => {
    const ok = await confirmAsync('Supprimer ce restaurant ?', `"${spot.name}" sera retiré définitivement de l'application.`);
    if (!ok) return;
    setDeletingSpot(true);
    try {
      await deleteSpot(spot.id);
      navigation.goBack();
    } catch {
      notify('Erreur', 'Échec de la suppression du restaurant.');
    } finally {
      setDeletingSpot(false);
    }
  };

  const confirmDeleteReview = async (reviewId: string) => {
    const ok = await confirmAsync('Supprimer cet avis ?', 'Cette action est définitive.');
    if (!ok) return;
    setBusyReviewId(reviewId);
    try {
      await deleteReview(spot.id, reviewId);
    } catch {
      notify('Erreur', "Échec de la suppression de l'avis.");
    } finally {
      setBusyReviewId(null);
    }
  };

  const confirmDeleteUser = async (authorUid: string, authorName: string) => {
    const ok = await confirmAsync(
      'Supprimer ce compte ?',
      `Le compte de "${authorName}" sera définitivement supprimé de l'application.`
    );
    if (!ok) return;
    setBusyReviewId(authorUid);
    try {
      await deleteUserAccount(authorUid);
    } catch (e) {
      notify('Erreur', e instanceof Error ? e.message : 'Échec de la suppression du compte.');
    } finally {
      setBusyReviewId(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.header}>
        <Text style={styles.name}>{spot.name}</Text>
        <View style={styles.badgeRow}>
          {spot.badges.map((b) => (
            <BadgePill key={b} badge={b} />
          ))}
        </View>
        <Text style={styles.ratingLine}>
          ⭐ {spot.rating} · {spot.reviewCount} avis · {spot.priceRange}
        </Text>
        {isAdmin && (
          <Pressable style={styles.adminDeleteSpotBtn} onPress={confirmDeleteSpot} disabled={deletingSpot}>
            <Text style={styles.adminDeleteSpotText}>
              {deletingSpot ? 'Suppression...' : '🗑️ Supprimer ce restaurant (admin)'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Adresse" value={spot.address} />
        <InfoRow label="Horaires" value={spot.hours} />
        <InfoRow label="Spécialités" value={spot.specialties.join(', ')} />
      </View>

      <GradientButton style={styles.ctaBtn} onPress={() => setModalVisible(true)}>
        🍽️ J'ai graillé ici
      </GradientButton>

      <Text style={styles.sectionTitle}>Avis certifiés ({spot.reviews.length})</Text>
      {spot.reviews.length === 0 ? (
        <Text style={styles.empty}>Aucun avis pour l'instant. Sois le premier à graille ici !</Text>
      ) : (
        spot.reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{review.author}</Text>
              <RankBadge rank={review.authorRank} small />
            </View>
            <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <View style={styles.proofRow}>
              {review.ticketPhoto && <Text style={styles.proofTag}>🧾 Ticket vérifié</Text>}
              {review.dishPhoto && <Text style={styles.proofTag}>📸 Photo du plat</Text>}
            </View>
            <Text style={styles.reviewDate}>{review.date}</Text>
            {isAdmin && (
              <View style={styles.adminReviewActions}>
                <Pressable disabled={busyReviewId === review.id} onPress={() => confirmDeleteReview(review.id)}>
                  <Text style={styles.adminActionText}>
                    {busyReviewId === review.id ? '...' : "🗑️ Supprimer l'avis"}
                  </Text>
                </Pressable>
                {review.authorUid && (
                  <Pressable
                    disabled={busyReviewId === review.authorUid}
                    onPress={() => confirmDeleteUser(review.authorUid!, review.author)}
                  >
                    <Text style={styles.adminActionText}>
                      {busyReviewId === review.authorUid ? '...' : '🚫 Supprimer le compte'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        ))
      )}

      <ReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={async (review) => {
          await addReview(spot.id, review);
          setModalVisible(false);
        }}
        userName={user.name}
      />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ReviewModal({
  visible,
  onClose,
  onSubmit,
  userName,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: { author: string; rating: number; comment: string; ticketPhoto: boolean; dishPhoto: boolean }) => Promise<void>;
  userName: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [ticketPhoto, setTicketPhoto] = useState(false);
  const [dishPhoto, setDishPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(5);
    setComment('');
    setTicketPhoto(false);
    setDishPhoto(false);
    setError(null);
  };

  const pickPhoto = async (which: 'ticket' | 'dish') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) {
      which === 'ticket' ? setTicketPhoto(true) : setDishPhoto(true);
    }
  };

  const canSubmit = ticketPhoto && dishPhoto && comment.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>J'ai graillé ici</Text>
          <Text style={styles.modalSubtitle}>
            Preuve obligatoire : pas de ticket = pas d'avis.
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)}>
                <Text style={styles.star}>{n <= rating ? '⭐' : '☆'}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Raconte ta graille..."
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <View style={styles.photoRow}>
            <Pressable
              testID="photo-ticket-btn"
              style={[styles.photoBtn, ticketPhoto && styles.photoBtnDone]}
              onPress={() => pickPhoto('ticket')}
            >
              <Text style={styles.photoBtnText}>{ticketPhoto ? '✅ Ticket ajouté' : '🧾 Photo du ticket'}</Text>
            </Pressable>
            <Pressable
              testID="photo-dish-btn"
              style={[styles.photoBtn, dishPhoto && styles.photoBtnDone]}
              onPress={() => pickPhoto('dish')}
            >
              <Text style={styles.photoBtnText}>{dishPhoto ? '✅ Plat ajouté' : '📸 Photo du plat'}</Text>
            </Pressable>
          </View>

          {error && <Text style={styles.modalError}>{error}</Text>}

          <GradientButton
            disabled={!canSubmit}
            loading={submitting}
            onPress={async () => {
              setError(null);
              setSubmitting(true);
              try {
                await onSubmit({ author: userName, rating, comment: comment.trim(), ticketPhoto, dishPhoto });
                reset();
              } catch (e) {
                setError("Impossible de publier l'avis, réessaie.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Publier mon avis
          </GradientButton>
          <Pressable
            onPress={() => {
              reset();
              onClose();
            }}
          >
            <Text style={styles.cancel}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centerState: { alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  name: { ...typography.h1, color: colors.secondary, marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xs },
  ratingLine: { ...typography.body, color: colors.textLight, marginTop: 4 },
  infoCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  infoRow: {},
  infoLabel: { ...typography.small, color: colors.muted, fontWeight: '700', marginBottom: 2 },
  infoValue: { ...typography.body, color: colors.text },
  ctaBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.text, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  empty: { color: colors.textLight, marginHorizontal: spacing.lg },
  reviewCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { fontWeight: '700', color: colors.text },
  reviewRating: { marginBottom: 4 },
  reviewComment: { color: colors.text, marginBottom: 8, lineHeight: 20 },
  proofRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  proofTag: { fontSize: 11, color: colors.success, fontWeight: '700' },
  reviewDate: { fontSize: 11, color: colors.muted },
  adminDeleteSpotBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  adminDeleteSpotText: { color: colors.primaryDark, fontWeight: '700', fontSize: 12 },
  adminReviewActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  adminActionText: { color: colors.primaryDark, fontWeight: '700', fontSize: 11 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitle: { ...typography.h2, color: colors.text },
  modalSubtitle: { ...typography.small, color: colors.textLight, marginTop: 4, marginBottom: spacing.md },
  modalError: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  starsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  star: { fontSize: 28 },
  commentInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    color: colors.text,
  },
  photoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  photoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoBtnDone: { borderColor: colors.success, backgroundColor: `${colors.success}14` },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  cancel: { textAlign: 'center', color: colors.textLight, marginTop: spacing.md },
});
