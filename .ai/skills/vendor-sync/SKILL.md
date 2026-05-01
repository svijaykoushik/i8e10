---
name: vendor-sync
description: Synchronizes project-specific AI documentation, skills, and workflows to vendor-specific directories (e.g., .cursor, .github-copilot) using symbolic links. This ensures that third-party AI agents are grounded in the project's local context.
---

# Vendor Sync Skill

## Overview

This project maintains a central source of truth for AI agents in the `.ai/` directory. However, different IDEs and AI tools look for instructions in specific locations. The `vendor-sync` skill provides a systematic way to map our central `.ai` resources to these vendor-specific locations using symlinks.

**Core Principle:** Maintain a single source of truth in `.ai/` while providing compatibility for all AI vendors.

## Supported Vendors

The skill helps create symlinks for:
- `.cursor/` (Cursor IDE)
- `.github-copilot/` (GitHub Copilot)
- `.chatgpt/` (ChatGPT Custom Instructions/GPTs)
- `.codex/` (Codex/OpenAI)
- `.continue/` (Continue.dev)
- `.agents/` (Generic Agent frameworks)

## Usage

### 1. Run the Sync Helper
The skill provides a helper script to automate the creation of these symlinks.

```bash
bash .ai/skills/vendor-sync/sync.sh
```

### 2. Manual Sync (Optional)
If you only want to sync a specific vendor, you can run the script with arguments:

```bash
bash .ai/skills/vendor-sync/sync.sh .cursor .continue
```

## Structure Mapping

When synced, each vendor directory will contain symlinks to the following:

| Vendor Subdir | Target | Purpose |
| :--- | :--- | :--- |
| `context/` | `../../.ai/context/` | Project principles and architecture. |
| `skills/` | `../../.ai/skills/` | Specialized methodologies. |
| `workflows/` | `../../.ai/workflows/` | Operational procedures. |
| `prompts/` | `../../.ai/prompts/` | Reusable AI prompt templates. |
| `index.md` | `../../.ai/index.md` | The main AI entry point. |

## Why use Symlinks?

1. **No Duplication**: Edits made in `.ai/` are immediately reflected in all vendor directories.
2. **Compatibility**: Tools that only scan their own hidden directories (like `.cursor/`) will find the project's instructions.
3. **Cleanliness**: The `.ai/` directory remains the clean, canonical home for all AI-related metadata.

## Safety & Best Practices

- **Git Integration**: The script will automatically add created vendor directories to `.gitignore` if they are not already ignored, ensuring that symlinks aren't committed to the repository (unless explicitly desired).
- **Idempotency**: The script is safe to run multiple times; it will not recreate existing valid symlinks.
- **Verification**: After syncing, verify that your IDE/tool recognizes the linked instructions.
