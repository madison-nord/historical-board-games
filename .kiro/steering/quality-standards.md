---
title: Quality Standards
inclusion: always
---

# Quality Standards

## Complete Implementation
- Implement features fully per requirements. Never suggest shortcuts or "good enough."
- Every acceptance criterion must be met before marking complete.
- Never implement text-only when interactive is required.
- Fix issues immediately — don't defer to "later."

## Checkpoint Tasks
- Checkpoints MUST NOT be marked complete until ALL tests pass.
- Run all automated tests (unit, integration, property-based, E2E) before marking done.
- Never skip ahead when tests fail. Never substitute manual checklists for fixing tests.
- Workflow: run tests → fix failures → verify completeness → manual check → mark complete.

## File Deletion Policy
- Never delete files without explicit user permission.
- Fix files instead of deleting them. Use strReplace/editCode, not delete+recreate.
- If deletion seems needed, explain why and wait for approval.

## New File Linting
- All new files must have zero linting errors before commit.
- Run getDiagnostics immediately after creating any file.
- Acceptable exceptions: references to future-task code (document with TODO + task number).
- Java: check imports, null safety, JavaDoc. TypeScript: check unused vars, types, console.log.
- Use `@SuppressWarnings("specific-type") // reason` — never blanket suppressions.
