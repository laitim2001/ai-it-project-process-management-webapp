# Root Files & Miscellaneous Directories Inventory

> **Analysis Date**: 2026-04-09
> **Scope**: Root-level files, hidden directories, and non-code directories that were not covered in prior codebase analyses
> **Total Items Catalogued**: 150+ files across 15+ directories

---

## Table of Contents

1. [Root-Level Markdown Documents](#1-root-level-markdown-documents)
2. [Root-Level Data and Output Files](#2-root-level-data-and-output-files)
3. [Docker Configuration Files](#3-docker-configuration-files)
4. [GitHub Configuration](#4-github-configuration)
5. [AI Assistant Configuration Directories](#5-ai-assistant-configuration-directories)
6. [BMad Methodology Directories](#6-bmad-methodology-directories)
7. [claudedocs/ Directory Deep Dive](#7-claudedocs-directory-deep-dive)
8. [Sample-Docs/ Directory](#8-sample-docs-directory)
9. [web-bundles/ Directory](#9-web-bundles-directory)
10. [archive/ Directory](#10-archive-directory)
11. [Miscellaneous Root Files](#11-miscellaneous-root-files)
12. [Staleness Assessment](#12-staleness-assessment)

---

## 1. Root-Level Markdown Documents

### AI-ASSISTANT-GUIDE.md
| Property | Value |
|----------|-------|
| **Path** | `AI-ASSISTANT-GUIDE.md` |
| **Size** | 58,657 bytes / 1,477 lines |
| **Last Modified** | 2025-12-16 |
| **Purpose** | Comprehensive quick-reference guide for AI assistants working with the codebase |
| **Current** | Partially outdated - header says "MVP Phase 1 - 5%" but body shows 100% |

**Content Summary**: Provides a mandatory onboarding flow for AI assistants (3 core actions), enforced rules (Chinese language, context loading, todo lists), complete Epic status tables (Phase 1, 1.5, 2), and Post-MVP enhancement tracking. Includes detailed code line counts per module.

**Staleness Notes**: The quick-nav header reference says "5%" but the actual content body correctly reflects 100% completion. The `lastUpdated` metadata was not consistently maintained. Does not reflect CHANGE-037 through CHANGE-041 or FEAT-009 through FEAT-012.

---

### AZURE-RESOURCES-INVENTORY.md
| Property | Value |
|----------|-------|
| **Path** | `AZURE-RESOURCES-INVENTORY.md` |
| **Size** | 7,912 bytes / 280 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Complete inventory of Azure cloud resources for the company dev environment |
| **Current** | Moderately current (scanned 2025-11-26) |

**Content Summary**: Documents 5 Azure resources in resource group `RG-RCITest-RAPO-N8N`: Web App Service (B1), App Service Plan, PostgreSQL Flexible Server (v14, Burstable B1ms), Storage Account, Container Registry. Includes connection strings, firewall rules, and database table statistics.

---

### CONTRIBUTING.md
| Property | Value |
|----------|-------|
| **Path** | `CONTRIBUTING.md` |
| **Size** | 16,988 bytes / 670 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Contribution guidelines for developers |
| **Current** | Current |

**Content Summary**: Covers development environment setup, standard development workflow (with Mermaid diagram), branch naming conventions (`feature/`, `fix/`, `refactor/`), conventional commit message format, code review guidelines, testing requirements, and documentation standards. Well-structured with checklists.

---

### DEVELOPMENT-LOG.md
| Property | Value |
|----------|-------|
| **Path** | `DEVELOPMENT-LOG.md` |
| **Size** | 307,977 bytes / 7,576 lines |
| **Last Modified** | 2025-12-18 |
| **Purpose** | Comprehensive development history in reverse-chronological order |
| **Current** | Current as of 2025-12-18 |

**Content Summary**: The largest single document in the project. Records every significant development event with date, type (feature/refactor/fix/config/docs), title, detailed description, modified files list, and statistics. Most recent entry: CHANGE-033~035 UI optimization series (2025-12-18). Goes back to project inception.

**Structure**: Reverse-chronological entries, each with: Date | Type | Title | Status, Background, Implementation details, Modified files, Statistics.

---

### DEVELOPMENT-SETUP.md
| Property | Value |
|----------|-------|
| **Path** | `DEVELOPMENT-SETUP.md` |
| **Size** | 24,098 bytes / 925 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Complete cross-platform development environment setup guide |
| **Current** | Current |

**Content Summary**: Step-by-step setup guide covering: hardware requirements, required software (Node.js 20, pnpm 8, Docker), installation instructions for Windows/macOS/Linux, pnpm installation, Docker Compose setup, environment variable configuration, database migration, and verification steps.

---

### FIXLOG.md
| Property | Value |
|----------|-------|
| **Path** | `FIXLOG.md` |
| **Size** | 118,965 bytes / 3,629 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Detailed bug fix records with root cause analysis |
| **Current** | Current through FIX-089 (in committed version) |

**Content Summary**: Documents 89+ bug fixes (FIX-001 through FIX-089) in reverse-chronological order. Each entry includes: problem type, discovery/resolution dates, severity (P0-P3), status, affected files, problem description, error messages, root cause analysis, solution, and test verification. Includes a quick search index by category (API, i18n, Toast, Auth, etc.).

**Structure**: Index table at top, then detailed records in reverse order. Categories: API/Backend, i18n/Internationalization, Frontend/React, Toast System, Authentication, Testing, Configuration.

---

### INDEX-MAINTENANCE-GUIDE.md
| Property | Value |
|----------|-------|
| **Path** | `INDEX-MAINTENANCE-GUIDE.md` |
| **Size** | 19,616 bytes / 594 lines |
| **Last Modified** | 2025-12-11 |
| **Purpose** | Strategy and procedures for maintaining the AI assistant navigation index system |
| **Current** | Current |

**Content Summary**: Defines when index updates are required (new pages, routers, schema changes), suggested (sprint end), and periodic (monthly). Includes Azure deployment file maintenance section, checklist templates, automated check commands (`pnpm index:check`), and archival strategies.

---

### PROJECT-INDEX.md
| Property | Value |
|----------|-------|
| **Path** | `PROJECT-INDEX.md` |
| **Size** | 73,739 bytes / 1,035 lines |
| **Last Modified** | 2025-12-16 |
| **Purpose** | Complete file navigation map for the project (250+ indexed files) |
| **Current** | Mostly current (last updated for CHANGE-010/011) |

**Content Summary**: Organized into 6 sections: Meta/Index files, Project documentation (overview, design system, PRD, architecture, user stories, infrastructure), Core code (frontend, API, database, auth), Configuration files, Development tools, and CI/CD. Each entry has file name, path, description, and importance rating (high/medium/low).

---

### QUICK-START.md
| Property | Value |
|----------|-------|
| **Path** | `QUICK-START.md` |
| **Size** | 10,754 bytes / 372 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Scenario-based quick-start guide for different audiences |
| **Current** | Current |

**Content Summary**: Provides four distinct startup flows: (1) New human developers (15-minute setup), (2) AI assistant cold start (fresh Claude Code session), (3) AI assistant warm start (after context compact), (4) Maintenance reminder mechanism. Includes standardized prompt templates for AI sessions.

---

### README.md
| Property | Value |
|----------|-------|
| **Path** | `README.md` |
| **Size** | 12,308 bytes / 420 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Project overview, tech stack, and quick start for GitHub visitors |
| **Current** | Current |

**Content Summary**: Standard project README with badges (TypeScript, Next.js, Prisma, tRPC, pnpm), project overview, 6-step core workflow diagram (Mermaid), core features list (MVP + Post-MVP), tech stack table, quick start instructions, project structure overview, development commands, and contribution link.

---

## 2. Root-Level Data and Output Files

### build-output.txt
| Property | Value |
|----------|-------|
| **Path** | `build-output.txt` |
| **Size** | 2,759 bytes / 57 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Captured output from a failed build attempt |
| **Current** | Historical artifact |

**Content**: Records a failed `pnpm build --filter=web` attempt. Errors: missing `@/components/ui/input`, `@/components/ui/select`, and `./Sidebar-new` modules. This is from an early development stage before these components were created.

**Status**: Should likely be gitignored or deleted -- it is a stale build log from early development.

---

### validate-output.txt
| Property | Value |
|----------|-------|
| **Path** | `validate-output.txt` |
| **Size** | 6,038 bytes / 147 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Output from JSDoc validation script |
| **Current** | Historical artifact |

**Content**: Records a `pnpm validate:jsdoc` run that found 156 code files, 100% with JSDoc, but 26 files with errors (missing `@fileoverview`, `@description`, `@author`, `@since` tags) and 66 files with warnings.

**Status**: Should likely be gitignored or deleted -- it is a stale validation snapshot.

---

### index-sync-report.json
| Property | Value |
|----------|-------|
| **Path** | `index-sync-report.json` |
| **Size** | 2,629 bytes / 73 lines |
| **Last Modified** | 2025-12-18 |
| **Purpose** | Machine-readable output from the index sync checker tool |
| **Current** | Current (generated by `pnpm index:check`) |

**Content**: JSON report from checker v1.2.0. Summary: 0 issues, 6 suggestions (all "add_to_index" type for recently created files like CHANGE-025/026, weekly report 2025-W51, SITUATION-10, and deployment log). Status: "needs_attention".

---

### mvp-progress-report.json
| Property | Value |
|----------|-------|
| **Path** | `mvp-progress-report.json` |
| **Size** | 9,373 bytes / 327 lines |
| **Last Modified** | 2025-12-01 |
| **Purpose** | Machine-readable MVP progress tracking data |
| **Current** | Severely outdated (data from 2025-10-03, shows 25% progress) |

**Content**: JSON structure tracking phases, epics, milestones, and team metrics. Shows Phase 1 completed, Phase 2 at 5% with Epic 1 at 80%. Team metrics: 5,300 lines, 86 files, 15 components, 5 API endpoints, 11 database models. All values are from the very early development stage.

**Status**: Severely stale. Current state is 35,000+ lines, 250+ files, 75+ components, 16 API routers, 27 Prisma models. This file was never updated after the initial MVP sprint.

---

### nul
| Property | Value |
|----------|-------|
| **Path** | `nul` |
| **Size** | 0 bytes (empty file) |
| **Last Modified** | 2025-01-27 |
| **Purpose** | Accidental Windows artifact |
| **Current** | N/A - should be deleted |

**Content**: Empty file. Created when a command on Windows attempted to redirect output to `nul` (the Windows null device) but instead created a literal file named "nul" because the shell was bash (Unix-style), not cmd.exe.

**Status**: Should be deleted and added to `.gitignore`.

---

### test-import-data.xlsx
| Property | Value |
|----------|-------|
| **Path** | `test-import-data.xlsx` |
| **Size** | 5,498 bytes |
| **Last Modified** | 2025-12-13 |
| **Purpose** | Test data file for FEAT-008 OM Expense Data Import feature |
| **Current** | Current (used for testing Excel import) |

**Content**: Excel spreadsheet containing sample OM Expense data for testing the data import pipeline. Related to FEAT-008 (OM Expense Data Import v1.0-v1.3).

---

## 3. Docker Configuration Files

### Root Docker Files

| File | Lines | Purpose |
|------|-------|---------|
| `Dockerfile` | 120 | Root-level production Dockerfile (multi-stage: base, deps, builder, runner) |
| `Dockerfile.migrate` | 37 | Standalone migration container for running `prisma migrate deploy` |
| `docker-compose.yml` | 104 | Local development services (PostgreSQL:5434, Redis:6381, Mailhog:1025/8025) |
| `docker-entrypoint.sh` | 72 | Entry point script for root Docker build |

### docker/ Directory (Production-Specific)

| File | Lines | Purpose |
|------|-------|---------|
| `docker/Dockerfile` | 155 | Production Dockerfile with more detailed multi-stage build, Alpine 3.17 for Prisma OpenSSL compatibility |
| `docker/docker-compose.prod.yml` | 176 | Production compose with web app, Redis, Nginx reverse proxy; uses Azure PostgreSQL externally |
| `docker/startup.sh` | 136 | Azure App Service startup script: runs Prisma migrate deploy, seeds Role/Currency tables, then starts Next.js |
| `docker/.dockerignore` | -- | Production-specific ignore patterns |

**Key Differences Between Root and docker/ Dockerfiles**:
- `docker/Dockerfile` is more detailed: explicitly copies `node_modules` per workspace, uses `node:20-alpine3.17` (for OpenSSL 1.1.x Prisma compatibility)
- Root `Dockerfile` is a simpler version, likely used during earlier development
- `docker/startup.sh` contains embedded seed logic (Roles: ProjectManager/Supervisor/Admin; Currencies: HKD/USD/CNY/GBP/EUR/JPY) -- this is the script used in Azure App Service deployments

---

## 4. GitHub Configuration

### .github/ISSUE_TEMPLATE/

| File | Lines | Purpose |
|------|-------|---------|
| `bug_report.yml` | 141 | GitHub Forms bug report template with fields: description, reproduce steps, expected/actual behavior, severity dropdown, version, environment, browser |
| `feature_request.yml` | 145 | Feature request template with: problem description, proposed solution, alternatives, priority dropdown, scope dropdown (10 modules), user story, acceptance criteria |
| `config.yml` | 11 | Disables blank issues, provides 3 contact links (docs, discussions, support email) |

**Note**: Templates use Traditional Chinese for labels and placeholders, consistent with project language standard.

### .github/pull_request_template.md
| Lines | 134 |
|-------|-----|

**Content**: Comprehensive PR template with sections: Change summary, Related issue, Change type checkboxes (8 types), Testing (steps, environment, results), Screenshots (before/after), Breaking changes, Performance impact, Security considerations, Checklist.

### .github/workflows/ (6 files, already analyzed elsewhere)
- `ci.yml` (2,222 lines) - CI pipeline
- `cd.yml` (2,137 lines) - CD pipeline
- `azure-deploy-dev.yml` (5,786 lines)
- `azure-deploy-staging.yml` (8,340 lines)
- `azure-deploy-prod.yml` (14,325 lines)
- `azure-deploy-example.yml` (12,414 lines)

---

## 5. AI Assistant Configuration Directories

### .claude/ Directory

| Path | Type | Purpose |
|------|------|---------|
| `.claude/settings.local.json` | Config (117 lines) | Local permissions whitelist for Bash commands (Azure CLI, Docker, Git, pnpm, node, etc.) |
| `.claude/agents/` | Directory (3 files) | Custom Claude Code agent definitions |
| `.claude/agents/architecture-planner.md` | Agent (8,713 bytes) | Architecture planning agent |
| `.claude/agents/project-analyzer-architect.md` | Agent (9,992 bytes) | Project analysis agent |
| `.claude/agents/surgical-task-executor.md` | Agent (21,002 bytes) | Targeted task execution agent |
| `.claude/commands/` | Directory (3 subdirs) | BMad methodology commands for Claude Code |
| `.claude/commands/BMad/` | 10 agents + 23 tasks | Software development BMad agents/tasks |
| `.claude/commands/bmad-cw/` | 11 agents + 26 tasks | Creative writing BMad agents/tasks |
| `.claude/commands/bmadInfraDevOps/` | 1 agent + 4 tasks | Infrastructure/DevOps BMad agents/tasks |
| `.claude/rules/` | Directory (10 files) | Code standards rules (already analyzed in CLAUDE.md) |

### .ai-context (Root)
| Property | Value |
|----------|-------|
| **Size** | 4,089 bytes / 113 lines |
| **Purpose** | Minimal context file for ultra-fast AI assistant loading (L0 of 4-layer index) |
| **Current** | Partially stale (says ~30,000+ lines, 18 pages; actual is 35,000+, 56+ pages) |

### .claude.md (Root)
| Property | Value |
|----------|-------|
| **Size** | 6,822 bytes / 198 lines |
| **Purpose** | Claude Code user-level configuration, project structure overview for root directory |
| **Current** | Partially stale (says 14 routers, 46 components; actual is 16/17 routers, 75+ components) |

---

## 6. BMad Methodology Directories

### .bmad-core/
| Property | Value |
|----------|-------|
| **Purpose** | Core BMad methodology framework for AI-assisted software development |
| **File Count** | ~50+ files |
| **Current** | Static framework (not project-specific, unlikely to change) |

**Structure**:
- `agents/` - 10 role agents (analyst, architect, bmad-master, bmad-orchestrator, dev, pm, po, qa, sm, ux-expert)
- `agent-teams/` - 4 team configurations (all, fullstack, ide-minimal, no-ui)
- `checklists/` - 6 checklists (architect, change, pm, po-master, story-dod, story-draft)
- `tasks/` - 23 task definitions (brownfield-create-story, correct-course, create-doc, etc.)
- `templates/` - YAML templates (architecture, brainstorming, brownfield, PRD, etc.)
- `data/` - Knowledge base (bmad-kb.md, brainstorming techniques, elicitation methods)
- `utils/`, `workflows/` - Utility and workflow definitions
- `core-config.yaml`, `install-manifest.yaml`, `user-guide.md`

### .bmad-creative-writing/
| Property | Value |
|----------|-------|
| **Purpose** | BMad expansion pack for creative writing projects |
| **File Count** | ~30+ files |
| **Relevance** | Not related to ITPM project -- a generic BMad expansion |

**Structure**: agents/ (11 creative writing agents: beta-reader, book-critic, character-psychologist, etc.), agent-teams/, checklists/, data/, tasks/, templates/, utils/, workflows/

### .bmad-infrastructure-devops/
| Property | Value |
|----------|-------|
| **Purpose** | BMad expansion pack for infrastructure and DevOps |
| **File Count** | ~10 files |
| **Relevance** | Potentially relevant for Azure deployment workflows |

**Structure**: agents/ (1: infra-devops-platform), checklists/ (infrastructure-checklist), data/, tasks/, templates/, utils/

### .cursor/
| Property | Value |
|----------|-------|
| **Purpose** | Cursor IDE rules directory containing BMad agent definitions in .mdc format |
| **File Count** | 21 files |
| **Content** | `.cursor/rules/bmad/` contains 21 .mdc files (Cursor IDE format equivalents of the BMad agents) |

---

## 7. claudedocs/ Directory Deep Dive

### File Count by Subdirectory

| Subdirectory | Files | Description |
|--------------|-------|-------------|
| `1-planning/` | 70 | Feature plans (FEAT-001~012), architecture, epics, roadmap |
| `2-sprints/` | 9 | Sprint plans and testing validation reports |
| `3-progress/` | 9 | Daily logs (2), weekly reports (7: W45-W51) |
| `4-changes/` | 97 | Bug fixes (47), feature changes (38), i18n changes (14) |
| `5-status/` | 17 | E2E testing reports (11), manual testing (6) |
| `6-ai-assistant/` | 30 | Prompts and workflow guides |
| `7-archive/` | 23 | Archived documents |
| Root-level files | 12 | Azure deployment docs, schema sync, reorganization plan |
| **Total** | **267** | |

### Root-Level claudedocs/ Files (12 files)

| File | Size | Purpose |
|------|------|---------|
| `CLAUDE.md` | 16,487 bytes | Directory-level Claude guide for claudedocs/ |
| `README.md` | 13,591 bytes | Documentation structure overview |
| `DOCUMENTATION-STRUCTURE-V2.md` | 15,777 bytes | Documentation reorganization plan |
| `PROJECT-REORGANIZATION-PLAN.md` | 22,468 bytes | Full project reorganization strategy |
| `WINDOWS-RESTART-GUIDE.md` | 6,024 bytes | Docker/service restart guide for Windows |
| `COMPANY-AZURE-DEPLOYMENT-LOG.md` | 16,027 bytes | Company Azure deployment history |
| `SCHEMA-SYNC-MECHANISM.md` | 8,406 bytes | Database schema synchronization strategy |
| `AZURE-CLEANUP-COMPLETION.md` | 4,078 bytes | Azure resource cleanup documentation |
| `AZURE-DEPLOYMENT-CHECKLIST.md` | 12,412 bytes | Deployment checklist |
| `AZURE-DEPLOYMENT-COMPLETION-COMPANY.md` | 12,497 bytes | Company deployment completion report |
| `AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md` | 11,368 bytes | Deployment file organization guide |
| `AZURE-LOGIN-I18N-FIX-DEPLOYMENT.md` | 8,845 bytes | Login i18n fix deployment record |
| `AZURE-PRISMA-FIX-DEPLOYMENT-SUCCESS.md` | 11,822 bytes | Prisma fix deployment record |
| `AZURE-SITUATION-6-VALIDATION-V9.md` | 6,891 bytes | Situation 6 validation report |

### 4-changes/bug-fixes/ (47 files - Most Active)

Covers FIX-009 through FIX-134, including recent additions:
- `FIX-100-codebase-analysis-bugfix-plan.md` (2026-04-09, untracked)
- `FIX-101-103-security-auth-fixes.md` (2026-04-09, untracked)
- `FIX-104-106-security-auth-data-fixes.md` (2026-04-09, untracked)
- `FIX-107-108-git-route-doc-fixes.md` (2026-04-09, untracked)
- `FIX-109-112-high-priority-fixes.md` (2026-04-09, untracked)
- `FIX-116-120-i18n-comprehensive-fix.md` through `FIX-129-133-134-ux-consistency-fixes.md` (2026-04-09, untracked)

### 4-changes/feature-changes/ (38 files)

Covers CHANGE-001 through CHANGE-041, fully current through 2025-01-27.

### Coverage Assessment

| Subdirectory | Previously Analyzed | Notes |
|--------------|-------------------|-------|
| `1-planning/features/` | Partially | Feature plans referenced but not individually catalogued |
| `2-sprints/` | No | Sprint planning and test reports |
| `3-progress/` | No | Weekly reports W45-W51 |
| `4-changes/bug-fixes/` | Partially | Individual FIX docs referenced but not inventoried |
| `4-changes/feature-changes/` | Partially | CHANGE docs referenced but not inventoried |
| `4-changes/i18n/` | No | 14 i18n implementation documents |
| `5-status/` | No | E2E and manual testing status |
| `6-ai-assistant/` | No | AI assistant prompts and workflows |
| `7-archive/` | No | Archived older documents |

---

## 8. Sample-Docs/ Directory

| Property | Value |
|----------|-------|
| **Path** | `Sample-Docs/` |
| **File Count** | 15 files + 1 script |
| **Purpose** | Reference copies of key project documents from earlier development stages |
| **Current** | Historical snapshots -- NOT templates for new projects |

### File Listing

| File | Size | Content |
|------|------|---------|
| `AI-ASSISTANT-GUIDE.md` | 23,652 bytes | Earlier version of the AI assistant guide |
| `architecture.md` | 110,286 bytes | Full architecture specification |
| `DEVELOPMENT-LOG.md` | 309,335 bytes | Earlier snapshot of development log |
| `DEVELOPMENT-SERVICE-MANAGEMENT.md` | 4,667 bytes | Service management guide |
| `FIXLOG.md` | 67,416 bytes | Earlier snapshot of fix log |
| `front-end-spec.md` | 24,230 bytes | Frontend specification document |
| `INDEX-MAINTENANCE-GUIDE.md` | 8,494 bytes | Earlier version of index maintenance |
| `mvp2-development-plan.md` | 27,301 bytes | MVP Phase 2 development plan |
| `mvp2-implementation-checklist.md` | 62,093 bytes | MVP Phase 2 implementation checklist |
| `mvp-development-plan.md` | 11,270 bytes | Original MVP development plan |
| `mvp-implementation-checklist.md` | 18,189 bytes | Original MVP implementation checklist |
| `PROJECT-INDEX.md` | 88,572 bytes | Earlier version of project index |
| `START-SERVICES.md` | 3,838 bytes | Service startup guide |
| `STARTUP-GUIDE.md` | 23,821 bytes | Full startup guide |
| `scripts/check-index-sync.js` | 19,245 bytes | Earlier version of index sync tool |

**Assessment**: These are reference snapshots of documents at various development stages. They appear to be kept for historical comparison. The `architecture.md` (110KB) is notably large and may contain the most complete early architecture spec. The `mvp2-*` files contain Phase 2 planning that informed the current implementation.

---

## 9. web-bundles/ Directory

| Property | Value |
|----------|-------|
| **Path** | `web-bundles/` |
| **Purpose** | Pre-bundled BMad agent definitions for web-based AI assistants |
| **Total Size** | ~5+ MB of .txt bundle files |
| **Relevance** | BMad framework distribution files, NOT specific to the ITPM project |

### Structure

```
web-bundles/
  agents/         # 10 bundled agent .txt files (28KB-374KB each)
  teams/          # 4 team bundles (202KB-520KB each)
  expansion-packs/
    bmad-2d-phaser-game-dev/    # Phaser game development agents/teams
    bmad-2d-unity-game-dev/     # Unity 2D game development agents/teams
    bmad-creative-writing/      # Creative writing agents/teams
    bmad-godot-game-dev/        # Godot game development agents/teams
    bmad-infrastructure-devops/ # Infrastructure/DevOps agent
```

**Assessment**: These are large text bundles that concatenate agent definitions with their supporting knowledge bases for use in web-based AI chat interfaces (where you paste the entire bundle). They are part of the BMad methodology distribution and are NOT project-specific. The `godot-game-team.txt` alone is 1.1MB.

**Recommendation**: These files significantly bloat the repository. Consider whether they need to be committed (they total several MB of non-project-specific content).

---

## 10. archive/ Directory

| Property | Value |
|----------|-------|
| **Path** | `archive/epic-records/` |
| **File Count** | 3 files |
| **Purpose** | Archived records of completed early Epics |

### Contents

| File | Size | Content |
|------|------|---------|
| `EPIC1-RECORD.md` | 6,617 bytes | Complete record of Epic 1 (Azure AD B2C Authentication) |
| `EPIC2-RECORD.md` | 11,165 bytes | Complete record of Epic 2 (Project Management) |
| `認證系統實現摘要.md` | 5,010 bytes | Authentication system implementation summary (Chinese) |

**Assessment**: Contains the first two Epic completion records. Later Epics (3-8) do not have corresponding archive records here, suggesting the archival practice was discontinued in favor of the claudedocs/ structure.

---

## 11. Miscellaneous Root Files

### Configuration Files (Not Analyzed in Detail)

| File | Lines | Purpose |
|------|-------|---------|
| `.editorconfig` | -- | Editor formatting rules (1,384 bytes) |
| `.eslintrc.json` | -- | ESLint configuration (2,618 bytes) |
| `.eslintrc.design-system.js` | -- | Design system-specific ESLint rules (2,433 bytes) |
| `.prettierrc.json` | -- | Prettier formatting configuration (669 bytes) |
| `.prettierignore` | -- | Prettier ignore patterns (629 bytes) |
| `.nvmrc` | 1 | Node.js version: 20.11.0 |
| `.gitattributes` | -- | Git line ending and LFS rules (770 bytes) |
| `.dockerignore` | -- | Docker build context exclusions (1,056 bytes) |
| `.index-check-time` | 1 | Timestamp of last index check |
| `turbo.json` | -- | Turborepo pipeline configuration (1,064 bytes) |
| `tsconfig.json` | -- | Root TypeScript configuration (181 bytes) |
| `pnpm-workspace.yaml` | -- | Workspace package definitions (226 bytes) |
| `package.json` | -- | Root workspace package.json (2,731 bytes) |

### .vscode/ Directory

| File | Purpose |
|------|---------|
| `.vscode/settings.json` | VS Code workspace settings (7,169 bytes) |
| `.vscode/extensions.json` | Recommended VS Code extensions (5,265 bytes) |

### backups/ Directory

| File | Size | Purpose |
|------|------|---------|
| `backups/itpm_dev_backup_pre_feat007.sql` | 73,682 bytes | PostgreSQL database dump taken before FEAT-007 (OM Expense refactoring) as a rollback point |

### azure/ Directory (Partially Analyzed)

| Subdirectory | Content |
|--------------|---------|
| `azure/README.md` | 9,857 bytes - Main deployment entry point |
| `azure/docs/` | Deployment troubleshooting, service principal setup |
| `azure/environments/` | Company and personal environment configs (.env examples) |
| `azure/output/` | Deployment output files (credentials) |
| `azure/scripts/` | Deployment automation scripts |
| `azure/templates/` | ARM/Bicep templates |
| `azure/tests/` | Deployment test scripts |

---

## 12. Staleness Assessment

### Files Needing Updates

| File | Issue | Priority |
|------|-------|----------|
| `mvp-progress-report.json` | Data from 2025-10-03, shows 25% when actual is 100%+ | Low (not actively used) |
| `.ai-context` | Says ~30,000+ lines, 18 pages; actual 35,000+, 56+ pages | Medium |
| `.claude.md` | Says 14 routers, 46 components; actual 16-17 routers, 75+ | Medium |
| `AI-ASSISTANT-GUIDE.md` | Nav header reference says "5%" in URL slug | Low |

### Files That Should Be Cleaned Up

| File | Recommendation |
|------|---------------|
| `nul` | Delete (empty Windows artifact) |
| `build-output.txt` | Delete or gitignore (stale early build log) |
| `validate-output.txt` | Delete or gitignore (stale validation output) |

### Directories That Could Be Reconsidered

| Directory | Observation |
|-----------|-------------|
| `web-bundles/` | ~5+ MB of non-project BMad bundles; consider .gitignore or separate repo |
| `.bmad-creative-writing/` | Creative writing expansion pack, irrelevant to ITPM |
| `Sample-Docs/` | Historical snapshots, could be archived or trimmed |

---

*Generated by codebase analysis on 2026-04-09*
