const storage = require('../services/storage');
const { runPipeline } = require('../services/research_pipeline');

async function runReview(req, res) {
  const research = storage.getResearchById(req.params.id);

  if (!research) {
    return res.status(404).json({
      success: false,
      message: 'البحث غير موجود.'
    });
  }

  try {
    const sources = storage.listSources(research.id);
    const sections = storage.listSections(research.id);

    const review = await runPipeline({
      ...research,
      sources,
      sections
    });

    const artifacts = review.artifacts || {};
    const generatedDraft = review.stages.find((stage) => stage.stage === 'final_writer')?.output?.draft || research.generated_draft || '';
    const approvedDraft = artifacts.readiness_status === 'READY'
      ? artifacts.professor_reviewed_draft
      : research.final_approved_draft;
    const readinessMessages = {
      READY: 'جاهز للتسليم',
      NEEDS_REPAIR: 'يحتاج مراجعة إضافية',
      BLOCKED: 'يحتاج مصدر موثّق'
    };

    storage.updateResearch(research.id, {
      status: review.summary.research_status,
      generated_draft: generatedDraft,
      reviewed_draft: artifacts.reviewed_draft || '',
      corrected_draft: artifacts.corrected_draft || '',
      professor_reviewed_draft: artifacts.professor_reviewed_draft || '',
      final_approved_draft: approvedDraft || '',
      review_report: artifacts.review_report || {},
      professor_notes: artifacts.professor_notes || [],
      repair_cycles: artifacts.repair_cycles || [],
      readiness_status: artifacts.readiness_status || 'NEEDS_REPAIR',
      unresolved_issues: artifacts.unresolved_issues || []
    });
    storage.recordHistory(research.id, 'review_completed', JSON.stringify(review.summary || { status: 'review_completed' }));

    return res.json({
      success: true,
      message: 'تمت مراجعة البحث بنجاح.',
      data: {
        summary: {
          ...review.summary,
          status_label: readinessMessages[artifacts.readiness_status] || 'يحتاج مراجعة إضافية',
          final_assessment: review.stages.find((stage) => stage.stage === 'final_review')?.output?.final_assessment || ''
        },
        readiness_status: artifacts.readiness_status,
        unresolved_issue_count: (artifacts.unresolved_issues || []).length
      }
    });
  } catch (error) {
    console.error('Review pipeline failed', error);
    return res.status(500).json({
      success: false,
      message: 'فشل في تنفيذ مراجعة البحث.',
      error: error.message
    });
  }
}

module.exports = {
  runReview
};
