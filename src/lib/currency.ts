/**
 * Currency Utility for Simple Earn
 *
 * Country → Currency mapping follows ISO 3166-1 alpha-2 → ISO 4217.
 * Exchange rates are approximate fixed rates — replace with a live rates
 * API (e.g. Open Exchange Rates, Fixer.io) if you need real-time accuracy.
 *
 * System balances (mainBalance, gameBalance) are always stored in USD.
 */

// ─── ISO 3166-1 alpha-2 → ISO 4217 currency code ─────────────────────────────
// Full world coverage. For countries with multiple currencies the most commonly
// used / dominant one is chosen.

export const COUNTRY_CURRENCY: Record<string, string> = {
  AF: 'AFN', AX: 'EUR', AL: 'ALL', DZ: 'DZD', AS: 'USD', AD: 'EUR',
  AO: 'AOA', AI: 'XCD', AG: 'XCD', AR: 'ARS', AM: 'AMD', AW: 'AWG',
  AU: 'AUD', AT: 'EUR', AZ: 'AZN', BS: 'BSD', BH: 'BHD', BD: 'BDT',
  BB: 'BBD', BY: 'BYR', BE: 'EUR', BZ: 'BZD', BJ: 'XOF', BM: 'BMD',
  BT: 'BTN', BO: 'BOB', BQ: 'USD', BA: 'BAM', BW: 'BWP', BV: 'NOK',
  BR: 'BRL', IO: 'USD', BN: 'BND', BG: 'BGN', BF: 'XOF', BI: 'BIF',
  CV: 'CVE', KH: 'KHR', CM: 'XAF', CA: 'CAD', KY: 'KYD', CF: 'XAF',
  TD: 'XAF', CL: 'CLP', CN: 'CNY', CX: 'AUD', CC: 'AUD', CO: 'COP',
  KM: 'KMF', CG: 'XAF', CD: 'CDF', CK: 'NZD', CR: 'CRC', CI: 'XOF',
  HR: 'EUR', CU: 'CUP', CW: 'ANG', CY: 'EUR', CZ: 'CZK', DK: 'DKK',
  DJ: 'DJF', DM: 'XCD', DO: 'DOP', EC: 'USD', EG: 'EGP', SV: 'USD',
  GQ: 'XAF', ER: 'ERN', EE: 'EUR', SZ: 'SZL', ET: 'ETB', FK: 'FKP',
  FO: 'DKK', FJ: 'FJD', FI: 'EUR', FR: 'EUR', GF: 'EUR', PF: 'XPF',
  TF: 'EUR', GA: 'XAF', GM: 'GMD', GE: 'GEL', DE: 'EUR', GH: 'GHS',
  GI: 'GIP', GR: 'EUR', GL: 'DKK', GD: 'XCD', GP: 'EUR', GU: 'USD',
  GT: 'GTQ', GG: 'GBP', GN: 'GNF', GW: 'XOF', GY: 'GYD', HT: 'HTG',
  HM: 'AUD', VA: 'EUR', HN: 'HNL', HK: 'HKD', HU: 'HUF', IS: 'ISK',
  IN: 'INR', ID: 'IDR', IR: 'IRR', IQ: 'IQD', IE: 'EUR', IM: 'GBP',
  IL: 'ILS', IT: 'EUR', JM: 'JMD', JP: 'JPY', JE: 'GBP', JO: 'JOD',
  KZ: 'KZT', KE: 'KES', KI: 'AUD', KP: 'KPW', KR: 'KRW', KW: 'KWD',
  KG: 'KGS', LA: 'LAK', LV: 'EUR', LB: 'LBP', LS: 'LSL', LR: 'LRD',
  LY: 'LYD', LI: 'CHF', LT: 'EUR', LU: 'EUR', MO: 'MOP', MK: 'MKD',
  MG: 'MGA', MW: 'MWK', MY: 'MYR', MV: 'MVR', ML: 'XOF', MT: 'EUR',
  MH: 'USD', MQ: 'EUR', MR: 'MRU', MU: 'MUR', YT: 'EUR', MX: 'MXN',
  FM: 'USD', MD: 'MDL', MC: 'EUR', MN: 'MNT', ME: 'EUR', MS: 'XCD',
  MA: 'MAD', MZ: 'MZN', MM: 'MMK', NA: 'NAD', NR: 'AUD', NP: 'NPR',
  NL: 'EUR', NC: 'XPF', NZ: 'NZD', NI: 'NIO', NE: 'XOF', NG: 'NGN',
  NU: 'NZD', NF: 'AUD', MP: 'USD', NO: 'NOK', OM: 'OMR', PK: 'PKR',
  PW: 'USD', PA: 'USD', PG: 'PGK', PY: 'PYG', PE: 'PEN', PH: 'PHP',
  PN: 'NZD', PL: 'PLN', PT: 'EUR', PR: 'USD', QA: 'QAR', RE: 'EUR',
  RO: 'RON', RU: 'RUB', RW: 'RWF', BL: 'EUR', SH: 'SHP', KN: 'XCD',
  LC: 'XCD', MF: 'EUR', PM: 'EUR', VC: 'XCD', WS: 'WST', SM: 'EUR',
  ST: 'STN', SA: 'SAR', SN: 'XOF', RS: 'RSD', SC: 'SCR', SL: 'SLL',
  SG: 'SGD', SX: 'ANG', SK: 'EUR', SI: 'EUR', SB: 'SBD', SO: 'SOS',
  ZA: 'ZAR', SS: 'SSP', ES: 'EUR', LK: 'LKR', SD: 'SDG', SR: 'SRD',
  SJ: 'NOK', SE: 'SEK', CH: 'CHF', SY: 'SYP', TW: 'TWD', TJ: 'TJS',
  TZ: 'TZS', TH: 'THB', TL: 'USD', TG: 'XOF', TK: 'NZD', TO: 'TOP',
  TT: 'TTD', TN: 'TND', TR: 'TRY', TM: 'TMT', TC: 'USD', TV: 'AUD',
  UG: 'UGX', UA: 'UAH', AE: 'AED', GB: 'GBP', US: 'USD', UM: 'USD',
  UY: 'UYU', UZ: 'UZS', VU: 'VUV', VE: 'VES', VN: 'VND', VG: 'USD',
  VI: 'USD', WF: 'XPF', EH: 'MAD', YE: 'YER', ZM: 'ZMW', ZW: 'ZWL',
}

