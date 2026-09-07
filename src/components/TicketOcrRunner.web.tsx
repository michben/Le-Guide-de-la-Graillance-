import { useEffect } from 'react';

/**
 * Runs OCR on `uri` (a data: URL) using tesseract.js directly in the page — we're already in a
 * full browser JS context on web, no WebView bridge needed. Renders nothing.
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
  useEffect(() => {
    if (!uri) return;
    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import('tesseract.js');
        const Tesseract = mod.default ?? mod;
        const { data } = await Tesseract.recognize(uri, 'fra');
        if (!cancelled) onResult(data.text || '');
      } catch (e) {
        if (!cancelled) onError(e instanceof Error ? e.message : 'OCR indisponible.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  return null;
}
