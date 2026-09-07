/**
 * Standalone HTML page for the native OCR WebView bridge: loads tesseract.js from a CDN (no
 * DOM/Canvas/WASM host in the RN JS engine, so this can't run in plain JS like it does on web)
 * and relays recognize() calls in/out via postMessage, mirroring the pattern already used for
 * the Leaflet map WebView (utils/mapHtml.ts).
 */
export const TICKET_OCR_HTML = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js"></script>
<script>
  function post(msg) {
    var data = JSON.stringify(msg);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(data);
    }
  }
  function listen(handler) {
    document.addEventListener('message', handler);
    window.addEventListener('message', handler);
  }
  listen(function (event) {
    try {
      var payload = JSON.parse(event.data);
      if (payload.type === 'recognize' && payload.dataUrl && window.Tesseract) {
        Tesseract.recognize(payload.dataUrl, 'fra')
          .then(function (result) {
            post({ type: 'result', text: (result && result.data && result.data.text) || '' });
          })
          .catch(function (err) {
            post({ type: 'error', message: String((err && err.message) || err) });
          });
      }
    } catch (e) {
      post({ type: 'error', message: 'bad message' });
    }
  });
  post({ type: 'ready' });
</script>
</body>
</html>`;
