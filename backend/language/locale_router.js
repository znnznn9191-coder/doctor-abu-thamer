const { normalizeLocale, SUPPORTED_LOCALES } = require('./language_core');

function resolveResearchLanguages(research = {}) {
  const inputLanguage = normalizeLocale(research.input_language);
  const researchLanguage = normalizeLocale(
    research.research_language || inputLanguage
  );
  const sourceSearchLanguage = normalizeLocale(
    research.source_search_language || researchLanguage
  );
  const outputLanguage = normalizeLocale(
    research.output_language || researchLanguage
  );

  return {
    input_language: inputLanguage,
    research_language: researchLanguage,
    source_search_language: sourceSearchLanguage,
    output_language: outputLanguage,
    supported_locales: SUPPORTED_LOCALES
  };
}

module.exports = {
  resolveResearchLanguages
};
