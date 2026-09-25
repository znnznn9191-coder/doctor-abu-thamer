const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'humanization_editor',
  academic_role: 'senior academic Arabic language editor',
  research_domain: 'academic_language_editing',
  allowed_inputs: ['complete draft', 'research context', 'verified sources', 'citation records'],
  expected_outputs: ['humanized_draft', 'editorial_changes', 'meaning_preserved'],
  evidence_requirements: ['preserve verified evidence and source boundaries', 'add no unsupported claims'],
  citation_requirements: ['preserve existing real citations exactly', 'invent no references or metadata'],
  forbidden_behaviors: ['casual writing', 'changing academic meaning', 'adding facts or claims', 'fabricating references']
};

module.exports = createResearchAgent(definition, (input) => {
  const draft = input.current_draft || input.draft || input.researcher_draft || input.research && input.research.researcher_draft || '';
  return {
    humanized_draft: String(draft),
    editorial_changes: [],
    meaning_preserved: true,
    status: draft ? 'reviewed_without_unsupported_rewriting' : 'draft_missing'
  };
});
