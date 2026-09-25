const researchManager = require('../agents/research_manager');
const problemFraming = require('../agents/problem_framing');
const sourceDiscovery = require('../agents/source_discovery');
const literatureReview = require('../agents/literature_review');
const methodology = require('../agents/methodology');
const evidenceReview = require('../agents/evidence_review');
const citationReview = require('../agents/citation_review');
const academicEditor = require('../agents/academic_editor');
const factCheck = require('../agents/fact_check');
const finalWriter = require('../agents/final_writer');
const humanizationEditor = require('../agents/humanization_editor');
const citationIntegrity = require('../agents/citation_integrity');
const claimVerifier = require('../agents/claim_verifier');
const coherenceReviewer = require('../agents/coherence_reviewer');
const styleConsistency = require('../agents/style_consistency');
const autoRepair = require('../agents/auto_repair');
const seniorAcademicProfessor = require('../agents/senior_academic_professor');
const finalReview = require('../agents/final_review');
const submissionReadiness = require('../agents/submission_readiness');
const { buildResearchContext } = require('../research_core/research_context');
const { ensureResearchSpecialist } = require('../research_core/agent_registry');

const stageOrder = [
  { name: 'research_manager', module: researchManager },
  { name: 'problem_framing', module: problemFraming },
  { name: 'source_discovery', module: sourceDiscovery },
  { name: 'literature_review', module: literatureReview },
  { name: 'methodology', module: methodology },
  { name: 'evidence_review', module: evidenceReview },
  { name: 'citation_review', module: citationReview },
  { name: 'academic_editor', module: academicEditor },
  { name: 'fact_check', module: factCheck },
  { name: 'final_writer', module: finalWriter },
  { name: 'humanization_editor', module: humanizationEditor },
  { name: 'citation_integrity', module: citationIntegrity },
  { name: 'claim_verifier', module: claimVerifier },
  { name: 'coherence_reviewer', module: coherenceReviewer },
  { name: 'style_consistency', module: styleConsistency },
  { name: 'auto_repair', module: autoRepair },
  { name: 'senior_academic_professor', module: seniorAcademicProfessor },
  { name: 'final_review', module: finalReview },
  { name: 'submission_readiness', module: submissionReadiness }
];

function countIssues(reports) {
  const citation = reports.citation_integrity || {};
  const claims = reports.claim_verifier || {};
  const coherence = reports.coherence_reviewer || {};
  const style = reports.style_consistency || {};
  return (citation.missing_citations || []).length
    + (citation.orphan_references || []).length
    + (citation.incomplete_references || []).length
    + (citation.citation_issues || []).length
    + (claims.problematic_claims || []).length
    + (coherence.findings || []).length
    + (style.style_findings || []).length;
}

function collectUnresolved(reports, repairHistory) {
  const issues = [];
  for (const finding of (reports.claim_verifier || {}).problematic_claims || []) {
    issues.push({ type: 'claim', ...finding });
  }
  for (const finding of (reports.citation_integrity || {}).citation_issues || []) {
    issues.push({ type: 'citation', ...finding });
  }
  for (const finding of (reports.citation_integrity || {}).incomplete_references || []) {
    issues.push({ type: 'incomplete_reference', ...finding });
  }
  for (const finding of (reports.coherence_reviewer || {}).findings || []) {
    issues.push({ type: 'coherence', ...finding });
  }
  for (const finding of (reports.style_consistency || {}).style_findings || []) {
    issues.push({ type: 'style', ...finding });
  }
  for (const cycle of repairHistory) {
    for (const issue of cycle.unresolved_issues || []) issues.push(issue);
  }
  const verifiedSources = Array.isArray(reports.verified_sources) ? reports.verified_sources : [];
  if (verifiedSources.length === 0) {
    issues.push({ type: 'source_evidence_gap', reason: 'بحاجة إلى مصدر موثّق' });
  }
  return Array.from(new Map(issues.map((issue) => [JSON.stringify(issue), issue])).values());
}

