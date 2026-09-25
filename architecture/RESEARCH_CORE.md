# Research Core Architecture

## Permanent product ownership rule

«منصة أبو ثامر للأبحاث» منصة خاصة بالدكتور أبو ثامر؛ هو المالك والباحث الأساسي ومستخدم المنصة. المنصة ليست موجهة للطلاب كمستخدمين. الطلاب والجامعات والمعلمون والمرضى والشركات وغيرها قد يكونون موضوعات أو مجتمعات دراسة داخل بحث يختاره الباحث، لكنهم لا يصبحون بذلك مستخدمي المنصة.

The researcher enters a topic; the academic research workflow develops and reviews it, then stores the completed work in «أبحاثي» for Dr. Abu Thamer. Academic-level fields describe the research project and must not be removed or interpreted as platform-user categories. This boundary is permanent and applies to future architecture, documentation, and UI changes.

## Permanent specialization

The platform is permanently specialized for academic research work. Generic assistant behavior is not allowed in any internal module. Every agent is designed to operate as a research specialist, not as a generic chat or casual writing assistant.

## Shared research foundation

All internal agents inherit from the shared research core in `backend/research_core/`.

The core includes:
- research_principles.js
- academic_standards.js
- source_policy.js
- citation_policy.js
- evidence_policy.js
- methodology_policy.js
- writing_policy.js
- research_context.js

These modules define the permanent rules for the whole system, and all current and future agents must use them.

## Agent registration standard

Any future module entering the research pipeline must declare:
- academic_role
- research_domain
- allowed_inputs
- expected_outputs
- evidence_requirements
- citation_requirements
- forbidden_behaviors
- research_core

This is enforced by the registration validation in `backend/research_core/agent_registry.js`.

## Research context

The system builds a shared research context through `buildResearchContext()` and passes it to every stage. This context contains the title, discipline, type, level, problem, questions, objectives, methodology, verified sources, evidence status, unresolved issues, and source boundaries.

Agents should extend this shared context rather than inventing missing information independently.

## Provider integration

The provider/model layer receives the academic context automatically in `backend/services/model_service.js`. Every provider call includes:
- the active agent role
- academic standards
- research principles
- source policy
- citation policy
- evidence policy
- methodology policy
- writing policy
- current research context

No provider can silently bypass the research core.

## Discipline profiles

Additional discipline-specific profiles can be added under `backend/research_core/disciplines/` and should define research conventions, terminology, and evidence expectations without inventing facts.

Examples include:
- education.js
- business.js
- medicine.js
- engineering.js
- social_sciences.js

## Prevention of generic behavior

Any module that is not registered as a research specialist is rejected by validation. The registration guard prevents unregistered or generic modules from silently entering the pipeline.

## Advanced academic review

The 19-stage pipeline adds manuscript humanization, citation integrity, claim verification, coherence review, style consistency, controlled automatic repair, senior professor review, and a final submission-readiness gate.

The validation and repair loop is limited to three correction cycles. Unsupported claims are removed or left unresolved for researcher review; missing sources are never synthesized. The professor stage receives the complete corrected manuscript and the accumulated research context. Submission readiness is the final stage and returns only `READY`, `NEEDS_REPAIR`, or `BLOCKED`.

Review artifacts are persisted additively in SQLite. Existing records and researcher-authored drafts are preserved; a final approved draft is only promoted when readiness is `READY`.

Public-facing review responses expose Arabic researcher-facing statuses, not internal agent names or stage identifiers.

## Operational rule

The system prioritizes:
- academic quality
- evidence-based reasoning
- source traceability
- methodological alignment
- citation integrity
- factual accuracy
- scholarly Arabic
- no fabricated authors, journals, URLs, or DOI values
