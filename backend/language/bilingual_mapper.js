const { normalizeLocale } = require('./language_core');

function mapBilingualText({ ar = '', en = '', preferredLocale = 'ar' } = {}) {
  const locale = normalizeLocale(preferredLocale);

  const arabic = String(ar || '').trim();
  const english = String(en || '').trim();

  return {
    ar: arabic,
    en: english,
    preferred_locale: locale,
    display_text:
      locale === 'en'
        ? (english || arabic)
        : (arabic || english)
  };
}

function mapSourceMetadata(source = {}) {
  return {
    title: source.title || '',
    title_ar: source.title_ar || '',
    title_en: source.title_en || '',
    authors: source.authors || '',
    year: source.year || '',
    doi: source.doi || '',
    scopus_id: source.scopus_id || '',
    source_name: source.source_name || '',
    url: source.url || '',
    language: normalizeLocale(source.language || 'en')
  };
}

module.exports = {
  mapBilingualText,
  mapSourceMetadata
};
