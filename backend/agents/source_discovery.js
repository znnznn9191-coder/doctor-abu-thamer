const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'source_discovery',
  academic_role: 'academic source discovery specialist',
  research_domain: 'source_strategy',
  allowed_inputs: ['research context', 'available sources', 'keywords', 'discipline'],
  expected_outputs: ['source status', 'source plan', 'keywords'],
  evidence_requirements: ['only evaluated sources with a clear academic basis', 'source suitability must be explicit'],
  citation_requirements: ['no fabricated metadata', 'no fabricated URLs or DOI values'],
  forbidden_behaviors: ['inventing sources', 'inventing authors', 'fabricating DOI values or URLs'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};
  const sources = Array.isArray(input.sources) ? input.sources : [];
  const hasVerifiedSources = sources.some((source) => {
    const title = String(source.title || '').trim();
    const authors = String(source.authors || '').trim();
    const url = String(source.url || '').trim();
    const doi = String(source.doi || '').trim();
    return source.verification_status === 'verified' && Boolean(title && authors && (url || doi));
  });

  const sourceStatus = hasVerifiedSources ? 'تمت مراجعة مصادر البحث.' : 'بحاجة إلى مصدر موثّق';

  const fallback = () => ({
    ok: true,
    stage: 'source_discovery',
    output: {
      source_status: sourceStatus,
      source_plan: [
        'تحديد المصادر الأساسية في مجال البحث.',
        'تقييم صلاحية المصادر من ناحية الموثوقية.',
        'تجميع البيانات الأساسية اللازمة للتوثيق.',
        'تسجيل المراجع بطريقة منظمة ومناسبة لنوع البحث.'
      ],
      keywords: [
        research.field || 'مجال البحث',
        research.research_type || 'بحث أكاديمي',
        'دراسات حديثة',
        'مقارنة منطقية',
        'منهجية واضحة'
      ]
    }
  });

  return modelService.generateStageOutput('source_discovery', { ...input, research, sources, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
