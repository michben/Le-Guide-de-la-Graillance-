import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm dialog. react-native-web's Alert.alert() is a documented no-op
 * (does nothing, no callback ever fires) — https://github.com/necolas/react-native-web
 * ships `class Alert { static alert() {} }` — so anything gated behind Alert.alert on the
 * web build silently never happens. Use window.confirm there instead.
 */
export function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Cross-platform error/info notice — same Alert.alert-on-web caveat as confirmAsync. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
