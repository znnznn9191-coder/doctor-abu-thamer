const bibliography = require('../../data/verified-academic-sources.json');
const storage = require('./storage');
require('./research_pipeline');
const { DB_PATH, DEFAULT_PROVIDER } = require('../config');
const { listRegisteredAgents } = require('../research_core/agent_registry');

function main() {
  storage.initializeDatabase();
  const matches = storage.listResearches().filter((research) => research.title === bibliography.research_title);
  const research = matches[0] || null;
  const sources = research ? storage.listSources(research.id) : [];
  const sections = research ? storage.listSections(research.id) : [];
  const report = research ? JSON.parse(research.review_report || '{}') : {};
  const references = sections.find((section) => section.section_type === 'references');
  const registeredAgents = listRegisteredAgents();
  const sourceIds = new Set(sources.map((source) => source.id));
  const doiValues = sources.map((source) => source.doi).filter(Boolean);

  const checks = {
    sameResearchId: Boolean(research && research.id === '77e4f887-baf9-4f65-a2f0-f2dcf96cb55e'),
    exactlyOneResearch: matches.length === 1,
    fiveSourcesSaved: sources.length === 5,
    allFiveSourcesVerified: sources.length === bibliography.sources.length && sources.every((source) => source.verification_status === 'verified'),
    sourceMetadataMatchesVerifiedManifest: bibliography.sources.every((expected) => sources.some((actual) => actual.doi === expected.doi
      && actual.title === expected.title
      && actual.authors === expected.authors
      && actual.year === expected.year
      && actual.journal_or_publisher === expected.journal_or_publisher
      && actual.url === expected.url)),
    noDuplicateSources: new Set(doiValues).size === doiValues.length,
    all23SectionsPersist: sections.length === 23 && sections.every((section) => String(section.content || '').trim().length > 0),
    referencesContainExactlyTheFiveDois: Boolean(references)
      && (String(references.content).match(/10\.\d{4,9}\/[\w.\-/;()]+/g) || []).length === 5
      && bibliography.sources.every((source) => references.content.includes(source.doi)),
    citationsMapToStoredSources: report.citation_integrity
      && report.citation_integrity.valid_citations.length > 0
      && report.citation_integrity.valid_citations.every((citation) => sourceIds.has(citation.source_id)),
    citationIntegrityPass: Boolean(report.citation_integrity && report.citation_integrity.pass),
    claimVerificationPass: Boolean(report.claim_verifier && report.claim_verifier.pass),
    noUnsupportedClaims: Boolean(report.claim_verifier && report.claim_verifier.problematic_claims.length === 0),
    coherencePass: Boolean(report.coherence_reviewer && report.coherence_reviewer.pass),
    finalReviewPass: Boolean(report.final_review && report.final_review.pass),
    readinessReady: Boolean(research && research.readiness_status === 'READY' && report.submission_readiness && report.submission_readiness.status === 'READY'),
    professorDraftSaved: Boolean(research && research.professor_reviewed_draft && research.professor_reviewed_draft.length > 1000),
    finalApprovedMatchesProfessorDraft: Boolean(research && research.final_approved_draft === research.professor_reviewed_draft),
    researcherDraftPreserved: Boolean(research && research.researcher_draft && research.researcher_draft.length > 1000),
    all19AgentsRegistered: registeredAgents.length === 19,
    localProvider: DEFAULT_PROVIDER === 'local'
  };

  const result = {
    research_id: research && research.id,
    research_title: research && research.title,
    database: DB_PATH,
    sources: sources.map((source) => ({
      title: source.title,
      authors: source.authors,
      year: source.year,
      doi: source.doi,
      verification_status: source.verification_status
    })),
    source_count: sources.length,
    verified_source_count: sources.filter((source) => source.verification_status === 'verified').length,
    section_count: sections.length,
    citation_count: report.citation_integrity && report.citation_integrity.valid_citations.length,
    readiness_status: research && research.readiness_status,
    unresolved_issue_count: research ? JSON.parse(research.unresolved_issues || '[]').length : null,
    checks,
    all_checks_pass: Object.values(checks).every(Boolean)
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.all_checks_pass) process.exitCode = 1;
  return result;
}

try {
  main();
} catch (error) {
  console.error(error.stack || error);
  process.exit(1);
}
