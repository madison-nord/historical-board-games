---
title: Testing and Coverage Standards
inclusion: always
---

# Testing and Coverage Standards

## TDD Process
- Write tests FIRST, verify they fail, implement code, verify they pass
- Never mark test tasks complete without actual passing tests
- Never delete test files to fix compilation issues — fix them
- Property-based tests: minimum 100 iterations, use jqwik (Java) or fast-check (TS)

## Test Execution
- Run with `--silent` or `--quiet` flags to avoid session timeouts
- Use `--bail` or `--maxfail=1` to stop on first failure when debugging
- Filter with grep/pattern matching for focused testing
- Backend: `mvn test --quiet` or `mvn test -Dtest=ClassName`
- Frontend: `npm test -- --silent` or `npm test -- --grep "pattern"`

## Coverage Thresholds (Per-Package, Not Just Overall)

### Backend (JaCoCo 0.8.14)
| Package | Line | Branch |
|---------|------|--------|
| engine.* | 80% | 75% |
| service.* | 80% | 75% |
| controller.* | 80% | 70% |
| config.*, model.* | 70% | 60% |

### Frontend (Vitest V8)
| Directory | Statement | Branch | Function | Line |
|-----------|-----------|--------|----------|------|
| controllers/ | 80% | 75% | 80% | 80% |
| rendering/ | 80% | 75% | 80% | 80% |
| models/, utils/, network/ | 80% | 70% | 80% | 80% |

## Mutation Testing (PIT)
- Target: `engine.*` and `AIService` — core game logic
- Threshold: 70% mutation score
- Run: `mvn test-compile org.pitest:pitest-maven:mutationCoverage`

## Coverage Commands
- Backend: `mvn clean test` → `target/site/jacoco/index.html`
- Frontend: `npm run test:coverage` → `frontend/coverage/index.html`

## Architecture Awareness for Tests
- Check class immutability before writing tests (use constructors/applyMove, not setters)
- Read the class API with `readCode` before writing property tests
- Compile and run tests immediately after writing — don't batch
- Verify imports (common misses: `java.util.List`, `java.util.Map`)

## Constructor Overloading Pitfall
- `Move(MoveType, int to, PlayerColor)` — PLACE moves only
- `Move(MoveType, int from, int to, PlayerColor)` — MOVE and REMOVE
- REMOVE uses: `new Move(MoveType.REMOVE, -1, position, player)`
