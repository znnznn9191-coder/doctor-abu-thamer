# Research Pipeline

## Objective
The internal pipeline is designed to keep the research flow organized, review-based, and extensible. It is built to support a future external provider without redesigning the product UX or its public API.

## Ordered Stages
1. problem framing
2. source planning
3. literature organization
4. methodology review
5. evidence review
6. citation review
7. academic editing
8. fact checking
9. final review

## Implementation
The pipeline is orchestrated in `backend/services/research_pipeline.js` using the modules in `backend/agents/`.

Each module returns a standardized object with:
- `ok`
- `stage`
- `output`

## Local Rules
- The service stays fully local in the backend.
- No fake source metadata is generated.
- No invented author names, journals, DOI values, or URLs are created.
- If source verification is absent, the app explicitly marks the status as: "بحاجة إلى مصدر موثّق".
- The review flow remains deterministic and auditable.

## Future Provider Integration
A provider can later replace the local `run` implementation in an agent without changing the public contract or the front-end work flow. The research pipeline will still supply the same workflow and output structure.
