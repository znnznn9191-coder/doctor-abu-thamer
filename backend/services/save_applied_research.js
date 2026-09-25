const project = require('../../data/applied-research-project.json');
const storage = require('./storage');
const { runPipeline } = require('./research_pipeline');
const { DB_PATH, DEFAULT_PROVIDER } = require('../config');

async function main() {
  await storage.initializeDatabase();
  const matches = (await storage.listResearches()).filter((research) => research.title === project.research.title);

  if (matches.length > 1) {
    throw new Error('More than one research record has the requested title; refusing to create or update duplicates.');
  }

  let research = matches[0];
  if (!research) {
    const fullDraft = project.sections.map((section) => `${section.title}\n${section.content}`).join('\n\n');
    research = await storage.createResearch({
      ...project.research,
      researcher_draft: fullDraft,
      status: 'draft',
      readiness_status: 'BLOCKED'
    });
  }

  const savedSections = await storage.listSections(research.id);
  const savedOrders = new Set(savedSections.map((section) => Number(section.sort_order)));
  for (const section of project.sections) {
    if (!savedOrders.has(section.sort_order)) {
      await storage.createSection(research.id, section);
    }
  }

  const sections = await storage.listSections(research.id);
  if (sections.length !== 23) {
    throw new Error(`Expected 23 saved research sections; found ${sections.length}.`);
  }

  if (research.professor_reviewed_draft && research.review_report) {
    console.log(JSON.stringify({
      reusedExistingRecord: true,
      id: research.id,
      title: research.title,
      database: DB_PATH,
      sectionCount: sections.length,
      readiness: research.readiness_status,
      duplicateCount: (await storage.listResearches()).filter((item) => item.title === project.research.title).length
    }, null, 2));
    return;
  }

  const sources = await storage.listSources(research.id);
  const fullDraft = research.researcher_draft || sections.map((section) => `${section.title}\n${section.content}`).join('\n\n');
  const review = await runPipeline({ ...research, language: 'ar', sources, sections });
  const finalWriter = review.stages.find((stage) => stage.stage === 'final_writer');
  const finalApprovedDraft = review.artifacts.readiness_status === 'READY'
    ? review.artifacts.professor_reviewed_draft
    : research.final_approved_draft || '';

  const saved = await storage.updateResearch(research.id, {
    status: review.summary.research_status,
    language: 'ar',
    generated_draft: finalWriter.output.draft,
    researcher_draft: fullDraft,
    reviewed_draft: review.artifacts.reviewed_draft,
    corrected_draft: review.artifacts.corrected_draft,
    professor_reviewed_draft: review.artifacts.professor_reviewed_draft,
    final_approved_draft: finalApprovedDraft,
    review_report: review.artifacts.review_report,
    professor_notes: review.artifacts.professor_notes,
    repair_cycles: review.artifacts.repair_cycles,
    readiness_status: review.artifacts.readiness_status,
    unresolved_issues: review.artifacts.unresolved_issues
  });

  await storage.recordHistory(research.id, 'review_completed', JSON.stringify(review.summary));

  const storedSources = await storage.listSources(saved.id);
  const allResearches = await storage.listResearches();
  const result = {
    reusedExistingRecord: false,
    id: saved.id,
    title: saved.title,
    database: DB_PATH,
    provider: DEFAULT_PROVIDER,
    sectionCount: (await storage.listSections(saved.id)).length,
    sourceCount: storedSources.length,
    verifiedSourceCount: storedSources.filter((source) => source.verification_status === 'verified').length,
    stageCount: review.stages.length,
    pipelineSuccess: review.success,
    allStagesOK: review.stages.every((stage) => stage.ok),
    repairCyclesUsed: review.artifacts.repair_cycles.length,
    claimVerificationPass: review.artifacts.review_report.claim_verifier.pass,
    coherencePass: review.artifacts.review_report.coherence_reviewer.pass,
    citationIntegrityPass: review.artifacts.review_report.citation_integrity.pass,
    professorDraftLength: saved.professor_reviewed_draft.length,
    professorSourceIntegrity: review.stages.find((stage) => stage.stage === 'senior_academic_professor').output.source_integrity_status,
    finalReviewPass: review.artifacts.review_report.final_review.pass,
    readinessStatus: saved.readiness_status,
    unresolvedIssues: JSON.parse(saved.unresolved_issues).length,
    duplicateCount: allResearches.filter((item) => item.title === project.research.title).length
  };

  console.log(JSON.stringify(result, null, 2));

  if (result.sectionCount !== 23 || result.stageCount !== 19 || !result.pipelineSuccess || !result.allStagesOK || result.duplicateCount !== 1) {
    throw new Error('Saved research did not meet the required persistence and pipeline checks.');
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
