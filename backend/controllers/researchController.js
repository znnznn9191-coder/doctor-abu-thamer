const storage = require('../services/storage');

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function listResearches(req, res) {
  const researches = storage.listResearches();
  return sendJson(res, 200, {
    success: true,
    count: researches.length,
    data: researches
  });
}

function createResearch(req, res) {
  const payload = req.body || {};

  if (!payload.title || String(payload.title).trim() === '') {
    return sendJson(res, 400, {
      success: false,
      message: 'عنوان البحث مطلوب.'
    });
  }

  const research = storage.createResearch(payload);
  return sendJson(res, 201, {
    success: true,
    message: 'تم حفظ البحث بنجاح.',
    data: research
  });
}

function getResearchById(req, res) {
  const research = storage.getResearchById(req.params.id);

  if (!research) {
    return sendJson(res, 404, {
      success: false,
      message: 'البحث غير موجود.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    data: research
  });
}

function updateResearch(req, res) {
  const research = storage.updateResearch(req.params.id, req.body || {});

  if (!research) {
    return sendJson(res, 404, {
      success: false,
      message: 'البحث غير موجود.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'تم تحديث البحث بنجاح.',
    data: research
  });
}

function deleteResearch(req, res) {
  const deleted = storage.deleteResearch(req.params.id);

  if (!deleted) {
    return sendJson(res, 404, {
      success: false,
      message: 'البحث غير موجود.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'تم حذف البحث بنجاح.'
  });
}

function getResearchDetails(req, res) {
  const research = storage.getResearchById(req.params.id);

  if (!research) {
    return sendJson(res, 404, {
      success: false,
      message: 'البحث غير موجود.'
    });
  }

  const sections = storage.listSections(research.id);
  const sources = storage.listSources(research.id);
  const history = storage.getResearchHistory(research.id);

  return sendJson(res, 200, {
    success: true,
    data: {
      research,
      sections,
      sources,
      history
    }
  });
}

module.exports = {
  listResearches,
  createResearch,
  getResearchById,
  updateResearch,
  deleteResearch,
  getResearchDetails
};
