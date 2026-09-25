const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  max: Number(process.env.PGPOOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error.message);
});

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

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS researches (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      field TEXT DEFAULT '',
      research_type TEXT DEFAULT '',
      level TEXT DEFAULT '',
      language TEXT DEFAULT 'ar',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      generated_draft TEXT DEFAULT '',
      researcher_draft TEXT DEFAULT '',
      reviewed_draft TEXT DEFAULT '',
      corrected_draft TEXT DEFAULT '',
      professor_reviewed_draft TEXT DEFAULT '',
      final_approved_draft TEXT DEFAULT '',
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
      research_id TEXT NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
      section_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_sources (
      id TEXT PRIMARY KEY,
      research_id TEXT NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
      title TEXT DEFAULT '',
      authors TEXT DEFAULT '',
      year TEXT DEFAULT '',
      journal_or_publisher TEXT DEFAULT '',
      url TEXT DEFAULT '',
      doi TEXT DEFAULT '',
      source_type TEXT DEFAULT '',
      citation_text TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      verification_status TEXT DEFAULT 'needs_verification',
      verified_at TEXT,
      verification_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_history (
      id TEXT PRIMARY KEY,
      research_id TEXT NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS research_sections_order_idx
      ON research_sections(research_id, sort_order, created_at);
    CREATE INDEX IF NOT EXISTS research_sources_research_idx
      ON research_sources(research_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS research_history_research_idx
      ON research_history(research_id, created_at DESC);
  `);

  const migrations = [
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar'`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS generated_draft TEXT DEFAULT ''`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS researcher_draft TEXT DEFAULT ''`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS reviewed_draft TEXT DEFAULT ''`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS corrected_draft TEXT DEFAULT ''`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS professor_reviewed_draft TEXT DEFAULT ''`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS final_approved_draft TEXT DEFAULT ''`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS review_report TEXT DEFAULT '{}'`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS professor_notes TEXT DEFAULT '[]'`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS repair_cycles TEXT DEFAULT '[]'`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS readiness_status TEXT DEFAULT 'NEEDS_REPAIR'`,
    `ALTER TABLE researches ADD COLUMN IF NOT EXISTS unresolved_issues TEXT DEFAULT '[]'`,
    `ALTER TABLE research_sources ADD COLUMN IF NOT EXISTS journal_or_publisher TEXT DEFAULT ''`,
    `ALTER TABLE research_sources ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'needs_verification'`,
    `ALTER TABLE research_sources ADD COLUMN IF NOT EXISTS verified_at TEXT`,
    `ALTER TABLE research_sources ADD COLUMN IF NOT EXISTS verification_notes TEXT DEFAULT ''`
  ];

  for (const migration of migrations) await pool.query(migration);
  await pool.query(
    'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
    [1, now()]
  );
}

async function countResearches() {
  const result = await pool.query('SELECT COUNT(*)::INTEGER AS count FROM researches');
  return result.rows[0].count;
}

async function listResearches() {
  const result = await pool.query('SELECT * FROM researches ORDER BY updated_at DESC');
  return result.rows;
}

async function getResearchById(id) {
  const result = await pool.query('SELECT * FROM researches WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createResearch(data = {}) {
  const id = data.id || getId();
  const timestamp = now();
  const values = [
    id,
    (data.title || '').trim() || 'بحث جديد',
    data.field || '',
    data.research_type || '',
    data.level || '',
    data.language || 'ar',
    data.notes || '',
    data.status || 'draft',
    data.generated_draft || '',
    data.researcher_draft || '',
    data.reviewed_draft || '',
    data.corrected_draft || '',
    data.professor_reviewed_draft || '',
    data.final_approved_draft || '',
    persistValue(data.review_report, '{}'),
    persistValue(data.professor_notes, '[]'),
    persistValue(data.repair_cycles, '[]'),
    data.readiness_status || 'NEEDS_REPAIR',
    persistValue(data.unresolved_issues, '[]'),
    timestamp,
    timestamp
  ];

  await pool.query(`
    INSERT INTO researches (
      id, title, field, research_type, level, language, notes, status,
      generated_draft, researcher_draft, reviewed_draft, corrected_draft,
      professor_reviewed_draft, final_approved_draft, review_report,
      professor_notes, repair_cycles, readiness_status, unresolved_issues,
      created_at, updated_at
    ) VALUES (${values.map((_, index) => `$${index + 1}`).join(', ')})
  `, values);

  await recordHistory(id, 'research_created', `تم إنشاء البحث: ${values[1]}`);
  return getResearchById(id);
}

async function updateResearch(id, data = {}) {
  const existing = await getResearchById(id);
  if (!existing) return null;

  const values = [
    (data.title || existing.title || '').trim() || 'بحث جديد',
    data.field ?? existing.field ?? '',
    data.research_type ?? existing.research_type ?? '',
    data.level ?? existing.level ?? '',
    data.language ?? existing.language ?? 'ar',
    data.notes ?? existing.notes ?? '',
    data.status ?? existing.status ?? 'draft',
    data.generated_draft ?? existing.generated_draft ?? '',
    data.researcher_draft ?? existing.researcher_draft ?? '',
    data.reviewed_draft ?? existing.reviewed_draft ?? '',
    data.corrected_draft ?? existing.corrected_draft ?? '',
    data.professor_reviewed_draft ?? existing.professor_reviewed_draft ?? '',
    data.final_approved_draft ?? existing.final_approved_draft ?? '',
    data.review_report !== undefined ? persistValue(data.review_report, '{}') : existing.review_report || '{}',
    data.professor_notes !== undefined ? persistValue(data.professor_notes, '[]') : existing.professor_notes || '[]',
    data.repair_cycles !== undefined ? persistValue(data.repair_cycles, '[]') : existing.repair_cycles || '[]',
    data.readiness_status ?? existing.readiness_status ?? 'NEEDS_REPAIR',
    data.unresolved_issues !== undefined ? persistValue(data.unresolved_issues, '[]') : existing.unresolved_issues || '[]',
    now(),
    id
  ];

  await pool.query(`
    UPDATE researches SET
      title=$1, field=$2, research_type=$3, level=$4, language=$5, notes=$6,
      status=$7, generated_draft=$8, researcher_draft=$9, reviewed_draft=$10,
      corrected_draft=$11, professor_reviewed_draft=$12, final_approved_draft=$13,
      review_report=$14, professor_notes=$15, repair_cycles=$16,
      readiness_status=$17, unresolved_issues=$18, updated_at=$19
    WHERE id=$20
  `, values);

  await recordHistory(id, 'research_updated', `تم تحديث البحث: ${values[0]}`);
  return getResearchById(id);
}

async function deleteResearch(id) {
  const result = await pool.query('DELETE FROM researches WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function listSections(researchId) {
  const result = await pool.query(
    'SELECT * FROM research_sections WHERE research_id = $1 ORDER BY sort_order ASC, created_at ASC',
    [researchId]
  );
  return result.rows;
}

async function createSection(researchId, payload = {}) {
  const id = getId();
  const timestamp = now();
  const values = [
    id,
    researchId,
    payload.section_type || 'overview',
    payload.title || 'قسم جديد',
    payload.content || '',
    Number(payload.sort_order || 0),
    timestamp,
    timestamp
  ];
  const result = await pool.query(`
    INSERT INTO research_sections (id, research_id, section_type, title, content, sort_order, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `, values);
  await recordHistory(researchId, 'section_created', `تم إنشاء قسم: ${values[3]}`);
  return result.rows[0];
}

async function getSectionById(id) {
  const result = await pool.query('SELECT * FROM research_sections WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function updateSection(id, payload = {}) {
  const existing = await getSectionById(id);
  if (!existing) return null;
  const values = [
    payload.section_type ?? existing.section_type,
    payload.title ?? existing.title,
    payload.content ?? existing.content,
    payload.sort_order != null ? Number(payload.sort_order) : existing.sort_order,
    now(),
    id
  ];
  const result = await pool.query(`
    UPDATE research_sections SET section_type=$1, title=$2, content=$3, sort_order=$4, updated_at=$5
    WHERE id=$6 RETURNING *
  `, values);
  await recordHistory(existing.research_id, 'section_updated', `تم تحديث قسم: ${values[1]}`);
  return result.rows[0] || null;
}

async function deleteSection(id) {
  const result = await pool.query('DELETE FROM research_sections WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function listSources(researchId) {
  const result = await pool.query(
    'SELECT * FROM research_sources WHERE research_id = $1 ORDER BY created_at DESC',
    [researchId]
  );
  return result.rows;
}

async function findDuplicateSource(researchId, payload) {
  const doi = String(payload.doi || '').trim().toLocaleLowerCase();
  const title = String(payload.title || '').trim().toLocaleLowerCase();
  const authors = String(payload.authors || '').trim().toLocaleLowerCase();
  const year = String(payload.year || '').trim();
  const result = await pool.query(`
    SELECT * FROM research_sources
    WHERE research_id = $1 AND (
      ($2 <> '' AND LOWER(COALESCE(doi, '')) = $2)
      OR ($3 <> '' AND $4 <> '' AND $5 <> ''
        AND LOWER(COALESCE(title, '')) = $3
        AND LOWER(COALESCE(authors, '')) = $4
        AND COALESCE(year, '') = $5)
    )
    LIMIT 1
  `, [researchId, doi, title, authors, year]);
  return result.rows[0] || null;
}

async function createSource(researchId, payload = {}) {
  const duplicate = await findDuplicateSource(researchId, payload);
  if (duplicate) return duplicate;

  const values = [
    getId(), researchId, payload.title || 'مصدر جديد', payload.authors || '', payload.year || '',
    payload.journal_or_publisher || '', payload.url || '', payload.doi || '',
    payload.source_type || 'مؤسسة/موقع', payload.citation_text || '', payload.notes || '',
    payload.verification_status === 'verified' ? 'verified' : 'needs_verification',
    payload.verification_status === 'verified' ? payload.verified_at || now() : null,
    payload.verification_notes || '', now()
  ];
  const result = await pool.query(`
    INSERT INTO research_sources (
      id, research_id, title, authors, year, journal_or_publisher, url, doi,
      source_type, citation_text, notes, verification_status, verified_at,
      verification_notes, created_at
    ) VALUES (${values.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING *
  `, values);
  await recordHistory(researchId, 'source_added', `تم إضافة مصدر: ${values[2]}`);
  return result.rows[0];
}

async function getSourceById(id) {
  const result = await pool.query('SELECT * FROM research_sources WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function updateSource(id, payload = {}) {
  const existing = await getSourceById(id);
  if (!existing) return null;
  const values = [
    payload.title ?? existing.title,
    payload.authors ?? existing.authors,
    payload.year ?? existing.year,
    payload.journal_or_publisher ?? existing.journal_or_publisher ?? '',
    payload.url ?? existing.url,
    payload.doi ?? existing.doi,
    payload.source_type ?? existing.source_type,
    payload.citation_text ?? existing.citation_text,
    payload.notes ?? existing.notes,
    payload.verification_status === 'verified' ? 'verified' : payload.verification_status ?? existing.verification_status ?? 'needs_verification',
    payload.verification_status === 'verified' ? payload.verified_at || existing.verified_at || now() : payload.verified_at ?? existing.verified_at,
    payload.verification_notes ?? existing.verification_notes ?? '',
    id
  ];
  const result = await pool.query(`
    UPDATE research_sources SET
      title=$1, authors=$2, year=$3, journal_or_publisher=$4, url=$5, doi=$6,
      source_type=$7, citation_text=$8, notes=$9, verification_status=$10,
      verified_at=$11, verification_notes=$12
    WHERE id=$13 RETURNING *
  `, values);
  if (result.rows[0]) await recordHistory(existing.research_id, 'source_updated', `تم تحديث مصدر: ${values[0]}`);
  return result.rows[0] || null;
}

async function deleteSource(id) {
  const existing = await getSourceById(id);
  if (!existing) return false;
  await pool.query('DELETE FROM research_sources WHERE id = $1', [id]);
  await recordHistory(existing.research_id, 'source_deleted', `تم حذف مصدر: ${existing.title}`);
  return true;
}

async function recordHistory(researchId, action, details) {
  const id = getId();
  await pool.query(
    'INSERT INTO research_history (id, research_id, action, details, created_at) VALUES ($1,$2,$3,$4,$5)',
    [id, researchId, action, details || '', now()]
  );
  return id;
}

async function getResearchHistory(researchId) {
  const result = await pool.query(
    'SELECT * FROM research_history WHERE research_id = $1 ORDER BY created_at DESC',
    [researchId]
  );
  return result.rows;
}

async function createDemoResearch() {
  const demo = await createResearch({
    title: 'أثر استخدام المنصات الرقمية في تحسين جودة التعلم لدى طلاب الجامعات السعودية',
    field: 'التربية والتعليم',
    research_type: 'بحث أكاديمي',
    level: 'دراسات عليا',
    notes: 'التركيز على الدراسات الحديثة، مع إبراز الفجوة البحثية، وتنظيم المراجع وفق APA.',
    status: 'draft'
  });
  return demo;
}

async function healthCheck() {
  await pool.query('SELECT 1');
  return true;
}

module.exports = {
  db: pool,
  initializeDatabase,
  healthCheck,
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
