/**
 * Convert BigInt values to strings for JSON serialization
 * Recursively processes objects and arrays
 */
export function convertBigIntsToStrings(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  // Preserve Date objects
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntsToStrings(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBigIntsToStrings(value);
    }
    return result;
  }

  return obj;
}

/**
 * Convert Gregorian year to Hebrew year format
 */
export function convertToHebrewYear(year) {
  if (!year || isNaN(year)) return '';
  const yearNum = parseInt(year);
  if (yearNum < 1000 || yearNum > 9999) return '';
  const hebrewYear = yearNum + 3760;
  // Simplified Hebrew year conversion
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
  let result = '';
  let remaining = hebrewYear;
  if (remaining >= 5000) {
    result += 'ה\'';
    remaining -= 5000;
  }
  const hundredsDigit = Math.floor(remaining / 100);
  if (hundredsDigit > 0 && hundredsDigit <= 4) {
    result += hundreds[hundredsDigit];
    remaining -= hundredsDigit * 100;
  }
  const tensDigit = Math.floor(remaining / 10);
  if (tensDigit > 0 && tensDigit <= 9) {
    result += tens[tensDigit];
    remaining -= tensDigit * 10;
  }
  if (remaining > 0 && remaining <= 9) {
    result += ones[remaining];
  }
  return result || '';
}