async function runPipeline(research) {
  const source = research || {};
  for (const stage of stageOrder) ensureResearchSpecialist(stage.name, stage.module);

  const previousStageOutputs = {};
  const stageResults = new Map();
  const baseContext = {
    research: source,
    sources: Array.isArray(source.sources) ? source.sources : [],
    sections: Array.isArray(source.sections) ? source.sections : [],
    status: 'ready_for_review',
    previous_stage_outputs: previousStageOutputs
  };

  async function execute(stage, extra = {}) {
    const researchContext = buildResearchContext(source, previousStageOutputs, {
      field: source.field,
      research_type: source.research_type,
      academic_level: source.level || source.academic_level,
      language: source.language,
      research_problem: source.problem || source.research_problem,
      research_questions: source.research_questions,
      objectives: source.objectives,
      methodology: source.methodology,
      verified_sources: source.sources,
      evidence_status: source.evidence_status,
      unresolved_issues: source.unresolved_issues,
      source_boundaries: source.source_boundaries
    });
    const context = {
      ...baseContext,
      ...previousStageOutputs,
      ...extra,
      agent_role: stage.module.academic_role,
      previous_stage_outputs: previousStageOutputs,
      research_context: researchContext
    };
    const result = await stage.module.run(context);
    const output = result && result.output ? result.output : result;
    previousStageOutputs[stage.name] = output;
    stageResults.set(stage.name, {
      stage: stage.name,
      ok: Boolean(result) && result.ok !== false,
      output
    });
    return output;
  }

  for (const stage of stageOrder.slice(0, 10)) await execute(stage);

  const sectionDraft = baseContext.sections.map((section) => `${section.title}\n${section.content || ''}`).join('\n\n').trim();
  let currentDraft = String(source.researcher_draft || source.generated_draft || (previousStageOutputs.final_writer || {}).draft || sectionDraft || '');
  await execute(stageOrder[10], { current_draft: currentDraft, draft: currentDraft });
  currentDraft = String(previousStageOutputs.humanization_editor.humanized_draft ?? currentDraft);
  const reviewedDraft = currentDraft;

  const validationStages = stageOrder.slice(11, 15);
  const repairHistory = [];
  let repairStageOutput = null;
  let reports = {};

  async function validateDraft() {
    for (const stage of validationStages) {
      reports[stage.name] = await execute(stage, { current_draft: currentDraft, draft: currentDraft });
    }
    reports.verified_sources = buildResearchContext(source).verified_sources;
  }

  await validateDraft();
  let issuesBefore = countIssues(reports);
  let repairsUsed = 0;

  while (issuesBefore > 0 && repairsUsed < 3) {
    repairsUsed += 1;
    repairStageOutput = await execute(stageOrder[15], {
      current_draft: currentDraft,
      draft: currentDraft,
      citation_findings: reports.citation_integrity,
      claim_findings: reports.claim_verifier,
      coherence_findings: reports.coherence_reviewer,
      style_findings: reports.style_consistency,
      unresolved_issues: collectUnresolved(reports, []),
      issues_before: issuesBefore,
      repair_cycle_number: repairsUsed
    });
    const nextDraft = repairStageOutput.corrected_draft;
    if (typeof nextDraft === 'string') currentDraft = nextDraft;
    await validateDraft();
    const issuesAfter = countIssues(reports);
    repairHistory.push({
      repair_cycle_number: repairsUsed,
      issues_before: issuesBefore,
      issues_fixed: repairStageOutput.issues_fixed || [],
      unresolved_issues: repairStageOutput.unresolved_issues || [],
      issues_after: issuesAfter
    });
    issuesBefore = issuesAfter;
  }

  if (!repairStageOutput) {
    repairStageOutput = await execute(stageOrder[15], {
      current_draft: currentDraft,
      draft: currentDraft,
      citation_findings: reports.citation_integrity,
      claim_findings: reports.claim_verifier,
      coherence_findings: reports.coherence_reviewer,
      style_findings: reports.style_consistency,
      unresolved_issues: [],
      issues_before: 0,
      repair_cycle_number: 0
    });
  }
  repairStageOutput = {
    ...repairStageOutput,
    repair_cycles_used: repairsUsed,
    max_repair_cycles: 3,
    repair_cycles: repairHistory,
    unresolved_issues: collectUnresolved(reports, repairHistory)
  };
  previousStageOutputs.auto_repair = repairStageOutput;
  stageResults.set('auto_repair', { stage: 'auto_repair', ok: true, output: repairStageOutput });

  const unresolvedIssues = repairStageOutput.unresolved_issues;
  const professorOutput = await execute(stageOrder[16], {
    current_draft: currentDraft,
    corrected_draft: currentDraft,
    sources: baseContext.sources,
    unresolved_issues: unresolvedIssues
  });
  const professorDraft = String(professorOutput.revised_full_draft || currentDraft);

  const finalReviewOutput = await execute(stageOrder[17], {
    current_draft: professorDraft,
    professor_reviewed_draft: professorDraft,
    unresolved_issues: unresolvedIssues
  });
  const readiness = await execute(stageOrder[18], {
    current_draft: professorDraft,
    professor_reviewed_draft: professorDraft,
    unresolved_issues: unresolvedIssues
  });

  const stages = stageOrder.map((stage) => stageResults.get(stage.name));
  const summary = {
    title: source.title,
    research_status: readiness.status === 'READY' ? 'ready_for_submission' : readiness.status === 'BLOCKED' ? 'blocked' : 'needs_repair',
    source_status: previousStageOutputs.source_discovery && previousStageOutputs.source_discovery.source_status || 'بحاجة إلى مصدر موثّق',
    readiness_status: readiness.status,
    draft_status: readiness.status === 'READY' ? 'ready' : 'researcher_review_required'
  };

  return {
    success: stages.length === 19 && stages.every((stage) => stage && stage.ok),
    research_id: source.id,
    summary,
    stages,
    artifacts: {
      reviewed_draft: reviewedDraft,
      corrected_draft: currentDraft,
      professor_reviewed_draft: professorDraft,
      professor_notes: professorOutput.professor_notes || [],
      review_report: {
        citation_integrity: reports.citation_integrity,
        claim_verifier: reports.claim_verifier,
        coherence_reviewer: reports.coherence_reviewer,
        style_consistency: reports.style_consistency,
        final_review: finalReviewOutput,
        submission_readiness: readiness
      },
      repair_cycles: repairHistory,
      unresolved_issues: unresolvedIssues,
      readiness_status: readiness.status
    }
  };
}

module.exports = { runPipeline, stageOrder, countIssues };
