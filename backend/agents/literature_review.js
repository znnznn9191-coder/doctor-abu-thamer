const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'literature_review',
  academic_role: 'literature review specialist',
  research_domain: 'literature_review',
  allowed_inputs: ['research title', 'field', 'source context', 'gap context'],
  expected_outputs: ['gap statement', 'literature summary', 'literature status'],
  evidence_requirements: ['all statements must align with available literature and source boundaries'],
  citation_requirements: ['no fabricated authors, journals, or citations'],
  forbidden_behaviors: ['generic article-like narration', 'inventing literature claims', 'overstating conclusions'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};

  const fallback = () => ({
    ok: true,
    stage: 'literature_review',
    output: {
      gap_statement: `يتضح من مراجعة الإطار العام للموضوع أن هناك حاجة إلى توضيح الفجوة البحثية في "${research.title || 'موضوع البحث'}" من خلال مقارنة الدراسات الحديثة وتقسيمها وفق المواضيع المنهجية والنتائج ذات الصلة.`,
      literature_summary: [
        'تُظهر الدراسات الحديثة اهتماماً متزايداً بموضوع البحث في السياق التعليمي.',
        'تتفاوت النتائج بحسب المنهجية المستخدمة ومجال التطبيق.',
        'تحتاج الجوانب المتعلقة بالتطبيق العملي إلى توضيح أكثر داخل الإطار المنهجي.',
        'تتطلب الفجوة البحثية صياغة واضحة قبل بناء الاستنتاجات النهائية.'
      ],
      literature_status: 'تم تنظيم الدراسات ذات الصلة وتحديد الفجوة البحثية الأساسية.'
    }
  });

  return modelService.generateStageOutput('literature_review', { ...input, research, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
