const storage = require('../services/storage');

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

async function listSources(req, res) {
  const sources = await storage.listSources(req.params.id);
  return sendJson(res, 200, {
    success: true,
    count: sources.length,
    data: sources
  });
}

async function createSource(req, res) {
  const researchId = req.params.id;
  const item = await storage.createSource(researchId, req.body || {});

  return sendJson(res, 201, {
    success: true,
    message: 'تم إضافة المصدر بنجاح.',
    data: item
  });
}

async function updateSource(req, res) {
  const item = await storage.updateSource(req.params.id, req.body || {});

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

async function deleteSource(req, res) {
  const deleted = await storage.deleteSource(req.params.id);

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
