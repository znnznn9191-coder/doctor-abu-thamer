if (process.env.DATABASE_URL) {
  module.exports = require('./postgres_storage');
} else {
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const { DB_PATH } = require('../config');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function now() {
  return new Date().toISOString();
}

function getId() {
  return uuidv4();
}

function persistValue(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS researches (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      field TEXT,
      research_type TEXT,
      level TEXT,
      language TEXT DEFAULT 'ar',
      notes TEXT,
      status TEXT DEFAULT 'draft',
      generated_draft TEXT,
      researcher_draft TEXT,
      reviewed_draft TEXT,
      corrected_draft TEXT,
      professor_reviewed_draft TEXT,
      final_approved_draft TEXT,
      review_report TEXT DEFAULT '{}',
      professor_notes TEXT DEFAULT '[]',
      repair_cycles TEXT DEFAULT '[]',
      readiness_status TEXT DEFAULT 'NEEDS_REPAIR',
      unresolved_issues TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_sections (
      id TEXT PRIMARY KEY,
      research_id TEXT NOT NULL,
      section_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (research_id) REFERENCES researches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS research_sources (
      id TEXT PRIMARY KEY,
      research_id TEXT NOT NULL,
      title TEXT,
      authors TEXT,
      year TEXT,
      journal_or_publisher TEXT DEFAULT '',
      url TEXT,
      doi TEXT,
      source_type TEXT,
      citation_text TEXT,
      notes TEXT,
      verification_status TEXT DEFAULT 'needs_verification',
      verified_at TEXT,
      verification_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (research_id) REFERENCES researches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS research_history (
      id TEXT PRIMARY KEY,
      research_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (research_id) REFERENCES researches(id) ON DELETE CASCADE
    );
  `);

  const existingColumns = new Set(db.prepare('PRAGMA table_info(researches)').all().map((column) => column.name));
  const newColumns = {
    language: "TEXT DEFAULT 'ar'",
    generated_draft: "TEXT DEFAULT ''",
    researcher_draft: "TEXT DEFAULT ''",
    reviewed_draft: "TEXT DEFAULT ''",
    corrected_draft: "TEXT DEFAULT ''",
    professor_reviewed_draft: "TEXT DEFAULT ''",
    final_approved_draft: "TEXT DEFAULT ''",
    review_report: "TEXT DEFAULT '{}'",
    professor_notes: "TEXT DEFAULT '[]'",
    repair_cycles: "TEXT DEFAULT '[]'",
    readiness_status: "TEXT DEFAULT 'NEEDS_REPAIR'",
    unresolved_issues: "TEXT DEFAULT '[]'"
  };

  for (const [column, definition] of Object.entries(newColumns)) {
    if (!existingColumns.has(column)) {
      db.exec(`ALTER TABLE researches ADD COLUMN ${column} ${definition}`);
    }
  }

  const existingSourceColumns = new Set(db.prepare('PRAGMA table_info(research_sources)').all().map((column) => column.name));
  const newSourceColumns = {
    journal_or_publisher: "TEXT DEFAULT ''",
    verification_status: "TEXT DEFAULT 'needs_verification'",
    verified_at: 'TEXT',
    verification_notes: "TEXT DEFAULT ''"
  };

  for (const [column, definition] of Object.entries(newSourceColumns)) {
    if (!existingSourceColumns.has(column)) {
      db.exec(`ALTER TABLE research_sources ADD COLUMN ${column} ${definition}`);
    }
  }

  if (countResearches() === 0) {
    createDemoResearch();
  }
}

function countResearches() {
  const stmt = db.prepare('SELECT COUNT(*) AS count FROM researches');
  return stmt.get().count;
}

function listResearches() {
  return db.prepare('SELECT * FROM researches ORDER BY updated_at DESC').all();
}

function getResearchById(id) {
  return db.prepare('SELECT * FROM researches WHERE id = ?').get(id) || null;
}

function createResearch(data = {}) {
  const id = data.id || getId();
  const timestamp = now();
  const record = {
    id,
    title: (data.title || '').trim() || 'بحث جديد',
    field: data.field || '',
    research_type: data.research_type || '',
    level: data.level || '',
    language: data.language || 'ar',
    notes: data.notes || '',
    status: data.status || 'draft',
    generated_draft: data.generated_draft ?? '',
    researcher_draft: data.researcher_draft ?? '',
    reviewed_draft: data.reviewed_draft ?? '',
    corrected_draft: data.corrected_draft ?? '',
    professor_reviewed_draft: data.professor_reviewed_draft ?? '',
    final_approved_draft: data.final_approved_draft ?? '',
    review_report: persistValue(data.review_report, '{}'),
    professor_notes: persistValue(data.professor_notes, '[]'),
    repair_cycles: persistValue(data.repair_cycles, '[]'),
    readiness_status: data.readiness_status || 'NEEDS_REPAIR',
    unresolved_issues: persistValue(data.unresolved_issues, '[]'),
    created_at: timestamp,
    updated_at: timestamp
  };

  db.prepare(`
    INSERT INTO researches (id, title, field, research_type, level, language, notes, status, generated_draft, researcher_draft, reviewed_draft, corrected_draft, professor_reviewed_draft, final_approved_draft, review_report, professor_notes, repair_cycles, readiness_status, unresolved_issues, created_at, updated_at)
    VALUES (@id, @title, @field, @research_type, @level, @language, @notes, @status, @generated_draft, @researcher_draft, @reviewed_draft, @corrected_draft, @professor_reviewed_draft, @final_approved_draft, @review_report, @professor_notes, @repair_cycles, @readiness_status, @unresolved_issues, @created_at, @updated_at)
  `).run(record);

  recordHistory(id, 'research_created', `تم إنشاء البحث: ${record.title}`);
  return getResearchById(id);
}

function updateResearch(id, data = {}) {
  const existing = getResearchById(id);
  if (!existing) {
    return null;
  }

  const title = (data.title || existing.title || '').trim() || 'بحث جديد';
  const updatedAt = now();

  db.prepare(`
    UPDATE researches
    SET title = @title,
        field = @field,
        research_type = @research_type,
        level = @level,
        language = @language,
        notes = @notes,
        status = @status,
        generated_draft = @generated_draft,
        researcher_draft = @researcher_draft,
        reviewed_draft = @reviewed_draft,
        corrected_draft = @corrected_draft,
        professor_reviewed_draft = @professor_reviewed_draft,
        final_approved_draft = @final_approved_draft,
        review_report = @review_report,
        professor_notes = @professor_notes,
        repair_cycles = @repair_cycles,
        readiness_status = @readiness_status,
        unresolved_issues = @unresolved_issues,
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    title,
    field: data.field ?? existing.field,
    research_type: data.research_type ?? existing.research_type,
    level: data.level ?? existing.level,
    language: data.language ?? existing.language ?? 'ar',
    notes: data.notes ?? existing.notes,
    status: data.status ?? existing.status,
    generated_draft: data.generated_draft ?? existing.generated_draft ?? '',
    researcher_draft: data.researcher_draft ?? existing.researcher_draft ?? '',
    reviewed_draft: data.reviewed_draft ?? existing.reviewed_draft ?? '',
    corrected_draft: data.corrected_draft ?? existing.corrected_draft ?? '',
    professor_reviewed_draft: data.professor_reviewed_draft ?? existing.professor_reviewed_draft ?? '',
    final_approved_draft: data.final_approved_draft ?? existing.final_approved_draft ?? '',
    review_report: data.review_report !== undefined ? persistValue(data.review_report, '{}') : existing.review_report || '{}',
    professor_notes: data.professor_notes !== undefined ? persistValue(data.professor_notes, '[]') : existing.professor_notes || '[]',
    repair_cycles: data.repair_cycles !== undefined ? persistValue(data.repair_cycles, '[]') : existing.repair_cycles || '[]',
    readiness_status: data.readiness_status ?? existing.readiness_status ?? 'NEEDS_REPAIR',
    unresolved_issues: data.unresolved_issues !== undefined ? persistValue(data.unresolved_issues, '[]') : existing.unresolved_issues || '[]',
    updated_at: updatedAt
  });

  recordHistory(id, 'research_updated', `تم تحديث البحث: ${title}`);
  return getResearchById(id);
}

function deleteResearch(id) {
  const existing = getResearchById(id);
  if (!existing) {
    return false;
  }

  db.prepare('DELETE FROM researches WHERE id = ?').run(id);
  return true;
}

function listSections(researchId) {
  return db.prepare(`
    SELECT * FROM research_sections
    WHERE research_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `).all(researchId);
}

function createSection(researchId, payload = {}) {
  const id = getId();
  const timestamp = now();
  const section = {
    id,
    research_id: researchId,
    section_type: payload.section_type || 'overview',
    title: payload.title || 'قسم جديد',
    content: payload.content || '',
    sort_order: Number(payload.sort_order || 0),
    created_at: timestamp,
    updated_at: timestamp
  };

  db.prepare(`
    INSERT INTO research_sections (id, research_id, section_type, title, content, sort_order, created_at, updated_at)
    VALUES (@id, @research_id, @section_type, @title, @content, @sort_order, @created_at, @updated_at)
  `).run(section);

  recordHistory(researchId, 'section_created', `تم إنشاء قسم: ${section.title}`);
  return getSectionById(id);
}

function getSectionById(id) {
  return db.prepare('SELECT * FROM research_sections WHERE id = ?').get(id) || null;
}

function updateSection(id, payload = {}) {
  const existing = getSectionById(id);
  if (!existing) {
    return null;
  }

  const updatedAt = now();
  const next = {
    id,
    section_type: payload.section_type ?? existing.section_type,
    title: payload.title ?? existing.title,
    content: payload.content ?? existing.content,
    sort_order: payload.sort_order != null ? Number(payload.sort_order) : existing.sort_order,
    updated_at: updatedAt
  };

  db.prepare(`
    UPDATE research_sections
    SET section_type = @section_type,
        title = @title,
        content = @content,
        sort_order = @sort_order,
        updated_at = @updated_at
    WHERE id = @id
  `).run(next);

  recordHistory(existing.research_id, 'section_updated', `تم تحديث قسم: ${next.title}`);
  return getSectionById(id);
}

function deleteSection(id) {
  const existing = getSectionById(id);
  if (!existing) {
    return false;
  }

  db.prepare('DELETE FROM research_sections WHERE id = ?').run(id);
  return true;
}

function listSources(researchId) {
  return db.prepare('SELECT * FROM research_sources WHERE research_id = ? ORDER BY created_at DESC').all(researchId);
}

function createSource(researchId, payload = {}) {
  const normalizedDoi = String(payload.doi || '').trim().toLocaleLowerCase();
  const normalizedTitle = String(payload.title || '').trim().toLocaleLowerCase();
  const normalizedAuthors = String(payload.authors || '').trim().toLocaleLowerCase();
  const normalizedYear = String(payload.year || '').trim();
  const duplicate = listSources(researchId).find((source) => {
    if (normalizedDoi && String(source.doi || '').trim().toLocaleLowerCase() === normalizedDoi) return true;
    return normalizedTitle
      && normalizedAuthors
      && normalizedYear
      && String(source.title || '').trim().toLocaleLowerCase() === normalizedTitle
      && String(source.authors || '').trim().toLocaleLowerCase() === normalizedAuthors
      && String(source.year || '').trim() === normalizedYear;
  });
  if (duplicate) return duplicate;

  const id = getId();
  const record = {
    id,
    research_id: researchId,
    title: payload.title || 'مصدر جديد',
    authors: payload.authors || '',
    year: payload.year || '',
    journal_or_publisher: payload.journal_or_publisher || '',
    url: payload.url || '',
    doi: payload.doi || '',
    source_type: payload.source_type || 'مؤسسة/موقع',
    citation_text: payload.citation_text || '',
    notes: payload.notes || '',
    verification_status: payload.verification_status === 'verified' ? 'verified' : 'needs_verification',
    verified_at: payload.verification_status === 'verified' ? payload.verified_at || now() : null,
    verification_notes: payload.verification_notes || '',
    created_at: now()
  };

  db.prepare(`
    INSERT INTO research_sources (id, research_id, title, authors, year, journal_or_publisher, url, doi, source_type, citation_text, notes, verification_status, verified_at, verification_notes, created_at)
    VALUES (@id, @research_id, @title, @authors, @year, @journal_or_publisher, @url, @doi, @source_type, @citation_text, @notes, @verification_status, @verified_at, @verification_notes, @created_at)
  `).run(record);

  recordHistory(researchId, 'source_added', `تم إضافة مصدر: ${record.title}`);
  return getSourceById(id);
}

function getSourceById(id) {
  return db.prepare('SELECT * FROM research_sources WHERE id = ?').get(id) || null;
}

function updateSource(id, payload = {}) {
  const existing = getSourceById(id);
  if (!existing) {
    return null;
  }

  const next = {
    id,
    title: payload.title ?? existing.title,
    authors: payload.authors ?? existing.authors,
    year: payload.year ?? existing.year,
    journal_or_publisher: payload.journal_or_publisher ?? existing.journal_or_publisher ?? '',
    url: payload.url ?? existing.url,
    doi: payload.doi ?? existing.doi,
    source_type: payload.source_type ?? existing.source_type,
    citation_text: payload.citation_text ?? existing.citation_text,
    notes: payload.notes ?? existing.notes,
    verification_status: payload.verification_status === 'verified' ? 'verified' : payload.verification_status ?? existing.verification_status ?? 'needs_verification',
    verified_at: payload.verification_status === 'verified' ? payload.verified_at || existing.verified_at || now() : payload.verified_at ?? existing.verified_at,
    verification_notes: payload.verification_notes ?? existing.verification_notes ?? ''
  };

  db.prepare(`
    UPDATE research_sources
    SET title = @title,
        authors = @authors,
        year = @year,
        journal_or_publisher = @journal_or_publisher,
        url = @url,
        doi = @doi,
        source_type = @source_type,
        citation_text = @citation_text,
        notes = @notes,
        verification_status = @verification_status,
        verified_at = @verified_at,
        verification_notes = @verification_notes
    WHERE id = @id
  `).run(next);

  recordHistory(existing.research_id, 'source_updated', `تم تحديث مصدر: ${next.title}`);
  return getSourceById(id);
}

function deleteSource(id) {
  const existing = getSourceById(id);
  if (!existing) {
    return false;
  }

  db.prepare('DELETE FROM research_sources WHERE id = ?').run(id);
  return true;
}

function recordHistory(researchId, action, details) {
  const id = getId();
  db.prepare(`
    INSERT INTO research_history (id, research_id, action, details, created_at)
    VALUES (@id, @research_id, @action, @details, @created_at)
  `).run({
    id,
    research_id: researchId,
    action,
    details: details || '',
    created_at: now()
  });
}

function getResearchHistory(researchId) {
  return db.prepare('SELECT * FROM research_history WHERE research_id = ? ORDER BY created_at DESC').all(researchId);
}

function createDemoResearch() {
  const research = createResearch({
    title: 'أثر استخدام المنصات الرقمية في تحسين جودة التعلم لدى طلاب الجامعات السعودية',
    field: 'التربية والتعليم',
    research_type: 'بحث أكاديمي',
    level: 'دراسات عليا',
    notes: 'التركيز على الدراسات الحديثة، مع إبراز الفجوة البحثية، وتنظيم المراجع وفق APA.',
    status: 'draft'
  });

  const defaultSections = [
    {
      section_type: 'overview',
      title: 'نظرة عامة',
      content: 'يهدف هذا البحث إلى دراسة أثر المنصات الرقمية في تحسين جودة التعلم لدى طلاب الجامعات السعودية، مع التركيز على الفجوة البحثية الحالية وإمكانية تطوير استراتيجيات تعليمية أكثر فاعلية.',
      sort_order: 1
    },
    {
      section_type: 'problem',
      title: 'مشكلة البحث',
      content: 'تتجلى مشكلة البحث في محدودية التحقق من أثر المنصات الرقمية في جودة التعلم لدى الطلاب السعوديين، وعدم وجود صورة واضحة عن العلاقة بين الاستخدام الفعلي لهذه المنصات وجودة المخرجات التعليمية.',
      sort_order: 2
    },
    {
      section_type: 'questions',
      title: 'أسئلة البحث',
      content: '1. ما أثر استخدام المنصات الرقمية في جودة التعلم؟\n2. ما العوامل المؤثرة في فعالية هذه المنصات؟\n3. ما الفجوة البحثية الحالية المتعلقة بالتعلم الرقمي؟',
      sort_order: 3
    },
    {
      section_type: 'objectives',
      title: 'الأهداف',
      content: 'تحديد أثر المنصات الرقمية في جودة التعلم، وتحليل العوامل المؤثرة، وتوضيح الفجوة البحثية ودور استراتيجيات التعليم الرقمي في تحسين الأداء الأكاديمي.',
      sort_order: 4
    },
    {
      section_type: 'literature',
      title: 'الدراسات السابقة',
      content: 'الإطار النظري يستند إلى دراسات حديثة حول التعليم الرقمي، مع مراعاة تصنيفها وفق المعايير المنهجية، ومقارنة النتائج في سياقات تعليمية مختلفة.',
      sort_order: 5
    },
    {
      section_type: 'methodology',
      title: 'المنهجية',
      content: 'سيتم الاعتماد على المنهج الوصفي والتحليلي، مع تحليل الدراسات الحالية وتحديد العلاقة بين استخدام المنصات الرقمية وجودة التعلم.',
      sort_order: 6
    }
  ];

  defaultSections.forEach((section) => createSection(research.id, section));

  recordHistory(research.id, 'demo_seeded', 'تمت إضافة البحث التجريبي الافتراضي.');
  return research;
}

module.exports = {
  db,
  initializeDatabase,
  listResearches,
  getResearchById,
  createResearch,
  updateResearch,
  deleteResearch,
  listSections,
  createSection,
  getSectionById,
  updateSection,
  deleteSection,
  listSources,
  createSource,
  getSourceById,
  updateSource,
  deleteSource,
  recordHistory,
  getResearchHistory,
  countResearches,
  createDemoResearch
};
}
