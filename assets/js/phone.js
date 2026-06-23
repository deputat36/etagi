export function getPhoneInfo(value) {
  const clean = String(value || '').trim();
  const digits = clean.replace(/\D/g, '');
  const letters = clean.replace(/[\d\s()+\-.]/g, '');

  return {
    clean,
    digits,
    isLikelyPhone: digits.length >= 10 && digits.length <= 15,
    hasExtensionText: Boolean(letters.trim())
  };
}

export function cleanPhoneValue(value) {
  const withoutExtension = String(value || '')
    .replace(/\s*(?:доб\.?|добавочн\S*|доп\.?|вн\.?|ext\.?|extension)\s*[:#.-]?\s*\d.*$/i, '');

  return withoutExtension
    .replace(/[^\d\s()+\-.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
