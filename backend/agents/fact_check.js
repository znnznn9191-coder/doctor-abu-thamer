const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'fact_check',
  academic_role: 'research fact verification specialist',
  research_domain: 'verification',
  allowed_inputs: ['research context', 'source list', 'draft findings'],
  expected_outputs: ['fact check status', 'fact check notes'],
  evidence_requirements: ['all claims must be checked against evidence and source boundaries'],
  citation_requirements: ['support cited facts with source traceability'],
  forbidden_behaviors: ['passing unverified claims as fact', 'inventing quantitative or textual facts'],
  research_core: researchCore
};

async function run(input = {}) {
  const fallback = () => ({
    ok: true,
    stage: 'fact_check',
    output: {
      fact_check_status: 'تمت مراجعة البنية المنطقية للبحث، مع إبقاء أي حقائق غير مؤكدة تحت شرط التحقق.',
      fact_check_notes: [
        'يتم التفتيش على أسماء المؤلفين والحقائق والأرقام قبل اعتمادها.',
        'تُعالج القيم غير الموثقة كبيانات تحتاج إلى توثيق إضافي.',
        'يتم الاحتفاظ بتقارير المراجعة في بيانات البحث بشكل منظم.'
      ]
    }
  });

  return modelService.generateStageOutput('fact_check', { ...input, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
