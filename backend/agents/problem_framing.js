const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'problem_framing',
  academic_role: 'research problem and question specialist',
  research_domain: 'research_design',
  allowed_inputs: ['research title', 'field', 'problem context', 'research objectives'],
  expected_outputs: ['problem statement', 'research questions', 'objectives'],
  evidence_requirements: ['problem must align with source context', 'questions must remain answerable and researchable'],
  citation_requirements: ['support problem framing with traceable evidence when available'],
  forbidden_behaviors: ['fabricating research problems', 'generic casual framing', 'ignoring evidence boundaries'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};
  const title = research.title || 'بحث جديد';

  const fallback = () => ({
    ok: true,
    stage: 'problem_framing',
    output: {
      problem_statement: `تتجلى مشكلة هذا البحث في الحاجة إلى تنظيم وتحليل موضوع "${title}" ضمن إطار أكاديمي منظم، مع تحديد الفجوة البحثية والروابط المنهجية بين المتغيرات ذات العلاقة.`,
      research_questions: [
        'ما المشكلة البحثية الأساسية التي يحاول البحث الإجابة عنها؟',
        'ما الفجوة البحثية الحالية في هذا المجال؟',
        'ما العوامل المؤثرة في موضوع البحث؟'
      ],
      objectives: [
        'تحديد مشكلة البحث بدقة.',
        'توضيح الفجوة البحثية.',
        'تجميع المؤشرات المنهجية المناسبة.',
        'تحديد الوصولات العلمية المناسبة للمملكة البحثية.'
      ]
    }
  });

  return modelService.generateStageOutput('problem_framing', { ...input, research, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
