---
title: Project Standards
inclusion: always
---

# Nine Men's Morris — Project Standards

## Tech Stack
- Backend: Java 25, Spring Boot 3.4.x, Maven 3.9.x, jqwik (property testing), JUnit 5
- Frontend: Vanilla TypeScript + Canvas API (no React/Angular), Vitest, Playwright (E2E)
- WebSocket: STOMP protocol for online multiplayer
- JAVA_HOME: `C:\Program Files\Java\jdk-25.0.2`
- M2_HOME: `C:\tools\apache-maven-3.9.9`

## Architecture
- Game engine: pure Java, independent of UI framework, immutable data structures
- Three-phase game: Placement → Movement → Flying
- Frontend: 60 FPS rendering with requestAnimationFrame, responsive for mobile+desktop
- REST endpoints for stateless ops (AI), WebSocket for stateful ops (online games)
- SOLID principles, clear separation between engine and presentation

## Code Quality
- Never create duplicate files (`_fixed`, `_clean`, `_backup`)
- All public Java classes/methods need JavaDoc
- Use strict TypeScript config, prefer `const`, meaningful names
- Proper error handling and logging throughout
- Keep functions small and single-responsibility

## Git
- Conventional commits: `type(scope): description` (feat, fix, docs, test, chore)
- Imperative mood, first line under 50 chars
- Feature branches, keep main deployable
- Never commit secrets — use environment variables

## Security
- Never hardcode secrets, API keys, or passwords
- Validate all user inputs
- Use HTTPS, secure headers, proper session management
- Keep dependencies updated, remove unused ones
- Use lock files for consistent installs

## Dependencies
- Use latest stable versions, verify compatibility before adding
- Justify each new dependency with clear value
- Prefer well-maintained libraries with active communities

## Performance Targets
- 60 FPS during animations
- AI move selection < 2 seconds
- WebSocket latency < 500ms

## Task Management
- One task at a time, mark in_progress before starting
- Mark completed only when fully implemented and tested
- Commit after each completed task
