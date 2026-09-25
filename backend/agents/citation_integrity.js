const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'citation_integrity',
  academic_role: 'academic citation and reference integrity specialist',
  research_domain: 'citation_integrity',
  allowed_inputs: ['complete manuscript', 'stored sources', 'research sections', 'citation style'],
  expected_outputs: ['valid_citations', 'missing_citations', 'orphan_references', 'incomplete_references', 'citation_issues', 'pass'],
  evidence_requirements: ['match citation claims only to stored source records'],
  citation_requirements: ['never invent missing bibliographic data', 'flag exact locations and quote page gaps'],
  forbidden_behaviors: ['fabricated authors, titles, journals, DOI values, URLs, or page numbers']
};

function sourceMatchesCitation(source, citation) {
  const normalized = citation.toLocaleLowerCase();
  const citationText = String(source.citation_text || '').toLocaleLowerCase();
  if (citationText && normalized.includes(citationText)) return true;

  const firstAuthor = String(source.authors || '').split(';')[0].trim().split(/\s+/).pop().toLocaleLowerCase();
  const year = String(source.year || '').trim();
  return Boolean(firstAuthor && year && normalized.includes(firstAuthor) && normalized.includes(year));
}

module.exports = createResearchAgent(definition, (input) => {
  const draft = String(input.current_draft || input.draft || '');
  const sources = Array.isArray(input.sources) ? input.sources : input.research_context && input.research_context.verified_sources || [];
  const referencesStart = draft.search(/^(?:المصادر والمراجع|references)\s*$/im);
  const manuscriptBody = referencesStart >= 0 ? draft.slice(0, referencesStart) : draft;
  const citations = [];
  const citationPattern = /\[(\d+(?:\s*[,;–-]\s*\d+)*)\]|\(([^()]{2,100}?\b(?:19|20)\d{2}[a-z]?[^()]*)\)/g;
  let match;

  while ((match = citationPattern.exec(manuscriptBody)) !== null) {
    const lineStart = manuscriptBody.lastIndexOf('\n', match.index - 1) + 1;
    const precedingText = manuscriptBody.slice(lineStart, match.index).trim();
    citations.push({ text: match[0], start: match.index, line: manuscriptBody.slice(0, match.index).split('\n').length, beginsLine: precedingText.length === 0 });
  }

  const validCitations = [];
  const missingCitations = [];
  const citationIssues = [];
  for (const citation of citations) {
    const source = sources.find((item) => sourceMatchesCitation(item, citation.text));
    if (source) {
      validCitations.push({ citation: citation.text, source_id: source.id || null, line: citation.line });
    } else {
      missingCitations.push({ citation: citation.text, line: citation.line });
      citationIssues.push({ type: 'citation_without_matching_source', location: `line ${citation.line}`, excerpt: citation.text });
    }
    if (citation.beginsLine) {
      citationIssues.push({ type: 'possible_citation_placement_problem', location: `line ${citation.line}`, excerpt: citation.text, reason: 'Citation begins the line before an attributable claim.' });
    }
  }

  const citedSourceIds = new Set(validCitations.map((citation) => citation.source_id).filter(Boolean));
  const orphanReferences = sources.filter((source) => !citedSourceIds.has(source.id))
    .map((source) => ({ source_id: source.id || null, title: source.title || '' }));

  const requiredFields = ['title', 'authors', 'year', 'journal_or_publisher', 'source_type', 'url'];
  const incompleteReferences = sources.filter((source) => requiredFields.some((field) => !String(source[field] || '').trim()))
    .map((source) => ({ source_id: source.id || null, title: source.title || '', missing_fields: requiredFields.filter((field) => !String(source[field] || '').trim()) }));
  const unverifiedReferences = sources.filter((source) => source.verification_status !== 'verified')
    .map((source) => ({ source_id: source.id || null, title: source.title || '', verification_status: source.verification_status || 'needs_verification' }));

  for (const quoteMatch of manuscriptBody.matchAll(/[«"]([^»"]{8,})[»"]/g)) {
    if (!/ص\s*[.:：]?\s*\d+|p{1,2}\.\s*\d+/i.test(quoteMatch[0])) {
      const line = manuscriptBody.slice(0, quoteMatch.index).split('\n').length;
      citationIssues.push({ type: 'direct_quote_missing_page', location: `line ${line}`, excerpt: quoteMatch[0] });
    }
  }

  return {
    valid_citations: validCitations,
    missing_citations: missingCitations,
    orphan_references: orphanReferences,
    incomplete_references: incompleteReferences,
    unverified_references: unverifiedReferences,
    citation_issues: citationIssues,
    pass: missingCitations.length === 0 && orphanReferences.length === 0 && incompleteReferences.length === 0 && unverifiedReferences.length === 0 && citationIssues.length === 0
  };
});
