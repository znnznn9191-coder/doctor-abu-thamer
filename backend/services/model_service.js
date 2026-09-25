const { getDefaultProvider } = require('../providers/provider_registry');
const { buildResearchContext } = require('../research_core/research_context');

class ModelService {
  constructor(provider = getDefaultProvider()) {
    this.provider = provider;
  }

  getProvider() {
    return this.provider || getDefaultProvider();
  }

  async generateStageOutput(stageName, context = {}, fallbackBuilder) {
    const provider = this.getProvider();
    const research = context && context.research ? context.research : {};
    const researchContext = buildResearchContext(research, context.previous_stage_outputs || {}, {
      field: research.field,
      research_type: research.research_type,
      academic_level: research.level,
      language: research.language,
      research_problem: research.problem || research.research_problem,
      research_questions: research.research_questions,
      objectives: research.objectives,
      methodology: research.methodology,
      verified_sources: research.sources,
      evidence_status: research.evidence_status,
      unresolved_issues: research.unresolved_issues,
      source_boundaries: research.source_boundaries
    });

    const enrichedContext = {
      ...context,
      research_context: researchContext,
      academic_standards: researchContext.academic_standards,
      research_principles: researchContext.research_principles,
      source_policy: researchContext.source_policy,
      citation_policy: researchContext.citation_policy,
      evidence_policy: researchContext.evidence_policy,
      methodology_policy: researchContext.methodology_policy,
      writing_policy: researchContext.writing_policy,
      agent_role: context.agent_role || stageName
    };

    if (provider && typeof provider.generate === 'function') {
      const providerResult = await provider.generate({
        stage: stageName,
        context: enrichedContext,
        fallback: typeof fallbackBuilder === 'function' ? fallbackBuilder : null
      });

      if (providerResult && providerResult.ok !== undefined && providerResult.stage) {
        return providerResult;
      }

      if (providerResult && providerResult.output) {
        return {
          ok: true,
          stage: stageName,
          provider: provider.getName ? provider.getName() : 'local',
          output: providerResult.output
        };
      }
    }

    if (typeof fallbackBuilder === 'function') {
      const fallbackResult = await fallbackBuilder();
      if (fallbackResult) {
        return fallbackResult;
      }
    }

    return {
      ok: true,
      stage: stageName,
      provider: provider && provider.getName ? provider.getName() : 'local',
      output: {
        status: 'local_fallback',
        message: `تم تنفيذ المرحلة "${stageName}" بشكل محلي.`
      }
    };
  }
}

module.exports = new ModelService();
