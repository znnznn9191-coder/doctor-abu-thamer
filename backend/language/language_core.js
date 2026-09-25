const SUPPORTED_LOCALES = Object.freeze({
  AR: 'ar',
  EN: 'en'
});

function normalizeLocale(locale) {
  const value = String(locale || '').trim().toLowerCase();

  if (value.startsWith('en')) return SUPPORTED_LOCALES.EN;
  return SUPPORTED_LOCALES.AR;
}

function isSupportedLocale(locale) {
  return Object.values(SUPPORTED_LOCALES).includes(normalizeLocale(locale));
}

module.exports = {
  SUPPORTED_LOCALES,
  normalizeLocale,
  isSupportedLocale
};
