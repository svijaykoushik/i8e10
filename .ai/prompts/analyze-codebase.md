# Codebase Analysis & AI Instruction Generator

## Role

You are an AI coding agent onboarding into an existing production codebase.

Your task is to analyze this repository and **generate or update structured AI
instruction files inside the `.ai/` directory**, enabling future agents to be
immediately productive and safe.

You must treat this as a **documentation extraction task**, not a refactor.

---

## Scope of Analysis

Discover and document **only what is observable from the codebase**.

Focus on:

### 1. Architecture & Big Picture
- **Client-Side Storage**: Specifically the custom IndexedDB wrapper (NOT Dexie.js).
- Major subsystems and boundaries.
- Client-side encryption mechanisms.
- Offline-first architecture.

### 2. Developer Workflows
- Build, test, lint, and PWA generation commands.
- Non-obvious setup or environment requirements (e.g., `GEMINI_API_KEY`).
- Local vs production behavior differences.

### 3. Project-Specific Conventions
- **UI/UX**: Bilingual support (English/Tamil), color systems, and data representation.
- Design patterns (e.g., `liveQuery`, Modal-based forms).
- Error-handling and validation.

### 4. Integration Points
- External services (e.g., Gemini API).
- Authentication and authorization flows.
- Database access patterns and transaction boundaries.

---

## Instruction Sources (Single Glob Search)

Before writing anything, search and extract rules from:

```
**/{.ai/**, .claude/**, AGENT.md, AGENTS.md, CLAUDE.md,
.cursorrules, .windsurfrules, .clinerules,
.cursor/rules/**, .windsurf/rules/**, .clinerules/**,
README.md}
```

Do not duplicate content blindly — consolidate and normalize.

---

## Output Requirements

### Files to Generate or Update

Update or create the following **only if discoverable from the current codebase state**:

- `.ai/system_profile.md` (System overview & Tech Stack)
- `.ai/architecture.md` (Data flow, Custom DB Wrapper, Encryption)
- `.ai/workflows.md` (Build, Test, Deploy)
- `.ai/conventions.md` (Code style, Patterns)
- `.ai/ui-conventions.md` (Design System, Colors)
- `.ai/ux-guidelines.md` (Bilingual rules, Data entry patterns)
- `.ai/env_setup.md` (Environment variables)

If a file already exists:
- Preserve valuable content.
- Update outdated or incomplete sections.
- Do not expand scope beyond what the code proves.

---

## Writing Guidelines

- Be concise and actionable (20–50 lines per file).
- Use markdown headings and bullet points.
- Reference **real files and directories**.
- Include examples only when they clarify a pattern.
- Avoid generic advice (e.g., “write tests”, “handle errors”).
- Do not invent aspirational practices.

---

## Completion Step

After updating `.ai/`, report:
- Which files were changed.
- Any ambiguities or missing context.
- One short question (if needed) to refine unclear areas.
