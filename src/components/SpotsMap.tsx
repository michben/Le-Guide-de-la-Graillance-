import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { Spot } from '../types';
import { buildMapHtml, spotsToMarkers } from '../utils/mapHtml';
import { colors, radius } from '../theme/theme';

export function SpotsMap({ spots, onSelectSpot }: { spots: Spot[]; onSelectSpot: (id: string) => void }) {
  const html = useMemo(() => buildMapHtml(spotsToMarkers(spots)), [spots]);

  return (
    <View style={styles.wrap}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload.type === 'selectSpot' && payload.id) {
              onSelectSpot(payload.id);
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#DCEEDC',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
