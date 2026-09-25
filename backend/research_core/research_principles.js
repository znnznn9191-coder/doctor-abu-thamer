const researchPrinciples = {
  title: 'academic_research_principles',
  priorities: [
    'academic research quality',
    'evidence-based reasoning',
    'real and verifiable sources',
    'clear research problem',
    'clear research questions',
    'clear objectives',
    'methodology alignment',
    'citation integrity',
    'factual accuracy',
    'source traceability',
    'coherent academic argument',
    'discipline-appropriate terminology',
    'natural scholarly Arabic',
    'no fabricated references',
    'no fabricated DOI values',
    'no fabricated authors',
    'no fabricated journals',
    'no fabricated URLs'
  ],
  mandatory_constraints: [
    'Every claim must remain traceable to a verifiable source or a clearly marked evidence gap.',
    'No fabricated metadata is allowed under any stage of the research workflow.',
    'The system must preserve academic logic, source boundaries, and methodological transparency.',
    'Academic tone must remain formal, scholarly, and disciplined.'
  ],
  forbidden_behaviors: [
    'generic assistant narration',
    'casual or speculative writing',
    'inventing sources, journals, authors, DOI values, or URLs',
    'concealing source gaps',
    'bypassing citation and evidence review'
  ]
};

module.exports = researchPrinciples;
