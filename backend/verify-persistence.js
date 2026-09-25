const path = require('path');
const Database = require('better-sqlite3');

const base = 'http://localhost:3000';
const dbPath = path.join(__dirname, 'db', 'research.db');
const db = new Database(dbPath);

async function call(pathname, options = {}) {
  const response = await fetch(base + pathname, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: response.status, json };
}

function queryDb(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

async function main() {
  const health = await call('/api/health');
  const researchesBefore = await call('/api/researches');
  const demoTitle = 'أثر استخدام المنصات الرقمية في تحسين جودة التعلم لدى طلاب الجامعات السعودية';

  const createPayload = {
    title: 'اختبار الحفظ الكامل لمنصة أبو ثامر',
    field: 'التربية والتعليم',
    research_type: 'بحث أكاديمي',
    level: 'دراسات عليا',
    notes: 'اختبار إنشاء البحث وحفظه وإعادة فتحه وتعديله.'
  };

  const created = await call('/api/researches', {
    method: 'POST',
    body: JSON.stringify(createPayload)
  });

  const createdId = created.json?.data?.id;
  const rowAfterCreate = queryDb('SELECT id, title, field, research_type, level, notes FROM researches WHERE id = ?', [createdId]);
  const getAfterCreate = await call(`/api/researches/${createdId}`);

  const updated = await call(`/api/researches/${createdId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'اختبار الحفظ الكامل لمنصة أبو ثامر',
      field: 'التربية والتعليم',
      research_type: 'بحث أكاديمي',
      level: 'دراسات عليا',
      notes: 'تم تعديل هذا البحث بعد إعادة فتحه بنجاح.'
    })
  });

  const rowsAfterUpdate = queryDb('SELECT id, title, notes FROM researches WHERE title = ?', ['اختبار الحفظ الكامل لمنصة أبو ثامر']);

  const sectionCreate = await call(`/api/researches/${createdId}/sections`, {
    method: 'POST',
    body: JSON.stringify({
      section_type: 'overview',
      title: 'قسم اختبار الحفظ',
      content: 'محتوى قسم اختبار الحفظ للتأكيد على استمرارية البيانات.',
      sort_order: 1
    })
  });
  const sectionId = sectionCreate.json?.data?.id;
  const sectionsAfterCreate = await call(`/api/researches/${createdId}/sections`);

  const sectionUpdate = await call(`/api/sections/${sectionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'قسم اختبار الحفظ المحدث',
      content: 'تم تحديث محتوى القسم بعد إعادة الفتح.',
      sort_order: 2
    })
  });

  const sourceCreate = await call(`/api/researches/${createdId}/sources`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'مصدر اختبار حفظ بيانات فقط',
      authors: 'الباحث التجريبي',
      year: '2026',
      url: 'https://example.com/demo-source',
      doi: '',
      source_type: 'مرجع أكاديمي',
      notes: 'بيانات تجريبية فقط - demo data only',
      citation_text: 'الباحث التجريبي، 2026.'
    })
  });

  const sourceId = sourceCreate.json?.data?.id;
  const sourcesAfterCreate = await call(`/api/researches/${createdId}/sources`);

  const sourceUpdate = await call(`/api/sources/${sourceId}`, {
    method: 'PUT',
    body: JSON.stringify({
      notes: 'تم تحديث المصدر بعد إعادة فتحه - بيانات تجريبية فقط.'
    })
  });

  const sourceDelete = await call(`/api/sources/${sourceId}`, { method: 'DELETE' });
  const sectionDelete = await call(`/api/sections/${sectionId}`, { method: 'DELETE' });
  const deleteResearch = await call(`/api/researches/${createdId}`, { method: 'DELETE' });
  const researchesAfterDelete = await call('/api/researches');

  const demoRows = queryDb('SELECT id, title, field, notes FROM researches WHERE title = ?', [demoTitle]);
  const demoCount = queryDb('SELECT COUNT(*) AS count FROM researches WHERE title = ?', [demoTitle]);
  const allRows = queryDb('SELECT id, title, updated_at FROM researches ORDER BY updated_at DESC');

  const result = {
    databaseFile: dbPath,
    testResearchId: createdId,
    health,
    researchesBefore,
    created,
    rowAfterCreate,
    getAfterCreate,
    updated,
    rowsAfterUpdate,
    sectionCreate,
    sectionsAfterCreate,
    sectionUpdate,
    sourceCreate,
    sourcesAfterCreate,
    sourceUpdate,
    sourceDelete,
    sectionDelete,
    deleteResearch,
    researchesAfterDelete,
    demoRows,
    demoCount,
    allRows
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
