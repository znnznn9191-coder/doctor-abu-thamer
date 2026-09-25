const { buildResearchContext, researchPrinciples, academicStandards, sourcePolicy, citationPolicy, evidencePolicy, methodologyPolicy, writingPolicy } = require('./research_context');
const { registerAcademicAgent, validateAcademicAgent } = require('./agent_registry');

function createAcademicAgent(definition) {
  if (!definition || !definition.name) {
    throw new Error('Academic agent definition requires a name.');
  }

  const researchCore = {
    research_principles: researchPrinciples,
    academic_standards: academicStandards,
    source_policy: sourcePolicy,
    citation_policy: citationPolicy,
    evidence_policy: evidencePolicy,
    methodology_policy: methodologyPolicy,
    writing_policy: writingPolicy,
    buildResearchContext
  };

  const agent = {
    ...definition,
    research_core: researchCore,
    module_type: 'academic_research_specialist'
  };

  validateAcademicAgent(agent);
  registerAcademicAgent(agent);

  return agent;
}

module.exports = {
  createAcademicAgent,
  buildResearchContext,
  researchPrinciples,
  academicStandards,
  sourcePolicy,
  citationPolicy,
  evidencePolicy,
  methodologyPolicy,
  writingPolicy
};
