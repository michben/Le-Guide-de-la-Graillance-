import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';
import { TICKET_OCR_HTML } from '../utils/ticketOcrHtml';

/**
 * Runs OCR on `uri` (a data: URL) via a hidden WebView loading tesseract.js from a CDN — the RN
 * JS engine has no WASM/Canvas host to run tesseract.js directly like the web build does, so a
 * real browser context (the WebView) does the work instead. Renders a 0x0 hidden WebView.
 */
export function TicketOcrRunner({
  uri,
  onResult,
  onError,
}: {
  uri: string | null;
  onResult: (text: string) => void;
  onError: (message: string) => void;
}) {
  // Typed `any` — react-native-webview's platform-specific ref/prop overloads don't resolve
  // cleanly through plain tsc (Metro applies the right one at bundle time); only .postMessage
  // is used here, so the precise type isn't load-bearing.
  const webviewRef = useRef<any>(null);
  const readyRef = useRef(false);
  const pendingUriRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uri) return;
    if (readyRef.current) {
      webviewRef.current?.postMessage(JSON.stringify({ type: 'recognize', dataUrl: uri }));
    } else {
      pendingUriRef.current = uri;
    }
  }, [uri]);

  if (!uri) return null;

  return (
    <View style={{ width: 0, height: 0, opacity: 0 }}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: TICKET_OCR_HTML }}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload.type === 'ready') {
              readyRef.current = true;
              if (pendingUriRef.current) {
                webviewRef.current?.postMessage(
                  JSON.stringify({ type: 'recognize', dataUrl: pendingUriRef.current })
                );
                pendingUriRef.current = null;
              }
            } else if (payload.type === 'result') {
              onResult(payload.text || '');
            } else if (payload.type === 'error') {
              onError(payload.message || 'OCR indisponible.');
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
}
