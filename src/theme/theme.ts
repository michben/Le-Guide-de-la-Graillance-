export const colors = {
  background: '#FFF8F0',
  surface: '#FFFFFF',
  primary: '#FF5A36',
  primaryDark: '#D8431F',
  secondary: '#1B2A4A',
  accent: '#FFB800',
  success: '#2FA84F',
  muted: '#8A8A8E',
  border: '#F0E4D8',
  text: '#22201D',
  textLight: '#6B655F',
  white: '#FFFFFF',
  halal: '#2FA84F',
  avs: '#3B82F6',
  achahada: '#8B5CF6',
  bronze: '#C97B3D',
  premium: '#FFB800',
};

/** The flame gradient from the app's logo mark: warm gold tip fading into a deep red-orange base. */
export const flameGradient = ['#FFC542', '#FF5A36', '#D8431F'] as const;

/** Navy gradient for secondary actions, echoing the logo's wordmark color. */
export const navyGradient = ['#2C4270', '#1B2A4A'] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '800' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
};
