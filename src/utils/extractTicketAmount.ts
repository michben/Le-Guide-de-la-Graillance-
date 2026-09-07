/**
 * Best-effort extraction of a receipt's total (TTC) amount from raw OCR text. This reads
 * whatever text is on the photo — it does not and cannot verify the photo is a genuine receipt.
 * Returns a French-formatted amount string (e.g. "14,90") or null if nothing plausible was found.
 */
export function extractTicketAmount(rawText: string): string | null {
  if (!rawText) return null;
  const text = rawText.toUpperCase();
  const lines = text.split(/\r?\n+/);
  const priceRe = /(\d{1,4}[.,]\d{2})\s*(?:€|EUR)?/;
  const priceReGlobal = /(\d{1,4}[.,]\d{2})\s*(?:€|EUR)?/g;
  const keywordRe = /(TOTAL|TTC|A\s?PAYER|NET\s?A\s?PAYER|MONTANT)/;

  const keywordAmounts: number[] = [];
  for (const line of lines) {
    if (keywordRe.test(line)) {
      const m = line.match(priceRe);
      if (m) keywordAmounts.push(parseFloat(m[1].replace(',', '.')));
    }
  }

  let amount: number | null = null;
  if (keywordAmounts.length > 0) {
    amount = Math.max(...keywordAmounts);
  } else {
    const all = [...text.matchAll(priceReGlobal)].map((m) => parseFloat(m[1].replace(',', '.')));
    if (all.length > 0) amount = Math.max(...all);
  }

  if (amount === null || Number.isNaN(amount) || amount <= 0 || amount > 2000) return null;
  return amount.toFixed(2).replace('.', ',');
}
