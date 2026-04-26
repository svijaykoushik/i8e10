# AI Instructions Index

This directory contains structured documentation, prompts, and modular skills to assist AI agents in understanding and working with the i8e10 codebase.

## Directory Structure

```text
.ai/
├── context/       # Core system documentation (Architecture, Conventions, etc.)
├── prompts/       # Reusable complex prompt templates for specific tasks
├── skills/        # Modular, high-level capabilities and methodologies
└── index.md       # This file (The entry point for AI agents)
```

## Core Context (`context/`)

These files define the fundamental rules and knowledge required to contribute to the project.

| File | Description |
| :--- | :--- |
| [**System Profile**](./context/system_profile.md) | High-level project overview, core principles, and technology stack. |
| [**Architecture**](./context/architecture.md) | Details on the frontend-only architecture, IndexedDB schema, and encryption strategies. |
| [**Workflows**](./context/workflows.md) | Instructions for development, building, testing, and deployment. |
| [**Conventions**](./context/conventions.md) | Coding standards, patterns, and library usage guidelines. |
| [**UI Conventions**](./context/ui-conventions.md) | Design system, color styling, and semantic visual attributes. |
| [**UX Guidelines**](./context/ux-guidelines.md) | Principles for low-friction entry, bilingual support, and human-centric data. |
| [**Environment Setup**](./context/env_setup.md) | Configuration for environment variables and local setup. |

## Specialized Folders

### [Skills](./skills/)
Modular methodologies and capabilities that can be "loaded" by an AI agent to perform complex tasks using specific frameworks or best practices.
- **Karpathy Guidelines**: LLM-augmented coding standards.
- **Test Driven Development**: Comprehensive TDD flow and anti-patterns.
- **Use Git Worktrees**: Workflow for managing multiple tasks simultaneously.
- **Vendor Sync**: Synchronizes .ai resources to IDE/vendor directories (Cursor, Copilot, etc.).

### [Prompts](./prompts/)
Pre-defined, high-context prompts for specific operational tasks.
- **Analyze Codebase**: Deep dive analysis for architectural understanding.

## Usage
AI agents MUST consult these files at the start of a session to:
- Understand the **"offline-first"** constraint before suggesting backend integrations.
- Learn the **database schema** and double-entry accounting logic before writing queries.
- Follow **established patterns** for component creation and styling (Tailwind is NOT used unless requested).
- Adhere to **bilingual support** (English/Tamil) requirements.
- Perform **complex tasks** using appropriate **skills**.
