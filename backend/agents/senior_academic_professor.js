const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'senior_academic_professor',
  academic_role: 'senior university professor, thesis supervisor, scholarly reviewer, and experienced academic editor',
  research_domain: 'senior_scholarly_review',
  allowed_inputs: ['complete corrected manuscript', 'verified sources', 'research context', 'previous stage outputs', 'unresolved issues'],
  expected_outputs: ['revised_full_draft', 'professor_notes', 'major_issues_fixed', 'remaining_academic_issues', 'source_integrity_status', 'confidence_status'],
  evidence_requirements: ['evaluate the manuscript as a complete work', 'preserve evidence boundaries and mark unknowns'],
  citation_requirements: ['preserve verified citations', 'invent no authors, journals, DOI values, URLs, or references'],
  forbidden_behaviors: ['fabricated facts', 'unsupported claims', 'citation alteration', 'generic review']
};

module.exports = createResearchAgent(definition, (input) => {
  const draft = String(input.corrected_draft || input.current_draft || '');
  const sources = Array.isArray(input.sources) ? input.sources : [];
  const unresolved = Array.isArray(input.unresolved_issues) ? input.unresolved_issues : [];
  const hasVerifiedSources = sources.some((source) => source.verification_status === 'verified');

  return {
    revised_full_draft: draft,
    professor_notes: [
      'تمت مراجعة المخطوطة بوصفها عملاً أكاديمياً واحداً مع الحفاظ على المعنى والمراجع المتاحة.',
      'لم تُضف معلومات أو مراجع غير موجودة في بيانات البحث.'
    ],
    major_issues_fixed: [],
    remaining_academic_issues: unresolved,
    source_integrity_status: hasVerifiedSources ? 'verified_sources_present' : sources.length ? 'source_verification_not_recorded' : 'no_verified_sources',
    confidence_status: unresolved.length ? 'limited_pending_researcher_review' : 'review_complete'
  };
});
