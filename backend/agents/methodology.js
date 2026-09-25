const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'methodology',
  academic_role: 'research methodology specialist',
  research_domain: 'research_design',
  allowed_inputs: ['research title', 'problem', 'objectives', 'field', 'available evidence'],
  expected_outputs: ['recommended method', 'design notes', 'suitability'],
  evidence_requirements: ['methodology must match the problem and evidence type'],
  citation_requirements: ['citations only when source-backed'],
  forbidden_behaviors: ['inventing methodology claims', 'ignoring evidence limits', 'generic advice'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};

  const fallback = () => ({
    ok: true,
    stage: 'methodology',
    output: {
      recommended_method: 'منهج وصفي تحليلي يركز على مراجعة الأدبيات ذات الصلة وتحليل المخرجات العلمية في سياق الموضوع.',
      design_notes: [
        'تحديد المتغيرات الرئيسية في موضوع البحث.',
        'مقارنة الأدبيات العلمية الحديثة.',
        'بناء صلة واضحة بين المشكلة والأهداف.',
        'تقسيم النتائج إلى محاور يتم توضيحها داخل الإطار التحليلي.'
      ],
      suitability: `المنهج المقترح مناسب لطبيعة "${research.title || 'البحث الحالي'}" واستهدافه بناء رؤية أكاديمية منظمة ومثبتة بالدلائل العلمية.`
    }
  });

  return modelService.generateStageOutput('methodology', { ...input, research, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
