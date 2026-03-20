/**
 * Currency Utility for Simple Earn
 * Focuses on real currency conversion based on user location.
 * System values are stored in USD.
 */

export const USD_TO_RWF = 1300; // 1 USD = 1300 RWF

/**
 * Gets the currency code based on country code.
 */
export function getCurrencyFromCountry(country: string): string {
  if (country === 'RW') return 'RWF';
  if (country === 'FR') return 'EUR'; // Example for France
  return 'USD';
}

/**
 * Converts USD amount to specified currency.
 */
export function convertUsd(amount: number, currency: string): number {
  if (currency === 'RWF') return amount * USD_TO_RWF;
  if (currency === 'EUR') return amount * 0.92; // Example rate
  return amount;
}

/**
 * Formats a value to a standard currency string.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const converted = convertUsd(amount, currency);
  
  const localeMap: { [key: string]: string } = {
    'RWF': 'rw-RW',
    'EUR': 'fr-FR',
    'USD': 'en-US'
  };

  return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'RWF' ? 0 : 2,
    maximumFractionDigits: currency === 'RWF' ? 0 : 2,
  }).format(converted);
}
