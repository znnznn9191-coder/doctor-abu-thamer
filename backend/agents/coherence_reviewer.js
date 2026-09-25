const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'coherence_reviewer',
  academic_role: 'senior research coherence and thesis-structure reviewer',
  research_domain: 'research_coherence',
  allowed_inputs: ['title', 'research problem', 'questions', 'objectives', 'sections', 'methodology', 'analysis', 'discussion', 'conclusion'],
  expected_outputs: ['findings', 'alignment', 'pass'],
  evidence_requirements: ['conclusions must be traceable to analysis and evidence'],
  citation_requirements: ['do not infer source support from structural coherence'],
  forbidden_behaviors: ['inventing missing study sections', 'asserting alignment without inspectable content']
};

module.exports = createResearchAgent(definition, (input) => {
  const research = input.research || {};
  const sections = Array.isArray(input.sections) ? input.sections : [];
  const sectionText = sections.map((section) => `${section.section_type} ${section.title} ${section.content}`).join('\n').toLocaleLowerCase();
  const sectionTypes = new Set(sections.map((section) => String(section.section_type || '').toLocaleLowerCase()));
  const findings = [];
  const required = [
    ['problem', 'research_problem', 'مشكلة'],
    ['questions', 'research_questions', 'أسئلة'],
    ['objectives', 'objectives', 'أهداف'],
    ['literature', 'literature_review', 'دراسات'],
    ['methodology', 'methodology', 'منهج'],
    ['analysis', 'analysis', 'تحليل'],
    ['discussion', 'discussion', 'مناقشة'],
    ['conclusion', 'conclusion', 'خاتمة']
  ];

  for (const [label, type, term] of required) {
    const present = sectionTypes.has(type) || sectionText.includes(term);
    if (!present) {
      findings.push({ type: 'structural_gap', component: label, location: `section: ${label}`, reason: `No explicit ${label} content was found.`, recommendation: 'Add this section using existing research context; do not introduce unsupported findings.' });
    }
  }

  const questionCount = Array.isArray(research.research_questions) ? research.research_questions.length : 0;
  const objectiveCount = Array.isArray(research.objectives) ? research.objectives.length : 0;
  const hasAnalysis = sectionTypes.has('analysis') || sectionText.includes('تحليل');
  const hasDiscussion = sectionTypes.has('discussion') || sectionText.includes('مناقشة');
  const hasConclusion = sectionTypes.has('conclusion') || sectionText.includes('خاتمة');

  if (questionCount > 0 && !hasAnalysis && !hasConclusion) {
    findings.push({ type: 'unanswered_research_questions', component: 'research_questions', location: 'analysis/conclusion', reason: 'Research questions are present but no analysis or conclusion section addresses them.', recommendation: 'Address each question using verified evidence before drawing conclusions.' });
  }
  if (objectiveCount > 0 && !hasAnalysis && !hasDiscussion && !hasConclusion) {
    findings.push({ type: 'objectives_not_addressed', component: 'objectives', location: 'analysis/discussion/conclusion', reason: 'No analysis, discussion, or conclusion section demonstrates how the stated objectives were addressed.', recommendation: 'Map each objective to the relevant analysis using existing evidence.' });
  }
  if (hasConclusion && !hasAnalysis) {
    findings.push({ type: 'conclusion_without_analysis', component: 'conclusion', location: 'conclusion', reason: 'A conclusion is present without an identifiable analysis section.', recommendation: 'Ground conclusions in documented analysis.' });
  }

  const methodologySection = sections.find((section) => String(section.section_type || '').toLowerCase() === 'methodology');
  if (research.methodology && methodologySection && methodologySection.content && research.methodology !== methodologySection.content) {
    findings.push({ type: 'methodology_alignment_unclear', component: 'methodology', location: methodologySection.title || 'methodology', reason: 'The research-level methodology and section text differ.', recommendation: 'Reconcile both descriptions with the researcher-approved design.' });
  }

  const titleTerms = String(research.title || '').toLocaleLowerCase().split(/\s+/).filter((term) => ['المنصات', 'الرقمية', 'التعلم'].includes(term));
  if (titleTerms.length > 0 && sectionText && titleTerms.some((term) => !sectionText.includes(term))) {
    findings.push({ type: 'title_alignment_unclear', component: 'title', location: 'full manuscript', reason: 'The manuscript does not explicitly echo the topic terms in the title.', recommendation: 'Review the title-to-problem alignment using the researcher-provided content.' });
  }

  return {
    findings,
    alignment: {
      title_to_problem: research.title && (research.problem || research.research_problem) ? 'reviewable' : 'incomplete',
      problem_to_questions: research.research_questions && research.research_questions.length ? 'reviewable' : 'incomplete',
      objectives_to_methodology: research.objectives && research.methodology ? 'reviewable' : 'incomplete'
    },
    pass: findings.length === 0
  };
});
