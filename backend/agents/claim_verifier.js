const { createResearchAgent } = require('../research_core/agent_factory');

const definition = {
  name: 'claim_verifier',
  academic_role: 'research claim and evidence verification specialist',
  research_domain: 'claim_verification',
  allowed_inputs: ['complete manuscript', 'section content', 'stored sources', 'evidence reports'],
  expected_outputs: ['claims', 'problematic_claims', 'pass'],
  evidence_requirements: ['classify claims against available source records only', 'state what evidence type is needed'],
  citation_requirements: ['a citation must match a stored source before it counts as support'],
  forbidden_behaviors: ['fabricating evidence', 'marking unsourced claims verified', 'overstating support']
};

module.exports = createResearchAgent(definition, (input) => {
  const draft = String(input.current_draft || input.draft || '');
  const sources = Array.isArray(input.sources) ? input.sources : input.research_context && input.research_context.verified_sources || [];
  const claims = [];
  const sections = Array.isArray(input.sections) ? input.sections : [];
  const sentenceEntries = sections.length
    ? sections.flatMap((section) => String(section.content || '').split(/(?<=[.!؟])\s+|\n+/).map((text) => ({ section: section.title || section.section_type, sectionType: section.section_type, text: text.trim() })))
    : draft.split(/(?<=[.!؟])\s+|\n+/).map((text) => ({ section: input.current_section || 'full_draft', sectionType: '', text: text.trim() }));
  const sentences = sentenceEntries.filter((entry) => entry.text.length > 12 && !/[؟?]$/.test(entry.text) && !/^(keywords|questions|objectives|references)$/i.test(String(entry.sectionType || '')));
  const studyDesignPattern = /تهدف (هذه )?الدراسة|تسعى (هذه )?الدراسة|يتناول هذا البحث|يتناول هذا المشروع|يعتمد هذا البحث|تعتمد هذه الدراسة|تقوم هذه الدراسة|يقصد (بهذا البحث|في هذه الدراسة|بالاستخدام|بجودة التعلم)|يقتصر هذا البحث|تقتصر الحدود|حدود (هذه الدراسة|المشروع)|لا تتوافر|لا تتوفر|لا توجد بيانات|لا يدعي|لا تدعي|لا تزعم|لا تنسب|لا تعني|لا يصف|لا تقدم|لا يقدم|لا يتضمن|لا يتوافر|لا يجوز|لا يمكن|لا يورد|لا يقرر|سيتم|سوف|ست(?:بدأ|عرض|ستخدم|حدد|جرى|عدل)|بعد (ذلك|جمع البيانات|تحديد|مراجعة|ظهور النتائج)|إذا (?:لم|أظهرت)|يجب أن|ينبغي|ويجب|تظل|وتظل|تبقى|وتبقى|يثبت العنوان|تتمثل المشكلة|تتمثل مشكلة هذا البحث|تنبع أهمية هذه الدراسة|يحدد هذا البحث|تحدد هذه الدراسة|تحدد الدراسة المقترحة|تعرف هذه الدراسة|يعرف هذا البحث|تتضمن خطة (?:البحث|التحليل)|تتضمن الخطة|تعرض المراجعة|يعرض هذا البحث|تفسر المناقشة المقترحة|تستخدم الدراسة المقترحة|تستخدم الدراسة|يمكن إضافة|توثق إجراءات|تستند التوصيات المقترحة|توصي الخطة|تقترح الخطة|يقترح هذا البحث|يقترح هذا المشروع|تقترح هذه الدراسة|يقدم هذا (?:البحث|المشروع|النموذج)|تقدم هذه الدراسة|التصميم المقترح|الخطة البحثية|في هذا النموذج|في هذا المشروع|في هذا البحث|في هذه الدراسة|لا يتضمن هذا البحث|لا تقدم هذه المسودة|تخلص هذه المسودة|ولا تخلص|نتيجة هذا المشروع/i;
  const projectSpecificationPattern = /تقترح الدراسة الحالية|بناء على ذلك، تصاغ المشكلة الحالية|لا يفترض البحث أثراً|يحدد البحث المتغيرات والأسئلة|يقدم خطة لقياس|ينظم الإطار المفاهيمي|بناء على هذه الحدود|تضم المراجع المتحققة|لا يثبت اختيار هذه الأدوات|يعرض التحليل هنا بوصفه خطة|يربط السؤال الأول|ستفسر المناقشة النتائج|ستفصل المناقشة بين|لا توجد نتائج ميدانية لهذا البحث|تقتصر المخرجات الحالية|تقترح تحديد مجتمع وعينة|هذه توصيات لاستكمال البحث|لا تثبت هذه المصادر وحدها/i;

  sentences.forEach((entry, index) => {
    const sentence = entry.text;
    const studyDesignStatement = studyDesignPattern.test(sentence) || projectSpecificationPattern.test(sentence);
    const source = sources.find((item) => {
      const firstAuthor = String(item.authors || '').split(';')[0].trim().split(/\s+/).pop().toLocaleLowerCase();
      return firstAuthor && String(item.year || '').trim() && sentence.toLocaleLowerCase().includes(firstAuthor) && sentence.includes(String(item.year).trim());
    });
    const hasCitationMarker = /\[\d+\]|\((?:[^()]+,\s*)?(?:19|20)\d{2}[a-z]?[^()]*\)/.test(sentence);
    const classification = studyDesignStatement
      ? 'supported'
      : source && hasCitationMarker
        ? 'supported'
        : hasCitationMarker ? 'unsupported' : 'needs_source';

    claims.push({
      section: entry.section,
      claim_type: studyDesignStatement ? 'study_design_or_scope' : 'factual_or_academic_claim',
      claim: sentence,
      classification,
      reason: studyDesignStatement
        ? 'Statement describes this project’s proposed design, scope, or limitations; it is not presented as an empirical finding.'
        : source
          ? source.verification_status === 'verified'
            ? 'The citation maps to a bibliographically verified source; the claim remains bounded by the source scope.'
            : 'A source record exists, but its bibliographic identity is not verified.'
        : hasCitationMarker
          ? 'The citation marker has no matching stored source.'
          : 'No matching verified source is attached to this claim.',
      required_evidence_type: source ? 'verify the cited source record and claim-source match' : 'a verifiable scholarly source directly supporting this claim',
      safe_repair_recommendation: 'Add a verified source or qualify/remove this claim after researcher review.',
      sentence_index: index + 1
    });
  });

  return {
    claims,
    problematic_claims: claims.filter((claim) => ['needs_source', 'unsupported', 'unclear'].includes(claim.classification)),
    pass: claims.every((claim) => ['verified', 'supported'].includes(claim.classification))
  };
});
