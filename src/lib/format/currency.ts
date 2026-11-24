/**
 * Shared storefront currency formatter. Amounts are expressed in major units
 * (for example, 1299.5 INR), matching the product API contract.
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  locale = 'en-IN'
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = /^[A-Z]{3}$/.test(currencyCode) ? currencyCode : 'INR';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(safeAmount);
  }
}
