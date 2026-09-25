const { normalizeLocale } = require('./language_core');

function buildTranslationRequest(text, fromLocale, toLocale, options = {}) {
  const sourceText = String(text || '').trim();
  const from = normalizeLocale(fromLocale);
  const to = normalizeLocale(toLocale);

  return {
    text: sourceText,
    from,
    to,
    mode: options.mode || 'academic',
    preserve_identifiers: true,
    preserve_doi: true,
    preserve_authors: true,
    preserve_source_titles: true
  };
}

function needsTranslation(fromLocale, toLocale) {
  return normalizeLocale(fromLocale) !== normalizeLocale(toLocale);
}

module.exports = {
  buildTranslationRequest,
  needsTranslation
};
