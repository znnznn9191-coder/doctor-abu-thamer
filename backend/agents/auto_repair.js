const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'auto_repair',
  academic_role: 'automated academic correction specialist',
  research_domain: 'academic_quality_repair',
  allowed_inputs: ['current full draft', 'citation findings', 'claim findings', 'coherence findings', 'style findings', 'verified sources', 'research context'],
  expected_outputs: ['corrected_draft', 'issues_fixed', 'unresolved_issues', 'issues_before', 'issues_after', 'repair_cycle_number'],
  evidence_requirements: ['repair only issues supported by existing context', 'remove or qualify unsupported claims without inventing support'],
  citation_requirements: ['preserve real citations and source metadata exactly'],
  forbidden_behaviors: ['fabricating sources', 'fabricating evidence', 'inventing missing manuscript content']
};

module.exports = createResearchAgent(definition, (input) => {
  let correctedDraft = String(input.current_draft || input.draft || '');
  const claimReport = input.claim_findings || {};
  const styleReport = input.style_findings || {};
  const fixed = [];
  const unresolved = [];

  for (const claim of claimReport.problematic_claims || []) {
    if (!claim.claim || !correctedDraft.includes(claim.claim)) {
      unresolved.push({ type: 'claim_needs_source', claim: claim.claim || '', reason: claim.reason || 'Claim requires researcher review.' });
      continue;
    }
    correctedDraft = correctedDraft.replace(claim.claim, '').replace(/\s{2,}/g, ' ').trim();
    fixed.push({ type: 'unsupported_claim_removed', claim: claim.claim });
    unresolved.push({ type: 'claim_removed_pending_source', claim: claim.claim, reason: 'The statement was removed because no verified source was available; researcher may restore it after sourcing.' });
  }

  const paragraphs = correctedDraft.split(/\n\s*\n/);
  const uniqueParagraphs = [];
  for (const paragraph of paragraphs) {
    const value = paragraph.trim();
    if (value && !uniqueParagraphs.includes(value)) uniqueParagraphs.push(value);
    else if (value) fixed.push({ type: 'duplicate_paragraph_removed' });
  }
  correctedDraft = uniqueParagraphs.join('\n\n');

  for (const issue of styleReport.style_findings || []) {
    if (issue.type !== 'duplicate_paragraph') unresolved.push({ type: issue.type, location: issue.location, reason: 'Requires careful editorial or researcher review; not changed automatically.' });
  }

  for (const finding of (input.coherence_findings || {}).findings || []) {
    unresolved.push({ type: finding.type, component: finding.component, reason: finding.reason });
  }

  const cycle = Number(input.repair_cycle_number || 1);
  return {
    corrected_draft: correctedDraft,
    issues_before: Number(input.issues_before || 0),
    issues_fixed: fixed,
    unresolved_issues: unresolved,
    issues_after: unresolved.length,
    repair_cycle_number: Math.min(3, Math.max(0, cycle)),
    max_repair_cycles: 3
  };
});
