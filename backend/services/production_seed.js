const project = require('../../data/applied-research-project.json');
const bibliography = require('../../data/verified-academic-sources.json');
const storage = require('./storage');
const { runPipeline } = require('./research_pipeline');

async function seedIfMissing() {
  if (!process.env.DATABASE_URL) return { seeded: false, reason: 'local_sqlite' };

  const matches = (await storage.listResearches()).filter((research) => research.title === project.research.title);
  if (matches.length > 1) {
    throw new Error('Production seed stopped because duplicate research titles already exist.');
  }
  if (matches.length === 1) {
    return { seeded: false, researchId: matches[0].id };
  }

  const savedSections = project.sections.map((section) => ({
    ...section,
    content: bibliography.section_updates[section.section_type] || section.content
  }));
  const originalResearcherDraft = project.sections.map((section) => `${section.title}\n${section.content}`).join('\n\n');
  const sourcedDraft = savedSections.map((section) => `${section.title}\n${section.content}`).join('\n\n');
  const notes = String(project.research.notes || '').replace(
    'لم تُجمع بيانات ميدانية ولم تُسجل مصادر متحققة بعد.',
    'لم تُجمع بيانات ميدانية؛ وأُلحقت خمسة مصادر أكاديمية متحققة، ولا تعرض المسودة نتائج تجريبية.'
  );
  const research = await storage.createResearch({
    ...project.research,
    notes,
    researcher_draft: originalResearcherDraft,
    status: 'draft',
    readiness_status: 'BLOCKED'
  });

  for (const section of savedSections) await storage.createSection(research.id, section);
  for (const source of bibliography.sources) await storage.createSource(research.id, source);

  const sections = await storage.listSections(research.id);
  const sources = await storage.listSources(research.id);
  const review = await runPipeline({
    ...research,
    language: 'ar',
    sources,
    sections,
    researcher_draft: sourcedDraft
  });

  const uniqueDois = new Set(sources.map((source) => source.doi));
  if (sections.length !== 23 || sources.length !== 5 || !sources.every((source) => source.verification_status === 'verified')) {
    throw new Error('Production seed did not persist 23 sections and five verified sources.');
  }
  if (uniqueDois.size !== 5) throw new Error('Production seed contains duplicate source DOI values.');
  if (review.stages.length !== 19 || !review.success || !review.stages.every((stage) => stage.ok)) {
    throw new Error('Production seed research did not pass the complete 19-stage workflow.');
  }

  const finalWriter = review.stages.find((stage) => stage.stage === 'final_writer');
  const professor = review.stages.find((stage) => stage.stage === 'senior_academic_professor').output;
  const readiness = review.artifacts.readiness_status;
  const saved = await storage.updateResearch(research.id, {
    status: review.summary.research_status,
    notes,
    language: 'ar',
    generated_draft: finalWriter.output.draft,
    reviewed_draft: review.artifacts.reviewed_draft,
    corrected_draft: review.artifacts.corrected_draft,
    professor_reviewed_draft: review.artifacts.professor_reviewed_draft,
    final_approved_draft: readiness === 'READY' ? review.artifacts.professor_reviewed_draft : '',
    review_report: review.artifacts.review_report,
    professor_notes: professor.professor_notes,
    repair_cycles: review.artifacts.repair_cycles,
    readiness_status: readiness,
    unresolved_issues: review.artifacts.unresolved_issues
  });

  await storage.recordHistory(research.id, 'verified_sources_seeded', JSON.stringify({ sourceCount: sources.length }));
  await storage.recordHistory(research.id, 'review_completed', JSON.stringify(review.summary));

  return {
    seeded: true,
    researchId: saved.id,
    sectionCount: sections.length,
    sourceCount: sources.length,
    readinessStatus: saved.readiness_status
  };
}

module.exports = { seedIfMissing };
