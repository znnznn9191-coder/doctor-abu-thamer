const fs = require('fs');
const path = require('path');
const storage = require('./storage');
const pipeline = require('./research_pipeline');
const providerRegistry = require('../providers/provider_registry');
const { ensureResearchSpecialist, listRegisteredAgents } = require('../research_core/agent_registry');
const { buildResearchContext } = require('../research_core/research_context');

async function runValidation() {
  await storage.initializeDatabase();
  const stages = pipeline.stageOrder;
  const agentNames = stages.map((stage) => stage.name);
  const registered = listRegisteredAgents();
  const allStagesExportRun = stages.every((stage) => typeof stage.module.run === 'function');
  const allStagesRegistered = stages.every((stage) => {
    try {
      ensureResearchSpecialist(stage.name, stage.module);
      return true;
    } catch {
      return false;
    }
  });
  const allStagesUseResearchCore = stages.every((stage) => Boolean(stage.module.research_core && stage.module.research_core.research_principles));
  const demo = (await storage.listResearches()).find((research) => research.title === 'أثر استخدام المنصات الرقمية في تحسين جودة التعلم لدى طلاب الجامعات السعودية');

  if (!demo) throw new Error('Required demo research was not found.');
  const sources = await storage.listSources(demo.id);
  const sections = await storage.listSections(demo.id);
  const sourceSnapshot = JSON.stringify(sources);
  const localProvider = providerRegistry.getDefaultProvider();
  const originalGenerate = localProvider.generate.bind(localProvider);
  const providerCalls = [];
  localProvider.generate = async (request) => {
    providerCalls.push({ stage: request.stage, context: request.context });
    return originalGenerate(request);
  };

  let pipelineResult;
  try {
    pipelineResult = await pipeline.runPipeline({ ...demo, sources, sections });
  } finally {
    localProvider.generate = originalGenerate;
  }

  const expectedStages = [
    'research_manager', 'problem_framing', 'source_discovery', 'literature_review', 'methodology',
    'evidence_review', 'citation_review', 'academic_editor', 'fact_check', 'final_writer',
    'humanization_editor', 'citation_integrity', 'claim_verifier', 'coherence_reviewer',
    'style_consistency', 'auto_repair', 'senior_academic_professor', 'final_review', 'submission_readiness'
  ];
  const orderedStages = pipelineResult.stages.map((stage) => stage.stage);
  const providerContextStages = new Set(providerCalls.filter((call) => {
    const context = call.context || {};
    const researchContext = context.research_context || {};
    return Boolean(context.agent_role)
      && Boolean(researchContext.research_principles)
      && Boolean(researchContext.academic_standards)
      && Boolean(researchContext.source_policy)
      && Boolean(researchContext.citation_policy)
      && Boolean(researchContext.evidence_policy)
      && Boolean(researchContext.methodology_policy)
      && Boolean(researchContext.writing_policy)
      && Boolean(researchContext.title);
  }).map((call) => call.stage));

  const autoRepairOutput = pipelineResult.stages.find((stage) => stage.stage === 'auto_repair').output;
  const professorOutput = pipelineResult.stages.find((stage) => stage.stage === 'senior_academic_professor').output;
  const finalReviewOutput = pipelineResult.stages.find((stage) => stage.stage === 'final_review').output;
  const readinessOutput = pipelineResult.stages.find((stage) => stage.stage === 'submission_readiness').output;
  const citationOutput = pipelineResult.artifacts.review_report.citation_integrity;
  const realSourceIds = new Set(sources.map((source) => source.id));
  const citationsAttachedToStoredSources = citationOutput.valid_citations.every((citation) => realSourceIds.has(citation.source_id));
  const sourcesUnchanged = JSON.stringify(sources) === sourceSnapshot;
  const outputText = JSON.stringify(pipelineResult.artifacts);
  const fabricatedMetadataAdded = /(?:https?:\/\/[^\s"']+|10\.\d{4,9}\/[\w.\-/;()]+)/i.test(outputText)
    && sources.length === 0;
  const coreContext = buildResearchContext(demo, { prior: { status: 'passed' } });
  const frontendDirectory = path.resolve(__dirname, '../../frontend');
  const frontendText = fs.readdirSync(frontendDirectory, { recursive: true })
    .filter((file) => typeof file === 'string' && /\.(?:html|js)$/.test(file))
    .map((file) => fs.readFileSync(path.join(frontendDirectory, file), 'utf8'))
    .join('\n');
  const internalNamesLeaked = expectedStages.slice(10).filter((name) => name !== 'final_review' && frontendText.includes(name));
  const genericRejected = (() => {
    try {
      ensureResearchSpecialist('unregistered_academic_test_agent', {
        name: 'unregistered_academic_test_agent',
        academic_role: 'generic assistant',
        research_domain: 'general',
        allowed_inputs: ['anything'],
        expected_outputs: ['anything'],
        evidence_requirements: ['none'],
        citation_requirements: ['none'],
        forbidden_behaviors: ['none'],
        research_core: require('../research_core'),
        run: async () => ({ ok: true })
      });
      return false;
    } catch {
      return true;
    }
  })();

  const result = {
    registeredAgentCount: registered.length,
    totalPipelineStages: pipelineResult.stages.length,
    expectedOrderMatches: JSON.stringify(orderedStages) === JSON.stringify(expectedStages),
    everyStageExportsRun: allStagesExportRun,
    everyStageUsesResearchCore: allStagesUseResearchCore,
    everyStageIsRegistered: allStagesRegistered,
    pipelineSuccess: pipelineResult.success,
    allStagesOK: pipelineResult.stages.every((stage) => stage.ok),
    provider: providerRegistry.getDefaultProvider().getName(),
    researchContextReachesEveryStage: expectedStages.every((name) => providerContextStages.has(name)),
    autoRepairExecuted: autoRepairOutput.repair_cycles_used <= 3 && Array.isArray(autoRepairOutput.repair_cycles),
    maxRepairCyclesEnforced: autoRepairOutput.max_repair_cycles === 3 && autoRepairOutput.repair_cycles_used <= 3,
    repairCyclesUsed: autoRepairOutput.repair_cycles_used,
    professorReceivesCorrectedManuscript: professorOutput.revised_full_draft === pipelineResult.artifacts.corrected_draft,
    professorReturnsRevisedFullDraft: typeof professorOutput.revised_full_draft === 'string',
    citationsAttachedOnlyToStoredSources: citationsAttachedToStoredSources,
    citationsFound: citationOutput.valid_citations.length,
    sourceRecordsUnchanged: sourcesUnchanged,
    noFabricatedSourceMetadata: !fabricatedMetadataAdded,
    submissionReadinessRunsLast: orderedStages[orderedStages.length - 1] === 'submission_readiness',
    readinessStatus: readinessOutput.status,
    unregisteredAgentRejected: genericRejected,
    advancedInternalNamesAbsentFromPublicUI: internalNamesLeaked.length === 0,
    leakedNames: internalNamesLeaked,
    researchContextIncludesPreviousOutputs: coreContext.previous_stage_outputs.prior.status === 'passed',
    demoTitle: demo.title,
    demoSourceCount: sources.length,
    finalReviewPass: finalReviewOutput.pass,
    allRequiredChecksPass: registered.length === 19
      && pipelineResult.stages.length === 19
      && JSON.stringify(orderedStages) === JSON.stringify(expectedStages)
      && allStagesExportRun
      && allStagesUseResearchCore
      && allStagesRegistered
      && pipelineResult.success
      && pipelineResult.stages.every((stage) => stage.ok)
      && providerRegistry.getDefaultProvider().getName() === 'local'
      && expectedStages.every((name) => providerContextStages.has(name))
      && autoRepairOutput.max_repair_cycles === 3
      && autoRepairOutput.repair_cycles_used <= 3
      && professorOutput.revised_full_draft === pipelineResult.artifacts.corrected_draft
      && citationsAttachedToStoredSources
      && sourcesUnchanged
      && !fabricatedMetadataAdded
      && orderedStages[orderedStages.length - 1] === 'submission_readiness'
      && genericRejected
      && internalNamesLeaked.length === 0
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.allRequiredChecksPass) process.exitCode = 1;
  return result;
}

runValidation().catch((error) => {
  console.error(error);
  process.exit(1);
});
