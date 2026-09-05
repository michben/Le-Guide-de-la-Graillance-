import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function LoginScreen() {
  const { login } = useApp();
  const [showWelcome, setShowWelcome] = useState(true);
  const [email, setEmail] = useState('');

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
          <TextInput
            style={styles.input}
            placeholder="Email ou téléphone"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <Pressable style={styles.primaryBtn} onPress={login}>
            <Text style={styles.primaryBtnText}>Se connecter</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou continue avec</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <Pressable style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} onPress={login}>
              <Text style={styles.socialBtnText}>Facebook</Text>
            </Pressable>
            <Pressable style={[styles.socialBtn, { backgroundColor: '#111' }]} onPress={login}>
              <Text style={styles.socialBtnText}>X</Text>
            </Pressable>
          </View>

          <Pressable onPress={login}>
            <Text style={styles.skip}>Pas de compte ? Inscris-toi</Text>
          </Pressable>
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
  socialBtnText: { color: colors.white, fontWeight: '700' },
  skip: { textAlign: 'center', color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
});