/**
 * Returns the ISO 4217 currency code for a given ISO 3166-1 alpha-2 country code.
 * Falls back to 'USD' for unknown/missing country codes.
 */
export function getCurrencyFromCountry(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode?.toUpperCase()] ?? 'USD'
}

// ─── Approximate USD exchange rates ──────────────────────────────────────────
// 1 USD = X [currency]. Approximate mid-market rates as of early 2026.
// Swap this object's values with live API data in production.

const USD_RATES: Record<string, number> = {
  USD: 1,       EUR: 0.92,    GBP: 0.79,    CHF: 0.89,
  // Africa
  RWF: 1300,    KES: 129,     UGX: 3750,    TZS: 2540,    ETB: 56,
  NGN: 1550,    GHS: 15.5,    ZAR: 18.5,    EGP: 30.9,    MAD: 10.0,
  DZD: 134,     TND: 3.1,     SDG: 601,     XOF: 604,     XAF: 604,
  MZN: 63,      ZMW: 25.5,    MWK: 1730,    BWP: 13.5,    NAD: 18.5,
  ZWL: 322,     SSP: 1430,    ERN: 15,      SZL: 18.5,    LSL: 18.5,
  GMD: 67,      GNF: 8600,    SLL: 19750,   LRD: 194,     SOS: 571,
  DJF: 178,     KMF: 450,     MGA: 4500,    MUR: 46,      SCR: 14.5,
  STN: 22,      CVE: 101,     BIF: 2870,    CDF: 2750,    AOA: 830,
  LYD: 4.8,     
  // Middle East
  AED: 3.67,    SAR: 3.75,    QAR: 3.64,    KWD: 0.307,   BHD: 0.377,
  OMR: 0.385,   JOD: 0.709,   IQD: 1310,    ILS: 3.65,    LBP: 89500,
  SYP: 13000,   IRR: 42000,   YER: 250,
  // Asia
  INR: 83,      PKR: 278,     BDT: 110,     LKR: 299,     NPR: 133,
  AFN: 71,      MVR: 15.4,    BTN: 83,      CNY: 7.24,    JPY: 149,
  KRW: 1330,    TWD: 31.8,    HKD: 7.82,    SGD: 1.34,    MYR: 4.72,
  IDR: 15700,   THB: 35.5,    VND: 24400,   PHP: 55.7,    MMK: 2100,
  KHR: 4080,    LAK: 21000,   MNT: 3450,    KZT: 451,     UZS: 12700,
  KGS: 89,      TJS: 10.9,    TMT: 3.5,     AZN: 1.7,     GEL: 2.65,
  AMD: 387,     KPW: 900,
  // Oceania
  AUD: 1.53,    NZD: 1.63,    FJD: 2.26,    PGK: 3.75,    SBD: 8.4,
  TOP: 2.35,    WST: 2.72,    VUV: 120,     XPF: 110,
  // Americas
  CAD: 1.36,    MXN: 17.1,    BRL: 4.97,    ARS: 870,     CLP: 952,
  COP: 3930,    PEN: 3.72,    UYU: 38.5,    PYG: 7300,    BOB: 6.91,
  GTQ: 7.8,     HNL: 24.7,    CRC: 521,     NIO: 36.7,    DOP: 58.8,
  HTG: 132,     JMD: 155,     TTD: 6.79,    BBD: 2.0,     XCD: 2.70,
  BSD: 1.0,     BZD: 2.0,     GYD: 209,     SRD: 36,      AWG: 1.79,
  ANG: 1.79,    KYD: 0.83,    BMD: 1.0,
  // Europe (non-EUR)
  SEK: 10.5,    NOK: 10.7,    DKK: 6.89,    ISK: 138,     CZK: 23.1,
  PLN: 4.0,     HUF: 360,     RON: 4.6,     BGN: 1.8,     HRK: 6.93,
  RSD: 107,     MKD: 56.7,    BAM: 1.8,     ALL: 97,      MDL: 17.7,
  BYR: 32000,   UAH: 38,      RUB: 90,      TRY: 32.0,    
  GIP: 0.79,    FKP: 0.79,    SHP: 0.79,
  // Pacific / other
  MOP: 8.05,    BND: 1.34,    VES: 36,      CUP: 24,      MRU: 39.5,
}

