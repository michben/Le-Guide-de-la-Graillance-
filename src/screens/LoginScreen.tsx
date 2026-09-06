import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useApp } from '../context/AppContext';
import {
  ConfirmationResult,
  authErrorMessage,
  confirmPhoneCode,
  sendPhoneVerificationCode,
  signInWithGoogleIdToken,
  signInWithGooglePopup,
} from '../firebase/auth';
import { firebaseConfig } from '../firebase/config';
import { GradientButton } from '../components/GradientButton';
import { colors, radius, spacing, typography } from '../theme/theme';

type Mode = 'signIn' | 'signUp';
type AuthMethod = 'email' | 'phone';

export default function LoginScreen() {
  const { signIn, signUp, demoLogin, isFirebaseConfigured } = useApp();
  const [showWelcome, setShowWelcome] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  // expo-auth-session throws synchronously if these are missing, even on platforms that
  // never use them (web signs in via signInWithGooglePopup instead) — a placeholder keeps
  // the hook from crashing the whole screen; promptGoogle() is only ever called on native,
  // gated by googleWebClientId below, so the placeholder is never actually used to sign in.
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    webClientId: googleWebClientId || 'not-configured',
    iosClientId: googleWebClientId || 'not-configured',
    androidClientId: googleWebClientId || 'not-configured',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params.id_token) {
      setLoading(true);
      signInWithGoogleIdToken(googleResponse.params.id_token)
        .catch((e) => setError(authErrorMessage(e)))
        .finally(() => setLoading(false));
    } else if (googleResponse?.type === 'error') {
      setError('Connexion Google annulée ou refusée.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const submitEmail = async () => {
    setError(null);
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

  const sendCode = async () => {
    setError(null);
    if (!phone.trim().startsWith('+')) {
      setError('Format international requis, ex. +33612345678.');
      return;
    }
    setLoading(true);
    try {
      const result = await sendPhoneVerificationCode(phone.trim(), recaptchaVerifier.current ?? undefined);
      setConfirmation(result);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmation) return;
    setError(null);
    setLoading(true);
    try {
      await confirmPhoneCode(confirmation, code.trim());
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      if (Platform.OS === 'web') {
        setLoading(true);
        await signInWithGooglePopup();
      } else {
        await promptGoogle();
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
      {isFirebaseConfigured && Platform.OS !== 'web' && (
        <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={firebaseConfig} />
      )}

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
          <GradientButton onPress={() => setShowWelcome(false)}>J'ai compris, on y va</GradientButton>
        </View>
      ) : !isFirebaseConfigured ? (
        <View style={styles.form}>
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              Mode démo : Firebase n'est pas encore configuré (voir README). Appuie sur continuer
              pour explorer l'appli sans compte réel.
            </Text>
          </View>
          <GradientButton onPress={demoLogin}>Continuer en mode démo</GradientButton>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, authMethod === 'email' && styles.modeBtnActive]}
              onPress={() => {
                setAuthMethod('email');
                setError(null);
              }}
            >
              <Text style={[styles.modeText, authMethod === 'email' && styles.modeTextActive]}>
                Email
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, authMethod === 'phone' && styles.modeBtnActive]}
              onPress={() => {
                setAuthMethod('phone');
                setError(null);
              }}
            >
              <Text style={[styles.modeText, authMethod === 'phone' && styles.modeTextActive]}>
                Téléphone
              </Text>
            </Pressable>
          </View>

          {authMethod === 'email' ? (
            <>
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

              {mode === 'signUp' && (
                <TextInput
                  style={styles.input}
                  placeholder="Ton pseudo de grailleur"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                />
              )}
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

              {error && <Text style={styles.error}>{error}</Text>}

              <GradientButton onPress={submitEmail} loading={loading}>
                {mode === 'signUp' ? "S'inscrire" : 'Se connecter'}
              </GradientButton>
            </>
          ) : !confirmation ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Numéro (format international, +336...)"
                placeholderTextColor={colors.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <GradientButton onPress={sendCode} loading={loading}>
                Envoyer le code
              </GradientButton>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Code reçu par SMS"
                placeholderTextColor={colors.muted}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <GradientButton onPress={verifyCode} loading={loading}>
                Valider le code
              </GradientButton>
              <Pressable onPress={() => setConfirmation(null)}>
                <Text style={styles.skip}>Changer de numéro</Text>
              </Pressable>
            </>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou continue avec</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            style={[
              styles.googleBtn,
              (loading || (Platform.OS !== 'web' && (!googleRequest || !googleWebClientId))) &&
                styles.socialBtnDisabled,
            ]}
            onPress={google}
            disabled={loading || (Platform.OS !== 'web' && (!googleRequest || !googleWebClientId))}
          >
            <Text style={styles.googleBtnText}>🔵 Continuer avec Google</Text>
          </Pressable>
          {Platform.OS !== 'web' && !googleWebClientId && (
            <Text style={styles.error}>
              Google Sign-In nécessite EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (voir .env.example).
            </Text>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 56, marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.secondary, textAlign: 'center' },
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
  skip: { textAlign: 'center', color: colors.primary, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.muted, fontSize: 12 },
  googleBtn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleBtnText: { color: colors.text, fontWeight: '700' },
  socialBtnDisabled: { opacity: 0.5 },
});
