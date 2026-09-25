const researchPrinciples = require('./research_principles');
const academicStandards = require('./academic_standards');
const sourcePolicy = require('./source_policy');
const citationPolicy = require('./citation_policy');
const evidencePolicy = require('./evidence_policy');
const methodologyPolicy = require('./methodology_policy');
const writingPolicy = require('./writing_policy');

function buildResearchContext(research = {}, previousStageOutputs = {}, extras = {}) {
  const normalized = research || {};

  return {
    title: normalized.title || 'بحث جديد',
    field: normalized.field || extras.field || 'مجال غير محدد',
    research_type: normalized.research_type || extras.research_type || 'بحث أكاديمي',
    academic_level: normalized.level || normalized.academic_level || extras.academic_level || 'غير محدد',
    language: normalized.language || extras.language || 'ar',
    research_problem: normalized.problem || normalized.research_problem || extras.research_problem || '',
    research_questions: Array.isArray(normalized.research_questions) ? normalized.research_questions : (extras.research_questions || []),
    objectives: Array.isArray(normalized.objectives) ? normalized.objectives : (extras.objectives || []),
    methodology: normalized.methodology || extras.methodology || '',
    verified_sources: (Array.isArray(normalized.sources) ? normalized.sources : (extras.verified_sources || []))
      .filter((source) => source && source.verification_status === 'verified'),
    source_records: Array.isArray(normalized.sources) ? normalized.sources : (extras.verified_sources || []),
    citation_style: normalized.citation_style || extras.citation_style || 'academic_standard',
    evidence_status: normalized.evidence_status || extras.evidence_status || 'pending_verification',
    previous_stage_outputs: previousStageOutputs || {},
    unresolved_issues: Array.isArray(normalized.unresolved_issues) ? normalized.unresolved_issues : (extras.unresolved_issues || []),
    source_boundaries: Array.isArray(normalized.source_boundaries) ? normalized.source_boundaries : (extras.source_boundaries || []),
    academic_standards: academicStandards,
    research_principles: researchPrinciples,
    source_policy: sourcePolicy,
    citation_policy: citationPolicy,
    evidence_policy: evidencePolicy,
    methodology_policy: methodologyPolicy,
    writing_policy: writingPolicy
  };
}

module.exports = {
  buildResearchContext,
  researchPrinciples,
  academicStandards,
  sourcePolicy,
  citationPolicy,
  evidencePolicy,
  methodologyPolicy,
  writingPolicy
};
