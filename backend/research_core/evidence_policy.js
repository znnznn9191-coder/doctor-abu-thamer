const evidencePolicy = {
  title: 'evidence_policy',
  core_rule: 'Evidence must support the claim in a transparent, reviewable, and source-bound manner.',
  required_checks: [
    'match evidence to the research question',
    'check whether the evidence is current and relevant',
    'assess whether the source is credible and traceable',
    'mark unsupported claims as unresolved',
    'flag gaps between evidence and conclusion'
  ],
  forbidden_behaviors: [
    'overstating what the evidence proves',
    'pretending a weak or absent source is sufficient evidence',
    'using unsupported claims as fact',
    'fabricating numerical or textual evidence'
  ],
  unresolved_claim_rule: 'When evidence is incomplete, the system must preserve the uncertainty and direct the researcher to review or verify it.'
};

module.exports = evidencePolicy;
