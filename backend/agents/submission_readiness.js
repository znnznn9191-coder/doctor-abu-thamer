const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'submission_readiness',
  academic_role: 'final academic submission readiness gate',
  research_domain: 'submission_quality_gate',
  allowed_inputs: ['professor-reviewed manuscript', 'validation reports', 'verified sources', 'research context', 'unresolved issues'],
  expected_outputs: ['status', 'reasons', 'blocking_issues', 'warnings', 'final_quality_summary'],
  evidence_requirements: ['block unsupported claims and missing evidence', 'require structure and methodological alignment'],
  citation_requirements: ['citation integrity must pass and all source metadata must be real'],
  forbidden_behaviors: ['approving fabricated or unverified sources', 'ignoring blocking findings']
};

module.exports = createResearchAgent(definition, (input) => {
  const citation = input.citation_integrity || {};
  const claims = input.claim_verifier || {};
  const coherence = input.coherence_reviewer || {};
  const professor = input.senior_academic_professor || {};
  const finalReview = input.final_review || {};
  const sources = Array.isArray(input.sources) ? input.sources : [];
  const sections = Array.isArray(input.sections) ? input.sections : [];
  const methodology = input.methodology || {};
  const draft = String(input.professor_reviewed_draft || '');
  const blocking = [];
  const warnings = [];

  if (!draft.trim()) blocking.push('المخطوطة النهائية فارغة.');
  if (sources.length === 0) blocking.push('لا توجد مصادر موثقة مرتبطة بالبحث.');
  if (sources.some((source) => source.verification_status !== 'verified')) blocking.push('توجد مصادر لم يكتمل التحقق من بياناتها.');
  if (citation.pass !== true) blocking.push('فحص سلامة الاستشهادات لم يجتز.');
  const sourceIds = new Set(sources.map((source) => source.id));
  const validCitations = citation.valid_citations || [];
  if (validCitations.length === 0 || validCitations.some((item) => !sourceIds.has(item.source_id))) blocking.push('لا توجد استشهادات داخل المتن مرتبطة بسجلات مصادر موثقة.');
  if (claims.pass !== true) blocking.push('توجد ادعاءات لم تثبت بمصادر متاحة.');
  if (coherence.pass !== true) blocking.push('بنية البحث أو اتساقه غير مكتمل.');
  if (!methodology.recommended_method || (coherence.findings || []).some((finding) => finding.type === 'methodology_alignment_unclear')) blocking.push('لم يكتمل التحقق من اتساق المنهجية مع أسئلة البحث.');
  const requiredSections = ['abstract', 'keywords', 'introduction', 'problem', 'questions', 'objectives', 'importance', 'scope', 'definitions', 'theoretical_framework', 'literature_review', 'methodology', 'population', 'sample', 'data_collection_tools', 'procedures', 'analysis_methods', 'analysis', 'discussion', 'findings', 'recommendations', 'conclusion', 'references'];
  const sectionsByType = new Map(sections.map((section) => [section.section_type, section]));
  if (requiredSections.some((type) => !sectionsByType.has(type) || !String(sectionsByType.get(type).content || '').trim())) blocking.push('لا تكتمل جميع أقسام البحث المطلوبة بمحتوى محفوظ.');
  if (professor.source_integrity_status !== 'verified_sources_present') blocking.push('لم يُسجل التحقق من مصادر موثوقة للمخطوطة.');
  if (finalReview.pass !== true) blocking.push('المراجعة الأكاديمية النهائية لم تجتز.');
  if (Array.isArray(input.unresolved_issues) && input.unresolved_issues.length) warnings.push(`${input.unresolved_issues.length} ملاحظة ما زالت بحاجة إلى مراجعة الباحث.`);

  const status = blocking.length ? 'BLOCKED' : warnings.length ? 'NEEDS_REPAIR' : 'READY';
  return {
    status,
    reasons: blocking.concat(warnings),
    blocking_issues: blocking,
    warnings,
    final_quality_summary: status === 'READY'
      ? 'استوفت المخطوطة بوابات التحقق الأكاديمي والتوثيق والبنية.'
      : status === 'NEEDS_REPAIR'
        ? 'المخطوطة قابلة للتسليم بعد إغلاق الملاحظات المتبقية.'
        : 'المخطوطة غير جاهزة للتسليم بسبب نواقص موثقة في التحقق أو البنية.'
  };
});
