const ProviderInterface = require('./provider_interface');

class LocalProvider extends ProviderInterface {
  constructor() {
    super('local');
  }

  async generate({ stage, context = {}, fallback } = {}) {
    const researchContext = context.research_context || {
      title: context.research && context.research.title ? context.research.title : 'بحث جديد',
      academic_standards: { title: 'academic_research_standards' },
      research_principles: { title: 'academic_research_principles' },
      source_policy: { title: 'source_policy' },
      citation_policy: { title: 'citation_policy' },
      evidence_policy: { title: 'evidence_policy' }
    };

    if (typeof fallback === 'function') {
      const result = await fallback();
      if (result) {
        return result;
      }
    }

    const research = context.research || {};
    const title = research.title || researchContext.title || 'بحث جديد';

    return {
      ok: true,
      stage,
      output: {
        provider: this.getName(),
        title,
        agent_role: context.agent_role || stage,
        research_context: researchContext,
        status: 'local_fallback',
        message: `تم تنفيذ مرحلة "${stage}" باستخدام المزود المحلي.`
      }
    };
  }
}

module.exports = LocalProvider;
