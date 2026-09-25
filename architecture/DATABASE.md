# Database Design

## Purpose
The local version of the application uses SQLite for persistent research management. This keeps the app working offline and supports future online deployment with minimal structural changes.

## Database File
- `backend/db/research.db`

## Tables

### researches
Stores the core research record.

Columns:
- id
- title
- field
- research_type
- level
- notes
- status
- created_at
- updated_at

### research_sections
Stores the structured content for each research workspace tab.

Columns:
- id
- research_id
- section_type
- title
- content
- sort_order
- created_at
- updated_at

### research_sources
Stores the manually entered academic sources.

Columns:
- id
- research_id
- title
- authors
- year
- url
- doi
- source_type
- citation_text
- notes
- created_at

### research_history
Stores a chronological activity log for the research record.

Columns:
- id
- research_id
- action
- details
- created_at

## Foreign Keys
Foreign key enforcement is enabled and relations are maintained between:
- `research_sections.research_id` -> `researches.id`
- `research_sources.research_id` -> `researches.id`
- `research_history.research_id` -> `researches.id`

## Initialization
The database is initialized automatically on backend startup through `backend/services/storage.js`.

## Demo Research
When the database is empty, the app inserts the required demo research:

Title:
"أثر استخدام المنصات الرقمية في تحسين جودة التعلم لدى طلاب الجامعات السعودية"

Field:
"التربية والتعليم"

Type:
"بحث أكاديمي"

Level:
"دراسات عليا"

Notes:
"التركيز على الدراسات الحديثة، مع إبراز الفجوة البحثية، وتنظيم المراجع وفق APA."
