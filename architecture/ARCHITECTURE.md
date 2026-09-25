# معمارية مشروع منصة أبو ثامر للأبحاث

## الهدف
مشروع قابل للتطوير داخل VS Code، مع فصل واضح بين الواجهة، الخلفية، البيانات، والمراحل البحثية الداخلية.

## قاعدة المنتج والملكية

«منصة أبو ثامر للأبحاث» منصة بحثية خاصة صممت للدكتور أبو ثامر، وهو مالكها والباحث الأساسي ومستخدمها. ليست منصة للطلاب، ولا يجوز تفسير مجتمع الدراسة في أي بحث على أنه جمهور مستخدمي المنصة. قد تشمل موضوعات الأبحاث طلاباً أو جامعات أو معلّمين أو مرضى أو شركات أو أي مجتمع آخر؛ وتظل هذه الفئات موضوعات أو عينات بحثية فقط.

مسار المنتج الدائم: يدخل الدكتور موضوعاً بحثياً، وتطوره وحدات البحث الأكاديمي، ثم تراجع الأدلة والمنهجية والتوثيق والبنية والكتابة، ويجري التصحيح وضبط الجودة، وتراجع الأستاذية الأكاديمية المخطوطة كاملة، ثم تكتمل المراجعة النهائية وبوابة جاهزية التسليم، ويحفظ الناتج في «أبحاثي» للدكتور أبو ثامر. لا تغيّر حقول المستوى الأكاديمي هوية المستخدم؛ فهي تصف البحث وقد تشمل جامعي أو دراسات عليا أو ماجستير أو دكتوراه.

## المجلدات

- `frontend/`
  - `index.html` واجهة الدكتور أبو ثامر الخاصة.
  - `assets/` للصور والأنماط والملفات الإضافية لاحقاً.

- `backend/`
  - `server.js` خادم محلي تجريبي.
  - `agents/` مراحل البحث الداخلية.
  - `services/` خدمات الحفظ، المراجع، والتحقق.

- `data/`
  - `demo-research.json` البحث التجريبي.
  - لاحقاً يمكن ربط قاعدة بيانات حقيقية.

- `architecture/`
  - هذا الملف وقرارات المعمارية.

## مسار البحث الأكاديمي

تعمل المراحل التخصصية داخل الخلفية بهذا الترتيب: إدارة البحث، تأطير المشكلة، اكتشاف المصادر، مراجعة الأدبيات، المنهجية، الأدلة، التوثيق، التحرير الأكاديمي، التحقق من الحقائق، كتابة المسودة، تحرير العربية، نزاهة الاستشهادات، التحقق من الادعاءات، اتساق البحث، اتساق الأسلوب، التصحيح الآلي المحدود، مراجعة الأستاذ الأكاديمي، المراجعة النهائية، ثم جاهزية التسليم. لا تظهر أسماء هذه المراحل أو تفاصيلها الداخلية في الواجهة العامة.

## الطبقات الداخلية
- `backend/providers/` — واجهة المزود، مزود محلي، تسجيل المزود.
- `backend/services/model_service.js` — نقطة الوصول المشتركة لجميع المراحل.
- `backend/services/storage.js` — حفظ SQLite مع حقول المسودة والنسخ المعدلة من الباحث.
- `backend/services/research_pipeline.js` — تشغيل جميع المراحل في تسلسل منظم.

## محرك التوليد الداخلي
المراحل البحثية لا تستدعي مزوداً معيناً مباشرة. بدلاً من ذلك، تستدعي خدمة نموذج مشتركة، ما يجعل النظام قابلاً للتوسع لاحقاً دون تعديل المسار البحثي الرئيسي.

## الحفظ
الواجهة الحالية تحفظ محلياً في المتصفح، أما البيانات الأساسية فتُحفظ داخل SQLite عبر `backend/services/storage.js`.
النسخ المتاحة الآن تشمل:
- `generated_draft`
- `researcher_draft`
- `final_approved_draft`

## التشغيل الحالي
يعمل المشروع محلياً عبر Node.js 20 LTS.

## التطوير داخل VS Code
افتح مجلد `doctor-abu-thamer` كاملاً في VS Code.

## التشغيل الحالي
افتح `frontend/index.html` مباشرة في المتصفح.

## التطوير داخل VS Code
افتح مجلد `doctor-abu-thamer` كاملاً في VS Code.

## Bilingual Language Architecture + Scopus Integration

The platform is bilingual from the core, not only at the UI level.

Supported primary locales:
- `ar` — native Arabic
- `en` — native English

Every research project may define:
- `input_language`
- `research_language`
- `source_search_language`
- `output_language`

The language layer must support:
- native Arabic academic phrasing
- native English academic phrasing
- academic query normalization
- bilingual terminology mapping
- Arabic-to-English scholarly search expansion
- English-to-Arabic scholarly presentation
- preservation of source titles, authors, DOI, identifiers, and metadata in their original form

External academic search must use a centralized integration layer.

Scopus architecture:

Scopus
→ Scopus Connector
→ Source Discovery
→ Verified Sources
→ Research Core
→ All research and review stages

Agents must not connect to Scopus directly.
All Scopus results must pass through a centralized connector, normalization, validation, and verified-source layer before entering the research context.

The language layer must be reusable for future academic integrations such as Crossref, PubMed, Web of Science, or other scholarly databases without changing the core research pipeline.
