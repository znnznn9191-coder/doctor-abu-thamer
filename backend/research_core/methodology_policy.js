const methodologyPolicy = {
  title: 'methodology_policy',
  core_rule: 'Methodological choices must align with the research problem, questions, objectives, and available evidence.',
  required_alignment: [
    'research problem',
    'research questions',
    'objectives',
    'evidence type',
    'discipline conventions',
    'source limitations'
  ],
  forbidden_behaviors: [
    'choosing a methodology unrelated to the problem',
    'pretending a design is stronger than the evidence supports',
    'ignoring source limitations or evidence boundaries',
    'confusing synthesis with proof'
  ],
  review_standard: 'Every methodological recommendation must remain transparent about assumptions, limits, and required evidence verification.'
};

module.exports = methodologyPolicy;
