import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { authErrorMessage } from '../firebase/auth';
import { colors, radius, spacing, typography } from '../theme/theme';

type Mode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const { signIn, signUp, demoLogin, isFirebaseConfigured } = useApp();
  const [showWelcome, setShowWelcome] = useState(true);
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!isFirebaseConfigured) {
      demoLogin();
      return;
    }
    if (!email.trim() || !password.trim() || (mode === 'signUp' && !name.trim())) {
      setError('Remplis tous les champs.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signUp') {
        await signUp(email.trim(), password, name.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.logo}>🍔🔥</Text>
        <Text style={styles.title}>Le Guide de la Graillance</Text>
        <Text style={styles.subtitle}>Tu veux graille ?</Text>
      </View>

      {showWelcome ? (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Ici, on graille vrai.</Text>
          <Text style={styles.welcomeBody}>
            Pas de fake, que des preuves. Chaque avis est certifié par une photo du ticket et du
            plat. Fini les influenceurs, place aux vrais grailleurs.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => setShowWelcome(false)}>
            <Text style={styles.primaryBtnText}>J'ai compris, on y va</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          {!isFirebaseConfigured && (
            <View style={styles.demoBanner}>
              <Text style={styles.demoBannerText}>
                Mode démo : Firebase n'est pas encore configuré (voir README). Appuie sur
                continuer pour explorer l'appli sans compte réel.
              </Text>
            </View>
          )}

          {isFirebaseConfigured && (
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeBtn, mode === 'signIn' && styles.modeBtnActive]}
                onPress={() => setMode('signIn')}
              >
                <Text style={[styles.modeText, mode === 'signIn' && styles.modeTextActive]}>
                  Connexion
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, mode === 'signUp' && styles.modeBtnActive]}
                onPress={() => setMode('signUp')}
              >
                <Text style={[styles.modeText, mode === 'signUp' && styles.modeTextActive]}>
                  Inscription
                </Text>
              </Pressable>
            </View>
          )}

          {isFirebaseConfigured && mode === 'signUp' && (
            <TextInput
              style={styles.input}
              placeholder="Ton pseudo de grailleur"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
          )}

          {isFirebaseConfigured && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.primaryBtn} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {!isFirebaseConfigured
                  ? 'Continuer en mode démo'
                  : mode === 'signUp'
                  ? "S'inscrire"
                  : 'Se connecter'}
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou continue avec</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <View style={[styles.socialBtn, styles.socialBtnDisabled, { backgroundColor: '#1877F2' }]}>
              <Text style={styles.socialBtnText}>Facebook</Text>
              <Text style={styles.soonTag}>Bientôt</Text>
            </View>
            <View style={[styles.socialBtn, styles.socialBtnDisabled, { backgroundColor: '#111' }]}>
              <Text style={styles.socialBtnText}>X</Text>
              <Text style={styles.soonTag}>Bientôt</Text>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 56, marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.h3, color: colors.primary, marginTop: spacing.xs },
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  welcomeBody: { ...typography.body, color: colors.textLight, marginBottom: spacing.lg, lineHeight: 21 },
  form: { gap: spacing.md },
  demoBanner: {
    backgroundColor: `${colors.accent}22`,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  demoBannerText: { fontSize: 12, color: colors.text, lineHeight: 17 },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  modeBtnActive: { backgroundColor: colors.primary },
  modeText: { fontWeight: '700', color: colors.textLight, fontSize: 13 },
  modeTextActive: { color: colors.white },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  error: { color: colors.primaryDark, fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.muted, fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: spacing.sm },
  socialBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  socialBtnDisabled: { opacity: 0.5 },
  socialBtnText: { color: colors.white, fontWeight: '700' },
  soonTag: { color: colors.white, fontSize: 10, marginTop: 2 },
});
