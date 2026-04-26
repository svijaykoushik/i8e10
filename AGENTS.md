# AI Agent Entry Point

> [!IMPORTANT]
> **ATTENTION AI AGENTS:** Before performing any analysis, research, or code modifications, you **MUST** read and follow the instructions in:
> **[.ai/index.md](.ai/index.md)**

This repository uses a structured documentation system in the `.ai/` directory to ensure consistency, prevent redundant work, and maintain architectural integrity.

## Quick Navigation

| Resource | Path | Purpose |
| :--- | :--- | :--- |
| **Main Index** | [.ai/index.md](.ai/index.md) | Entry point for all AI documentation. |
| **System Profile** | [.ai/context/system_profile.md](.ai/context/system_profile.md) | Project principles and tech stack. |
| **Architecture** | [.ai/context/architecture.md](.ai/context/architecture.md) | Database schema & offline-first logic. |
| **Conventions** | [.ai/context/conventions.md](.ai/context/conventions.md) | Coding standards and patterns. |
| **Workflows** | [.ai/context/workflows.md](.ai/context/workflows.md) | Testing and deployment procedures. |

## Critical Constraints

1.  **Offline-First**: This is a frontend-only application. Do **NOT** suggest backend/server-side integrations unless explicitly requested.
2.  **Storage**: Data is persisted locally via **IndexedDB** using a double-entry accounting model.
3.  **Privacy**: End-to-end encryption is used for sensitive data. Never bypass security patterns.
4.  **Language**: The application supports bilingual UI (**English/Tamil**). Maintain this in all UI changes.

## How to Work with This Repo

1.  **Initialize**: Start every session by reading `.ai/index.md`.
2.  **Context Loading**: Use the files in `.ai/context/` to ground your suggestions.
3.  **Skill Usage**: Check `.ai/skills/` for specialized methodologies (e.g., TDD, Git Worktrees).
4.  **Verification**: Always refer to `.ai/context/workflows.md` for running tests before submitting code.

---
*This file acts as a router for AI agents to ensure they are properly grounded in the project's context.*
