const { resolveResearchLanguages } = require('./locale_router');

function cleanQuery(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildAcademicQueries(research = {}) {
  const languages = resolveResearchLanguages(research);

  const originalQuery = cleanQuery(
    research.search_query ||
    research.title ||
    research.topic
  );

  return {
    original_query: originalQuery,
    input_language: languages.input_language,
    research_language: languages.research_language,
    source_search_language: languages.source_search_language,
    output_language: languages.output_language,

    queries: {
      ar: languages.input_language === 'ar' ? originalQuery : '',
      en: languages.input_language === 'en' ? originalQuery : ''
    }
  };
}

module.exports = {
  cleanQuery,
  buildAcademicQueries
};
