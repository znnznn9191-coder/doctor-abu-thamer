const registry = new Map();

const requiredFields = [
  'academic_role',
  'research_domain',
  'allowed_inputs',
  'expected_outputs',
  'evidence_requirements',
  'citation_requirements',
  'forbidden_behaviors'
];

function validateAcademicAgent(agentConfig) {
  const name = agentConfig && agentConfig.name ? agentConfig.name : 'unnamed_agent';

  if (!agentConfig || typeof agentConfig.run !== 'function') {
    throw new Error(`Academic agent "${name}" must expose a run() function.`);
  }

  const missing = requiredFields.filter((field) => {
    const value = agentConfig[field];
    return value === undefined || value === null || (Array.isArray(value) && value.length === 0) || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Academic agent "${name}" is missing required registration fields: ${missing.join(', ')}`);
  }

  if (!agentConfig.research_core || !agentConfig.research_core.research_principles) {
    throw new Error(`Academic agent "${name}" must inherit the shared research core.`);
  }

  return true;
}

function registerAcademicAgent(agentConfig) {
  validateAcademicAgent(agentConfig);
  registry.set(agentConfig.name, agentConfig);
  return agentConfig;
}

function getRegisteredAgent(name) {
  return registry.get(name) || null;
}

function ensureResearchSpecialist(name, agentConfig = null) {
  const registered = getRegisteredAgent(name);
  const candidate = registered;

  if (!candidate || (agentConfig && agentConfig !== registered) || typeof candidate.run !== 'function') {
    throw new Error(`The module "${name}" is not registered as an academic research specialist.`);
  }

  if (!candidate.academic_role || !candidate.research_core || candidate.name !== name) {
    throw new Error(`The module "${name}" is not valid for the research pipeline.`);
  }

  return candidate;
}

function listRegisteredAgents() {
  return Array.from(registry.values()).map((agent) => ({
    name: agent.name,
    academic_role: agent.academic_role,
    research_domain: agent.research_domain,
    uses_research_core: Boolean(agent.research_core)
  }));
}

module.exports = {
  registry,
  requiredFields,
  validateAcademicAgent,
  registerAcademicAgent,
  getRegisteredAgent,
  ensureResearchSpecialist,
  listRegisteredAgents
};
