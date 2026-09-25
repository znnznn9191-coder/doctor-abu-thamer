const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'final_review',
  academic_role: 'final academic quality reviewer',
  research_domain: 'research_quality_control',
  allowed_inputs: ['research context', 'final draft', 'source and evidence outcomes'],
  expected_outputs: ['final assessment', 'recommendation'],
  evidence_requirements: ['no claim may pass without evidentiary or source traceability'],
  citation_requirements: ['all references must remain verifiable'],
  forbidden_behaviors: ['approving unverified claims', 'generic final impressions', 'ignoring source limits'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};
  const citation = input.citation_integrity || {};
  const claims = input.claim_verifier || {};
  const coherence = input.coherence_reviewer || {};
  const unresolved = Array.isArray(input.unresolved_issues) ? input.unresolved_issues : [];
  const pass = citation.pass === true && claims.pass === true && coherence.pass === true && unresolved.length === 0;

  const fallback = () => ({
    ok: true,
    stage: 'final_review',
    output: {
      final_assessment: `تمت مراجعة البحث "${research.title || 'البحث الحالي'}" من حيث البناء الأكاديمي، الفجوة البحثية، المنهجية، المراجع، ومقترحات الصياغة النهائية. لا يتم اعتماد أي معلومة دون توثيق مناسب.`,
      recommendation: pass ? 'اجتاز البحث فحوص المراجعة الأكاديمية المتاحة.' : 'يتطلب البحث معالجة الملاحظات الأكاديمية ومراجعة الباحث قبل اعتماده.',
      pass,
      unresolved_issue_count: unresolved.length
    }
  });

  return modelService.generateStageOutput('final_review', { ...input, research, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
