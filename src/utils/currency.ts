export const BITS_PER_MEGA = 1_000;
export const BITS_PER_TERA = 1_000_000;

export interface DigitalCurrencyParts {
  tera: number;
  mega: number;
  bit: number;
}

/**
 * Splits a raw integer bit balance into Tera (T), Mega (M), and Bit (B).
 * 1,000 B = 1 M · 1,000 M = 1 T (1,000,000 B)
 */
export function splitDigitalCurrency(totalBits: number): DigitalCurrencyParts {
  const safe = Math.max(
    0,
    Math.floor(Number.isFinite(totalBits) ? totalBits : 0)
  );
  const tera = Math.floor(safe / BITS_PER_TERA);
  const mega = Math.floor((safe % BITS_PER_TERA) / BITS_PER_MEGA);
  const bit = safe % BITS_PER_MEGA;
  return { tera, mega, bit };
}

/**
 * Formats a raw bit amount into compact T / M / B text (e.g., "1T 250M 400B", "50M", "320B").
 */
export function formatDigitalCurrency(totalBits: number): string {
  const { tera, mega, bit } = splitDigitalCurrency(totalBits);
  const parts: string[] = [];
  if (tera > 0) parts.push(`${tera.toLocaleString('pt-BR')}T`);
  if (mega > 0) parts.push(`${mega}M`);
  if (bit > 0 || parts.length === 0) parts.push(`${bit}B`);
  return parts.join(' ');
}
