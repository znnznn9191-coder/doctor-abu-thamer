const storage = require('../services/storage');

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

async function listSections(req, res) {
  const sections = await storage.listSections(req.params.id);
  return sendJson(res, 200, {
    success: true,
    count: sections.length,
    data: sections
  });
}

async function createSection(req, res) {
  const researchId = req.params.id;
  const item = await storage.createSection(researchId, req.body || {});

  return sendJson(res, 201, {
    success: true,
    message: 'تم إنشاء القسم بنجاح.',
    data: item
  });
}

async function updateSection(req, res) {
  const item = await storage.updateSection(req.params.id, req.body || {});

  if (!item) {
    return sendJson(res, 404, {
      success: false,
      message: 'القسم غير موجود.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'تم تحديث القسم بنجاح.',
    data: item
  });
}

async function deleteSection(req, res) {
  const deleted = await storage.deleteSection(req.params.id);

  if (!deleted) {
    return sendJson(res, 404, {
      success: false,
      message: 'القسم غير موجود.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'تم حذف القسم بنجاح.'
  });
}

module.exports = {
  listSections,
  createSection,
  updateSection,
  deleteSection
};
