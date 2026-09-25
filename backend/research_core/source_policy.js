const sourcePolicy = {
  title: 'source_policy',
  primary_rule: 'Sources must be real, relevant, and traceable to the research problem, questions, and methodology.',
  minimum_source_requirements: [
    'title',
    'authors or source institution',
    'year or date',
    'source type',
    'relevance to the research question',
    'clear notes explaining why it is used'
  ],
  forbidden_actions: [
    'inventing a source title',
    'inventing authors',
    'inventing journal names',
    'inventing URL values',
    'inventing DOI values',
    'using unverifiable web content as a confirmed academic source'
  ],
  verification_standard: 'A source may be used only when it is clearly identifiable and supports the academic claim without fabrication or ambiguity.'
};

module.exports = sourcePolicy;
