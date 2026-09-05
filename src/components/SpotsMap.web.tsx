import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Spot } from '../types';
import { buildMapHtml, spotsToMarkers } from '../utils/mapHtml';
import { colors, radius } from '../theme/theme';

export function SpotsMap({ spots, onSelectSpot }: { spots: Spot[]; onSelectSpot: (id: string) => void }) {
  const html = useMemo(() => buildMapHtml(spotsToMarkers(spots)), [spots]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'selectSpot' && payload.id) {
          onSelectSpot(payload.id);
        }
      } catch {
        // ignore malformed messages
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSelectSpot]);

  return (
    <View style={styles.wrap}>
      <iframe ref={iframeRef} srcDoc={html} style={webStyle} title="Carte des spots" />
    </View>
  );
}

const webStyle: React.CSSProperties = { border: 0, width: '100%', height: '100%' };

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
});
