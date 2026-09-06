import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, flameGradient, navyGradient, radius } from '../theme/theme';

interface GradientButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: 'flame' | 'navy';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function GradientButton({
  children,
  loading,
  disabled,
  variant = 'flame',
  style,
  textStyle,
  ...rest
}: GradientButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable disabled={isDisabled} style={[styles.wrap, isDisabled && styles.disabled, style]} {...rest}>
      <LinearGradient
        colors={variant === 'flame' ? flameGradient : navyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : typeof children === 'string' ? (
          <Text style={[styles.text, textStyle]}>{children}</Text>
        ) : (
          children
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  gradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
