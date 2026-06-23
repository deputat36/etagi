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
