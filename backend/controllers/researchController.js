const storage = require('../services/storage');

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

async function listResearches(req, res) {
  const researches = await storage.listResearches();
  return sendJson(res, 200, {
    success: true,
    count: researches.length,
    data: researches
  });
}

async function createResearch(req, res) {
  const payload = req.body || {};

  if (!payload.title || String(payload.title).trim() === '') {
    return sendJson(res, 400, {
      success: false,
      message: 'عنوان البحث مطلوب.'
    });
  }

  const research = await storage.createResearch(payload);
  return sendJson(res, 201, {
    success: true,
    message: 'تم حفظ البحث بنجاح.',
    data: research
  });
}

async function getResearchById(req, res) {
  const research = await storage.getResearchById(req.params.id);

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

async function updateResearch(req, res) {
  const research = await storage.updateResearch(req.params.id, req.body || {});

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

async function deleteResearch(req, res) {
  const deleted = await storage.deleteResearch(req.params.id);

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

async function getResearchDetails(req, res) {
  const research = await storage.getResearchById(req.params.id);

  if (!research) {
    return sendJson(res, 404, {
      success: false,
      message: 'البحث غير موجود.'
    });
  }

  const sections = await storage.listSections(research.id);
  const sources = await storage.listSources(research.id);
  const history = await storage.getResearchHistory(research.id);

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
