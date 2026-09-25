# Backend Architecture

## Overview
The backend is built with Express and serves the local web application while handling all research data and review workflow logic. The public UI only interacts with product-level APIs; internal processing remains in the backend service and agent layers.

## Folder Structure

```text
backend/
├── config.js
├── package.json
├── server.js
├── controllers/
│   ├── researchController.js
│   ├── sectionController.js
│   ├── sourceController.js
│   └── reviewController.js
├── db/
│   └── research.db
├── routes/
│   ├── researchRoutes.js
│   ├── sectionRoutes.js
│   ├── sourceRoutes.js
│   └── reviewRoutes.js
├── services/
│   ├── storage.js
│   └── research_pipeline.js
└── agents/
    ├── research_manager.js
    ├── problem_framing.js
    ├── source_discovery.js
    ├── literature_review.js
    ├── methodology.js
    ├── evidence_review.js
    ├── citation_review.js
    ├── academic_editor.js
    ├── fact_check.js
    └── final_review.js
```

## Responsibilities
- `server.js`: boots Express and serves the static frontend.
- `config.js`: central runtime configuration.
- `controllers/`: request handling and HTTP response formatting.
- `routes/`: API route registration.
- `services/storage.js`: SQLite access and database initialization.
- `services/research_pipeline.js`: orchestrates backend review stages.
- `agents/`: deterministic local research-processing modules for each review stage.

## Public API
The UI talks to JSON endpoints under `/api` and does not expose internal names or implementation details. The API is designed so that a real AI provider may be connected later without redesigning the front-end contract.

## Local Persistence
- SQLite is the source of truth for local research data.
- The app uses SQLite to store research metadata, sections, sources, and history records.
- `localStorage` is used only for harmless UI preferences such as last-opened research.

## Review Pipeline
The internal review pipeline is executed via `POST /api/researches/:id/run-review` and follows the order below:
1. problem framing
2. source planning
3. literature organization
4. methodology review
5. evidence review
6. citation review
7. academic editing
8. fact checking
9. final review

If source verification is unavailable, the system explicitly returns the phrase: "بحاجة إلى مصدر موثّق".
