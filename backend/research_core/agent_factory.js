const modelService = require('../services/model_service');
const { registerAcademicAgent } = require('./agent_registry');
const researchCore = require('./index');

function createResearchAgent(definition, buildOutput) {
  const agent = {
    ...definition,
    research_core: researchCore,
    module_type: 'academic_research_specialist',
    async run(input = {}) {
      const fallback = () => ({
        ok: true,
        stage: definition.name,
        output: buildOutput(input)
      });

      return modelService.generateStageOutput(definition.name, {
        ...input,
        agent_role: definition.academic_role
      }, fallback);
    }
  };

  registerAcademicAgent(agent);
  return agent;
}

module.exports = { createResearchAgent };
