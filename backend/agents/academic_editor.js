const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'academic_editor',
  academic_role: 'academic language editor',
  research_domain: 'academic_writing',
  allowed_inputs: ['research title', 'research content', 'problem statement', 'methodology'],
  expected_outputs: ['editing focus', 'editorial note'],
  evidence_requirements: ['writing must remain faithful to source-backed content'],
  citation_requirements: ['do not fabricate citation details'],
  forbidden_behaviors: ['casual tone', 'unsupported embellishment', 'generic assistant style'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};

  const fallback = () => ({
    ok: true,
    stage: 'academic_editor',
    output: {
      editing_focus: [
        'تنسيق الفقرات في أسلوب أكاديمي واضح.',
        'تدقيق صياغة مشكلة البحث وأهدافه.',
        'التأكد من ترابط الفقرات بين الإطار النظري والمنهجية.',
        'الحفاظ على اللغة العلمية بعيداً عن التكرار.'
      ],
      editorial_note: `سيتم تحسين النصوص المتعلقة بـ "${research.title || 'البحث'}" مع الحفاظ على مبدأ الدقة والمنطق الأكاديمي واستناد الفكرة إلى مصادر موثقة.`
    }
  });

  return modelService.generateStageOutput('academic_editor', { ...input, research, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
