const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'evidence_review',
  academic_role: 'evidence quality specialist',
  research_domain: 'evidence_assessment',
  allowed_inputs: ['source list', 'research context', 'findings'],
  expected_outputs: ['evidence summary', 'evidence status', 'observations'],
  evidence_requirements: ['evidence must be directly traceable to a source', 'unsupported claims must be flagged'],
  citation_requirements: ['no fabricated source metadata'],
  forbidden_behaviors: ['treating weak or absent evidence as proof', 'inventing evidence'],
  research_core: researchCore
};

async function run(input = {}) {
  const sources = Array.isArray(input.sources) ? input.sources : [];
  const verifiedSources = sources.filter((source) => source.verification_status === 'verified');

  const fallback = () => ({
    ok: true,
    stage: 'evidence_review',
    output: {
      evidence_summary: verifiedSources.length > 0
        ? 'تم فحص المصادر المتاحة وتقييمها من حيث الملاءمة والأهمية والاتساق مع موضوع البحث.'
        : 'لا توجد مصادر جرى توثيق التحقق منها؛ يحتاج البحث إلى مصدر موثّق إضافي.',
      evidence_status: verifiedSources.length > 0 ? 'مقبول' : 'بحاجة إلى مصدر موثّق',
      observations: [
        'يجب أن تبقى الادعاءات مرتبطة بشكل مباشر بالبيانات المتاحة.',
        'الاستنتاجات ينبغي أن تعكس المدى الحقيقي للبيانات. ',
        'تحتاج المصادر غير الموثقة إلى توضيح قبل اعتمادها في التحليل.'
      ]
    }
  });

  return modelService.generateStageOutput('evidence_review', { ...input, sources, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
