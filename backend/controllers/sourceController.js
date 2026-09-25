const storage = require('../services/storage');

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function listSources(req, res) {
  const sources = storage.listSources(req.params.id);
  return sendJson(res, 200, {
    success: true,
    count: sources.length,
    data: sources
  });
}

function createSource(req, res) {
  const researchId = req.params.id;
  const item = storage.createSource(researchId, req.body || {});

  return sendJson(res, 201, {
    success: true,
    message: 'تم إضافة المصدر بنجاح.',
    data: item
  });
}

function updateSource(req, res) {
  const item = storage.updateSource(req.params.id, req.body || {});

  if (!item) {
    return sendJson(res, 404, {
      success: false,
      message: 'المصدر غير موجود.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'تم تحديث المصدر بنجاح.',
    data: item
  });
}

function deleteSource(req, res) {
  const deleted = storage.deleteSource(req.params.id);

  if (!deleted) {
    return sendJson(res, 404, {
      success: false,
      message: 'المصدر غير موجود.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'تم حذف المصدر بنجاح.'
  });
}

module.exports = {
  listSources,
  createSource,
  updateSource,
  deleteSource
};
