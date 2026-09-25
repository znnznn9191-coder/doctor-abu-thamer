const bibliography = require('../../data/verified-academic-sources.json');
const storage = require('./storage');
const { runPipeline } = require('./research_pipeline');
const { DB_PATH, DEFAULT_PROVIDER } = require('../config');

async function main() {
  storage.initializeDatabase();
  const matches = storage.listResearches().filter((research) => research.title === bibliography.research_title);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one saved research with the required title; found ${matches.length}.`);
  }

  const research = matches[0];
  const expectedId = '77e4f887-baf9-4f65-a2f0-f2dcf96cb55e';
  if (research.id !== expectedId) throw new Error('The saved research ID changed; refusing to attach sources to another record.');

  const existingSources = storage.listSources(research.id);
  let sourcesAdded = 0;
  let sourcesVerified = 0;

  for (const sourceData of bibliography.sources) {
    const duplicate = existingSources.find((source) => {
      const sameDoi = String(source.doi || '').trim().toLocaleLowerCase() === sourceData.doi.toLocaleLowerCase();
      const sameIdentity = String(source.title || '').trim() === sourceData.title
        && String(source.authors || '').trim() === sourceData.authors
        && String(source.year || '').trim() === sourceData.year;
      return sameDoi || sameIdentity;
    });

    if (duplicate) {
      storage.updateSource(duplicate.id, sourceData);
    } else {
      storage.createSource(research.id, sourceData);
      sourcesAdded += 1;
    }
    sourcesVerified += 1;
  }

  const sources = storage.listSources(research.id);
  const doiValues = sources.map((source) => String(source.doi || '').trim().toLocaleLowerCase()).filter(Boolean);
  if (new Set(doiValues).size !== doiValues.length) throw new Error('Duplicate DOI records detected; pipeline will not run.');
  if (!bibliography.sources.every((item) => sources.some((source) => source.doi === item.doi && source.verification_status === 'verified'))) {
    throw new Error('A required source did not persist as verified; pipeline will not run.');
  }

  const sections = storage.listSections(research.id);
  if (sections.length !== 23) throw new Error(`Expected 23 saved sections; found ${sections.length}.`);

  let sectionsUpdated = 0;
  for (const [sectionType, content] of Object.entries(bibliography.section_updates)) {
    const section = sections.find((item) => item.section_type === sectionType);
    if (!section) throw new Error(`Required saved section is missing: ${sectionType}.`);
    if (section.content !== content) {
      storage.updateSection(section.id, { content });
      sectionsUpdated += 1;
    }
  }

  const updatedSections = storage.listSections(research.id);
  const sourcedDraft = updatedSections.map((section) => `${section.title}\n${section.content}`).join('\n\n');
  const notes = String(research.notes || '').replace(
    'لم تُجمع بيانات ميدانية ولم تُسجل مصادر متحققة بعد.',
    'لم تُجمع بيانات ميدانية؛ وأُلحقت خمسة مصادر أكاديمية متحققة، ولا تعرض المسودة نتائج تجريبية.'
  );

  const review = await runPipeline({
    ...research,
    sources,
    sections: updatedSections,
    researcher_draft: sourcedDraft,
    language: 'ar'
  });

  const finalWriter = review.stages.find((stage) => stage.stage === 'final_writer');
  const professorStage = review.stages.find((stage) => stage.stage === 'senior_academic_professor');
  const readiness = review.artifacts.readiness_status;
  const saved = storage.updateResearch(research.id, {
    status: review.summary.research_status,
    notes,
    language: 'ar',
    generated_draft: finalWriter.output.draft,
    reviewed_draft: review.artifacts.reviewed_draft,
    corrected_draft: review.artifacts.corrected_draft,
    professor_reviewed_draft: review.artifacts.professor_reviewed_draft,
    final_approved_draft: readiness === 'READY' ? review.artifacts.professor_reviewed_draft : research.final_approved_draft || '',
    review_report: review.artifacts.review_report,
    professor_notes: professorStage.output.professor_notes,
    repair_cycles: review.artifacts.repair_cycles,
    readiness_status: readiness,
    unresolved_issues: review.artifacts.unresolved_issues
  });

  storage.recordHistory(research.id, 'verified_sources_added', JSON.stringify({ added: sourcesAdded, verified: sourcesVerified }));
  storage.recordHistory(research.id, 'review_completed', JSON.stringify(review.summary));

  const report = review.artifacts.review_report;
  const result = {
    research_id: saved.id,
    research_title: saved.title,
    database: DB_PATH,
    provider: DEFAULT_PROVIDER,
    verified_sources_added: sourcesAdded,
    verified_sources_total: sources.filter((source) => source.verification_status === 'verified').length,
    source_titles: sources.filter((source) => source.verification_status === 'verified').map((source) => source.title),
    sources_with_doi: sources.filter((source) => source.verification_status === 'verified' && source.doi).map((source) => source.title),
    sources_with_stable_url_only: sources.filter((source) => source.verification_status === 'verified' && source.url && !source.doi).map((source) => source.title),
    sections_updated: sectionsUpdated,
    sections_preserved: updatedSections.length,
    in_text_citations_added: report.citation_integrity.valid_citations.length,
    registered_agents: require('../research_core/agent_registry').listRegisteredAgents().length,
    pipeline_stage_count: review.stages.length,
    pipeline_success: review.success,
    all_stages_ok: review.stages.every((stage) => stage.ok),
    repair_cycles_used: review.artifacts.repair_cycles.length,
    repair_cycles: review.artifacts.repair_cycles,
    citation_integrity: report.citation_integrity.pass,
    valid_citation_count: report.citation_integrity.valid_citations.length,
    claim_verification: report.claim_verifier.pass,
    claim_counts: {
      total: report.claim_verifier.claims.length,
      verified: report.claim_verifier.claims.filter((claim) => claim.classification === 'verified').length,
      supported: report.claim_verifier.claims.filter((claim) => claim.classification === 'supported').length,
      needs_source: report.claim_verifier.claims.filter((claim) => claim.classification === 'needs_source').length,
      unsupported: report.claim_verifier.claims.filter((claim) => claim.classification === 'unsupported').length,
      unclear: report.claim_verifier.claims.filter((claim) => claim.classification === 'unclear').length
    },
    coherence: report.coherence_reviewer.pass,
    professor: {
      revised_full_draft_saved: Boolean(saved.professor_reviewed_draft),
      draft_length: saved.professor_reviewed_draft.length,
      source_integrity_status: professorStage.output.source_integrity_status,
      professor_notes_count: JSON.parse(saved.professor_notes).length,
      remaining_academic_issues: professorStage.output.remaining_academic_issues.length
    },
    final_review: report.final_review.pass,
    readiness_status: saved.readiness_status,
    unresolved_issues: JSON.parse(saved.unresolved_issues),
    duplicate_research_count: storage.listResearches().filter((item) => item.title === bibliography.research_title).length,
    duplicate_doi_count: doiValues.length - new Set(doiValues).size
  };

  console.log(JSON.stringify(result, null, 2));
  const checks = [
    saved.id === expectedId,
    result.verified_sources_total === bibliography.sources.length,
    updatedSections.length === 23,
    review.stages.length === 19,
    review.success,
    review.stages.every((stage) => stage.ok),
    result.duplicate_research_count === 1,
    result.duplicate_doi_count === 0
  ];
  if (!checks.every(Boolean)) throw new Error('Source attachment or 19-stage review validation failed.');
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
