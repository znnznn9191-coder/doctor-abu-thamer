const researchPrinciples = require('./research_principles');
const academicStandards = require('./academic_standards');
const sourcePolicy = require('./source_policy');
const citationPolicy = require('./citation_policy');
const evidencePolicy = require('./evidence_policy');
const methodologyPolicy = require('./methodology_policy');
const writingPolicy = require('./writing_policy');
const { buildResearchContext } = require('./research_context');
const { registerAcademicAgent, validateAcademicAgent, ensureResearchSpecialist, listRegisteredAgents } = require('./agent_registry');
const { createAcademicAgent } = require('./academic_agent_base');

module.exports = {
  researchPrinciples,
  research_principles: researchPrinciples,
  academicStandards,
  academic_standards: academicStandards,
  sourcePolicy,
  source_policy: sourcePolicy,
  citationPolicy,
  citation_policy: citationPolicy,
  evidencePolicy,
  evidence_policy: evidencePolicy,
  methodologyPolicy,
  methodology_policy: methodologyPolicy,
  writingPolicy,
  writing_policy: writingPolicy,
  buildResearchContext,
  registerAcademicAgent,
  validateAcademicAgent,
  ensureResearchSpecialist,
  listRegisteredAgents,
  createAcademicAgent
};
