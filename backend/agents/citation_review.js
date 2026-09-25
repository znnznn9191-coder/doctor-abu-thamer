const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'citation_review',
  academic_role: 'citation and referencing specialist',
  research_domain: 'citation_integrity',
  allowed_inputs: ['source list', 'citation text', 'research metadata'],
  expected_outputs: ['citation status', 'citation notes', 'required fields'],
  evidence_requirements: ['all cited fields must be verifiable'],
  citation_requirements: ['title, authors, year, url, doi, citation_text must be source-backed'],
  forbidden_behaviors: ['inventing authors', 'inventing DOI values', 'inventing journal names', 'inventing URLs'],
  research_core: researchCore
};

async function run(input = {}) {
  const sources = Array.isArray(input.sources) ? input.sources : [];

  const fallback = () => ({
    ok: true,
    stage: 'citation_review',
    output: {
      citation_status: sources.length > 0 ? 'تمت مراجعة تنسيق المراجع الأساسية.' : 'بحاجة إلى مصدر موثّق',
      citation_notes: [
        'يجب تنظيم المراجع وفق معيار موحد مناسب لنوع البحث.',
        'يجب التحقق من أسماء المؤلفين، السنوات، وعناوين المصادر قبل التوثيق النهائي.',
        'في حال عدم توفر بيانات مصدر مؤكدة، يظل النص "بحاجة إلى مصدر موثّق" صالحاً.'
      ],
      required_fields: ['title', 'authors', 'year', 'url', 'doi', 'citation_text']
    }
  });

  return modelService.generateStageOutput('citation_review', { ...input, sources, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
