import { createHash } from 'crypto';

/**
 * Generates Wompi integrity signature.
 * Formula: SHA256(reference + amountInCents + currency + integrityKey)
 */
export function generateWompiSignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integrityKey: string,
): string {
  const data = `${reference}${amountInCents}${currency}${integrityKey}`;
  return createHash('sha256').update(data).digest('hex');
}
