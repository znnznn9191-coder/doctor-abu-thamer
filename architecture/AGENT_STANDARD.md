# Agent Standard for Academic Research Modules

## Requirement

Every internal module in this project must be a research-specialized academic agent.

## Required metadata

Each agent must declare:
- academic_role
- research_domain
- allowed_inputs
- expected_outputs
- evidence_requirements
- citation_requirements
- forbidden_behaviors
- research_core

## Shared inheritance

Every agent must use the shared research foundation from `backend/research_core/`.

This ensures that all modules follow the same permanent principles:
- evidence-based reasoning
- source traceability
- citation integrity
- methodological alignment
- scholarly Arabic
- no fabricated metadata

## Validation rule

Before a module is accepted into the pipeline, the registration validator checks that it is both:
1. registered as an academic research specialist
2. connected to the shared research core

If not, it is rejected.

## Provider contract

The model/provider layer receives research context automatically and must not behave as a generic assistant. Provider output is always contextualized with:
- current stage
- relevant research context
- academic standards
- source and evidence policy
- agent role and discipline context

## Discipline extensibility

New discipline profiles can be added under `backend/research_core/disciplines/` to extend terminology and conventions without bypassing evidence rules.

## Quality gate

The project does not permit a generic agent to pass as an academic specialist. Research quality, evidence verification, citation safety, and source discipline remain mandatory across all stages.

## Review and repair stages

Advanced review agents must be registered through the research core and keep their reports source-bound. The automated correction loop may run no more than three cycles; each cycle records issues before repair, repaired issues, unresolved issues, and issues after validation.

The senior professor reviews the complete corrected manuscript after automated validation and repair. The submission-readiness gate runs last and blocks delivery when source, claim, citation, structure, coherence, or final-review requirements remain unmet.

The internal review sequence is not exposed in the public interface. Public statuses use researcher-facing Arabic labels only.
