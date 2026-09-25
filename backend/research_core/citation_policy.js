const citationPolicy = {
  title: 'citation_policy',
  default_style: 'general academic referencing',
  requirements: [
    'Use only documented and verifiable source metadata.',
    'Preserve source traceability through the citation record.',
    'Cross-check title, authors, year, and publication details before citing.',
    'A missing source detail must generate an unresolved citation issue rather than a fabricated substitute.'
  ],
  forbidden_behaviors: [
    'fabricated author names',
    'fabricated DOI values',
    'fabricated journal names',
    'fabricated article titles',
    'fabricated web URLs',
    'misattributing findings to an unverified source'
  ],
  integrity_rule: 'No citation may replace evidence. Citation exists to document, not to invent or obscure, the underlying source.'
};

module.exports = citationPolicy;
