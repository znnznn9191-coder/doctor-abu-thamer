const modelService = require('../services/model_service');
const researchCore = require('../research_core');

const academicRegistration = {
  name: 'research_manager',
  academic_role: 'senior research supervisor',
  research_domain: 'research_management',
  allowed_inputs: ['research', 'project metadata', 'stage outputs'],
  expected_outputs: ['workflow overview', 'research status', 'research milestones'],
  evidence_requirements: ['verify that the research object exists', 'preserve the source boundaries', 'retain final quality standards'],
  citation_requirements: ['no fabricated references', 'keep citation traceability intact'],
  forbidden_behaviors: ['generic assistant narration', 'inventing research findings', 'bypassing source verification'],
  research_core: researchCore
};

async function run(input = {}) {
  const research = input.research || {};

  const fallback = () => ({
    ok: true,
    stage: 'research_manager',
    output: {
      research_id: research.id || null,
      title: research.title || 'بحث جديد',
      status: research.status || 'draft',
      workflow: [
        'problem framing',
        'source planning',
        'literature organization',
        'methodology review',
        'evidence review',
        'citation review',
        'academic editing',
        'fact checking',
        'final writing',
        'final review'
      ],
      notes: research.notes || ''
    }
  });

  return modelService.generateStageOutput('research_manager', { ...input, research, agent_role: academicRegistration.academic_role }, fallback);
}

const agent = { ...academicRegistration, run };
researchCore.registerAcademicAgent(agent);

module.exports = agent;
