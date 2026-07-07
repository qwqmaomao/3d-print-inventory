<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Existing Function Stability First
- Template principle 2 -> II. Spec Before Code
- Template principle 3 -> III. Minimal Dependencies and Local-First Operation
- Template principle 4 -> IV. Data Safety and Backward Compatibility
- Template principle 5 -> V. Incremental, Testable Delivery
Added sections:
- Product Constraints
- Development Workflow
Removed sections:
- Template placeholder sections and comments
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ⚠ .specify/templates/commands/*.md not present in this project
- ✅ README.md
Follow-up deferred items:
- None
-->
# 3D 打印耗材库存 Constitution

## Core Principles

### I. Existing Function Stability First
The project already has a working 3D printing filament inventory web page. Every
change MUST preserve existing inventory, import, image, backup, trash, restock,
queue, quote, duplicate detection, label, and scan workflows unless a spec
explicitly approves a breaking change. Refactors MUST be small, justified by the
feature need, and covered by regression checks for the affected workflows.

Rationale: The user's inventory data and daily workflow are more valuable than
architectural novelty.

### II. Spec Before Code
Every new feature MUST define user scenarios, boundary conditions, and acceptance
criteria before implementation. A plan MUST explain how the feature fits the
current static app, which existing workflows it touches, and how success will be
verified. Ambiguous behavior MUST be recorded as an assumption or clarification
before code is changed.

Rationale: This project evolves through practical inventory workflows; clear
scenarios keep additions useful and reduce accidental scope growth.

### III. Minimal Dependencies and Local-First Operation
The app MUST remain a directly openable static web page by default. New
dependencies MUST be avoided unless they replace complex, risky, or standards-
heavy code with a mature local module. Any accepted dependency MUST be vendored
locally, work without a CDN or backend, and be documented with its purpose.

Rationale: Offline use, easy backup, and low maintenance are core product traits.

### IV. Data Safety and Backward Compatibility
Changes MUST preserve existing LocalStorage keys, IndexedDB image assets, JSON
backup behavior, and ZIP backup behavior unless a migration plan is documented.
New data fields MUST provide defaults for old records. Destructive operations
MUST prefer recoverable states such as the trash flow, and restore paths MUST be
kept testable.

Rationale: Lost filament records, images, or backup compatibility would break the
main reason this tool exists.

### V. Incremental, Testable Delivery
Features MUST be implemented in small, independently verifiable slices. Each
slice MUST include checks appropriate to its risk, at minimum `node --check
app.js` for JavaScript changes and targeted manual or scripted checks for
affected workflows. Large rewrites, framework migrations, and unrelated cleanup
MUST be deferred unless the spec proves they are required.

Rationale: The application is a compact static tool; incremental changes are the
best way to keep it reliable while it grows.

## Product Constraints

- The default runtime is a no-backend static page opened through `index.html`.
- Primary storage remains browser LocalStorage plus IndexedDB for images.
- WPS/Excel import, WPS `DISPIMG` image extraction, JSON backup, and ZIP backup
  are compatibility-critical workflows.
- The UI language is Chinese unless a feature spec explicitly requires another
  language.
- GitHub/open-source modules MAY be used when they are mature, locally vendored,
  and reduce implementation risk; unnecessary dependencies MUST be rejected.

## Development Workflow

1. Start each feature with a specification containing prioritized user scenarios,
   edge cases, acceptance criteria, and regression risks.
2. Write an implementation plan that names touched files, data keys, migration
   behavior, dependency decisions, and validation steps.
3. Implement the smallest useful slice first, preserving existing behavior.
4. Verify syntax and affected workflows before reporting completion.
5. Update README or relevant docs when user-visible behavior, storage keys, or
   dependency choices change.

## Governance

This constitution supersedes ad hoc development preferences for this project.
Any feature plan, code change, or review MUST check compliance with the Core
Principles. Amendments require a documented reason, a semantic version update,
and synchronization of affected templates and runtime guidance.

Versioning policy:
- MAJOR: Removes or redefines a core principle in a backward-incompatible way.
- MINOR: Adds a principle, section, or materially expands governance.
- PATCH: Clarifies wording without changing required behavior.

Compliance review:
- Plans MUST include a Constitution Check before implementation.
- Tasks MUST include validation for affected existing workflows.
- If a principle is violated, the plan MUST document the violation, why it is
  necessary, and the simpler alternative that was rejected.

**Version**: 1.0.0 | **Ratified**: 2026-07-08 | **Last Amended**: 2026-07-08
