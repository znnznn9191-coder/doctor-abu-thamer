const storage = require('../services/storage');

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function listSections(req, res) {
  const sections = storage.listSections(req.params.id);
  return sendJson(res, 200, {
    success: true,
    count: sections.length,
    data: sections
  });
}

function createSection(req, res) {
  const researchId = req.params.id;
  const item = storage.createSection(researchId, req.body || {});

  return sendJson(res, 201, {
    success: true,
    message: 'تم إنشاء القسم بنجاح.',
    data: item
  });
}

function updateSection(req, res) {
  const item = storage.updateSection(req.params.id, req.body || {});

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

function deleteSection(req, res) {
  const deleted = storage.deleteSection(req.params.id);

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
