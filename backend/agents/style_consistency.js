const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'style_consistency',
  academic_role: 'academic manuscript style consistency specialist',
  research_domain: 'academic_style',
  allowed_inputs: ['complete manuscript', 'terminology', 'section list', 'citation style'],
  expected_outputs: ['style_findings', 'normalized_style', 'pass'],
  evidence_requirements: ['do not alter verified factual meaning'],
  citation_requirements: ['check consistency without rewriting citation metadata'],
  forbidden_behaviors: ['changing source-backed meaning', 'adding facts or references', 'casual tone']
};

module.exports = createResearchAgent(definition, (input) => {
  const draft = String(input.current_draft || input.draft || '');
  const findings = [];
  const lines = draft.split('\n');
  const seenTerms = new Map();
  const termForms = [
    ['المنصات الرقمية', /المنصات الرقمي[ةه]/g],
    ['جودة التعلم', /جودة التعل[يّ]م/g]
  ];

  for (const [canonical, pattern] of termForms) {
    const matches = [...draft.matchAll(pattern)];
    const forms = new Set(matches.map((match) => match[0]));
    if (forms.size > 1) {
      seenTerms.set(canonical, matches.length);
    }
  }
  for (const [term, count] of seenTerms) {
    findings.push({ type: 'terminology_consistency', location: 'full manuscript', term, occurrences: count, recommendation: 'Use one consistent discipline-appropriate term throughout.' });
  }

  lines.forEach((line, index) => {
    if (/[;,:]\s*[،؛]/.test(line) || /[،؛]\s*[,;]/.test(line)) {
      findings.push({ type: 'arabic_punctuation', location: `line ${index + 1}`, excerpt: line.trim(), recommendation: 'Review Arabic punctuation while preserving meaning.' });
    }
  });

  const repeatedParagraphs = new Set();
  const paragraphs = draft.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const uniqueParagraphs = paragraphs.filter((paragraph) => {
    if (repeatedParagraphs.has(paragraph)) return false;
    repeatedParagraphs.add(paragraph);
    return true;
  });
  if (uniqueParagraphs.length !== paragraphs.length) {
    findings.push({ type: 'duplicate_paragraph', location: 'full manuscript', recommendation: 'Remove exact duplicated paragraph only.' });
  }

  return {
    style_findings: findings,
    normalized_style: { tone: 'scholarly', language: 'Arabic', citation_style: input.research_context && input.research_context.citation_style || 'unspecified' },
    pass: findings.length === 0
  };
});