/**
 * Converts a USD amount into a local currency amount.
 * Use this for DISPLAY (balance cards, totals).
 */
export function convertUsd(amount: number, currency: string): number {
  return amount * (USD_RATES[currency] ?? 1)
}

/**
 * Converts a local currency amount into USD.
 * Use this when STORING user-entered amounts in the DB.
 * e.g. 5000 RWF → ~3.85 USD
 */
export function convertToUSD(localAmount: number, currency: string): number {
  return localAmount / (USD_RATES[currency] ?? 1)
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

const LOCALE_MAP: Record<string, string> = {
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', CHF: 'de-CH',
  RWF: 'rw-RW', KES: 'sw-KE', UGX: 'sw-UG', TZS: 'sw-TZ',
  NGN: 'en-NG', GHS: 'en-GH', ZAR: 'en-ZA', EGP: 'ar-EG',
  MAD: 'ar-MA', DZD: 'ar-DZ', TND: 'ar-TN', AED: 'ar-AE',
  SAR: 'ar-SA', QAR: 'ar-QA', IQD: 'ar-IQ', ILS: 'he-IL',
  INR: 'en-IN', PKR: 'ur-PK', BDT: 'bn-BD', LKR: 'si-LK',
  CNY: 'zh-CN', JPY: 'ja-JP', KRW: 'ko-KR', TWD: 'zh-TW',
  SGD: 'en-SG', MYR: 'ms-MY', IDR: 'id-ID', THB: 'th-TH',
  VND: 'vi-VN', PHP: 'fil-PH', AUD: 'en-AU', NZD: 'en-NZ',
  CAD: 'en-CA', BRL: 'pt-BR', MXN: 'es-MX', ARS: 'es-AR',
  CLP: 'es-CL', COP: 'es-CO', PEN: 'es-PE', TRY: 'tr-TR',
  RUB: 'ru-RU', UAH: 'uk-UA', SEK: 'sv-SE', NOK: 'nb-NO',
  DKK: 'da-DK', PLN: 'pl-PL', CZK: 'cs-CZ', HUF: 'hu-HU',
  RON: 'ro-RO',
}

// Currencies with 0 decimal places per ISO 4217
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW',
  'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

function decimals(currency: string): number {
  return ZERO_DECIMAL.has(currency) ? 0 : 2
}

/**
 * Formats a USD value converted to the user's local currency for display.
 * Use for balances (stored as USD → displayed as local).
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const d = decimals(currency)
  const locale = LOCALE_MAP[currency] ?? 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency,
    minimumFractionDigits: d, maximumFractionDigits: d,
  }).format(convertUsd(amount, currency))
}

/**
 * Formats an amount WITHOUT conversion.
 * Use for transaction history where localAmount is already in the stored currency.
 */
export function formatRaw(amount: number, currency: string = 'USD'): string {
  const d = decimals(currency)
  const locale = LOCALE_MAP[currency] ?? 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency,
    minimumFractionDigits: d, maximumFractionDigits: d,
  }).format(amount)
}