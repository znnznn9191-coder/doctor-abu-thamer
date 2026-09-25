const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'final_writer',
  academic_role: 'academic synthesis writer',
  research_domain: 'academic_writing',
  allowed_inputs: ['research overview', 'problem frame', 'methodology', 'evidence review', 'citation review', 'fact check'],
  expected_outputs: ['draft_title', 'draft_summary', 'draft', 'unsupported_claims', 'researcher_edit_required'],
  evidence_requirements: ['only use source-backed findings', 'flag unsupported claims clearly'],
  citation_requirements: ['never fabricate sources, journals, DOI values, authors, or URLs'],
  forbidden_behaviors: ['inventing citations', 'unsupported certainty', 'generic assistant synthesis'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};
  const problem = input.problem_framing || {};
  const literature = input.literature_review || {};
  const methodology = input.methodology || {};
  const evidence = input.evidence_review || {};
  const citation = input.citation_review || {};
  const academic = input.academic_editor || {};
  const factCheck = input.fact_check || {};
  const sectionDraft = Array.isArray(input.sections)
    ? input.sections.map((section) => `${section.title}\n${section.content || ''}`).join('\n\n').trim()
    : '';
  const existingDraft = research.researcher_draft || research.generated_draft || '';
  const synthesizedDraft = [
    `تتعلق هذه الدراسة بـ "${research.title || 'البحث'}" ومن الضروري الإبقاء على إطارها البحثي منضبطاً، مع التزام واضح بالأهداف المنهجية وقيود التوثيق.`,
    problem.problem_statement || 'يُعد هذا البحث محلاً للدراسة وفق أسس علمية واضحة ومحددة.',
    methodology.recommended_method || 'يُقترح اعتماد منهج مناسب يضمن الاتساق بين الإطار النظري ومخرجات التحليل.',
    literature.gap_statement || 'تتطلب الفجوة البحثية تحليلاً موثقاً قبل صياغة الاستنتاجات.'
  ].join(' ');

  const fallbackDraft = () => ({
    ok: true,
    stage: 'final_writer',
    output: {
      draft_title: research.title || 'بحث جديد',
      draft_summary: `هذه النسخة النهائية هي صياغة أكاديمية منسقة لموضوع "${research.title || 'البحث'}"، وتستند إلى عناصر المشكلة، الأهداف، المنهجية، الأدلة، والمراجع المتاحة فقط.`,
      draft: existingDraft || sectionDraft || synthesizedDraft,
      unsupported_claims: [
        'يجب توثيق أي ادعاء لا يتوافر له مصدر موثوق في قاعدة البيانات الحالية.',
        'يُبقي البحث أي بيانات غير مؤكدة في قائمة مراجعة إضافية قبل اعتمادها في الخاتمة.'
      ],
      researcher_edit_required: true,
      status: 'draft_ready'
    }
  });

  return modelService.generateStageOutput('final_writer', {
    ...input,
    research,
    problem_framing: problem,
    literature_review: literature,
    methodology,
    evidence_review: evidence,
    citation_review: citation,
    academic_editor: academic,
    fact_check: factCheck,
    agent_role: academicRegistration.academic_role
  }, fallbackDraft);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
