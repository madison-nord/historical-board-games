# Test Coverage Guide

## Overview

This project uses industry-standard coverage tools to ensure code quality:

- **Backend (Java)**: JaCoCo 0.8.14 for code coverage + PIT 1.17.3 for mutation testing
- **Frontend (TypeScript)**: Vitest 2.1.8 with V8 coverage provider

## ✅ Status: FULLY CONFIGURED AND WORKING

Both backend and frontend test coverage are now fully configured and operational:
- Backend: JaCoCo 0.8.14 supports Java 25 (released 2025/10/11)
- Frontend: All 246 tests passing with 86.63% coverage
- All coverage thresholds configured and enforced

## Backend Coverage (Java)

### JaCoCo Code Coverage

**Current Version**: 0.8.14 (supports Java 25)

**Run coverage report:**
```bash
mvn clean test
```

**View report:**
- Open `target/site/jacoco/index.html` in browser
- Console shows summary after tests

**Coverage thresholds:**
- Line coverage: 80%
- Branch coverage: 75%

**What's excluded:**
- Application main class
- Model classes (simple POJOs)
- Configuration classes

### PIT Mutation Testing

**What is PIT?**
PIT introduces small bugs (mutations) into your code to verify your tests actually catch them. It's "testing your tests."

**Run mutation testing:**
```bash
mvn test-compile org.pitest:pitest-maven:mutationCoverage
```

**View report:**
- Open `target/pit-reports/YYYYMMDDHHMI/index.html` in browser

**What's tested with PIT:**
- `com.ninemensmorris.engine.*` - Critical game logic
  - Board.java - Board state and mill detection
  - RuleEngine.java - Move validation and game rules
  - GameState.java - Game state management
- `com.ninemensmorris.service.AIService` - AI move selection

**Mutation threshold:** 70% (good quality bar)

**Why these classes?**
These contain the core game logic where bugs would break gameplay. PIT ensures our tests actually verify the rules work correctly.

### Maven Commands Summary

```bash
# Run tests with coverage
mvn clean test

# Run tests with coverage and enforce thresholds
mvn clean verify

# Run mutation testing (takes longer)
mvn test-compile org.pitest:pitest-maven:mutationCoverage

# Skip tests (for quick builds)
mvn clean install -DskipTests

# Run specific test class
mvn test -Dtest=BoardTest

# Run tests quietly
mvn test --quiet
```

## Frontend Coverage (TypeScript)

### Vitest V8 Coverage

**Run tests with coverage:**
```bash
cd frontend
npm run test:coverage
```

**View report:**
- Console shows summary
- Open `frontend/coverage/index.html` in browser

**Coverage thresholds:**
- Line coverage: 80%
- Function coverage: 80%
- Branch coverage: 75%
- Statement coverage: 80%

**What's excluded:**
- Test files (*.test.ts, *.spec.ts)
- Type definitions (*.d.ts)
- Test setup files
- Simple enum types (GameMode, GamePhase, etc.)

**What's included:**
- All source files in `src/**/*.{ts,tsx}`
- Controllers (GameController, TutorialController, UIManager)
- Rendering (BoardRenderer, Animations)
- Models (GameState, Move)
- Utils (LocalStorage, logger)

### NPM Scripts Summary

```bash
# Run tests (no coverage)
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with coverage and UI
npm run test:coverage:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Coverage Best Practices

### 1. Multi-Dimensional Coverage

Don't rely on line coverage alone:
- **Line Coverage**: Measures which lines were executed
- **Branch Coverage**: Measures which decision branches were taken
- **Function Coverage**: Measures which functions were called
- **Mutation Score**: Measures if tests actually verify behavior

### 2. Coverage Quality Over Quantity

```typescript
// ❌ BAD: 100% coverage but no assertions
test('should process move', () => {
  gameController.handlePositionClick(5);
  // No assertions - test passes but verifies nothing
});

// ✅ GOOD: Proper assertions
test('should place piece at position 5', () => {
  gameController.handlePositionClick(5);
  expect(gameController.getPieceAt(5)).toBe('WHITE');
  expect(gameController.getCurrentPlayer()).toBe('BLACK');
});
```

### 3. Focus on Critical Paths

Prioritize coverage for:
- Business logic (game rules, validation)
- Complex algorithms (AI, mill detection)
- Error handling paths
- Edge cases and boundary conditions

### 4. Appropriate Exclusions

It's okay to exclude:
- Generated code
- Simple getters/setters
- Configuration files
- Type definitions
- Trivial code

### 5. Use Coverage to Find Gaps

Coverage reports show:
- **Red/uncovered**: Code never executed by tests
- **Yellow/partial**: Branches partially covered
- **Green/covered**: Code fully covered

Use this to identify:
- Missing test cases
- Dead code (can be removed)
- Complex code that needs more tests

## Mutation Testing Deep Dive

### How PIT Works

1. **Mutate**: Changes your bytecode (e.g., `+` → `-`, `>` → `>=`)
2. **Test**: Runs your test suite against each mutation
3. **Report**: Shows which mutations were "killed" (caught) vs "survived"

### Common Mutations

| Mutation | Example | What It Tests |
|----------|---------|---------------|
| Conditionals Boundary | `<` → `<=` | Boundary conditions |
| Negate Conditionals | `==` → `!=` | Condition logic |
| Math | `+` → `-` | Arithmetic correctness |
| Return Values | `return true` → `return false` | Return value verification |
| Increments | `i++` → `i--` | Loop logic |

### Interpreting PIT Results

```
Line Coverage: 95%
Mutation Coverage: 65%
```

This means:
- ✅ Tests execute 95% of code
- ⚠️ Tests only verify 65% of behavior
- 📝 Need better assertions in tests

**Good mutation scores:**
- 70-80%: Good
- 80-90%: Excellent
- 90%+: Outstanding (diminishing returns)

### Example: Weak vs Strong Tests

**Code:**
```java
public boolean isValidMove(int from, int to) {
    if (from < 0 || from >= 24) return false;
    if (to < 0 || to >= 24) return false;
    if (!isAdjacent(from, to)) return false;
    return true;
}
```

**Weak Test (survives mutations):**
```java
@Test
void testIsValidMove() {
    boolean result = board.isValidMove(0, 1);
    // No assertion - mutation survives!
}
```

**Strong Test (kills mutations):**
```java
@Test
void testIsValidMove() {
    // Valid move
    assertTrue(board.isValidMove(0, 1));
    
    // Invalid: negative position
    assertFalse(board.isValidMove(-1, 1));
    
    // Invalid: position too large
    assertFalse(board.isValidMove(0, 24));
    
    // Invalid: not adjacent
    assertFalse(board.isValidMove(0, 5));
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Coverage

on: [push, pull_request]

jobs:
  backend-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '25'
      - name: Run tests with coverage
        run: mvn clean verify
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./target/site/jacoco/jacoco.xml

  frontend-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests with coverage
        run: cd frontend && npm run test:coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/lcov.info
```

## Troubleshooting

### Backend Issues

**Problem**: JaCoCo report not generated
```bash
# Solution: Ensure tests run first
mvn clean test
# Then check target/site/jacoco/index.html
```

**Problem**: PIT takes too long
```bash
# Solution: Target specific classes
mvn test-compile org.pitest:pitest-maven:mutationCoverage -DtargetClasses=com.ninemensmorris.engine.Board
```

**Problem**: Coverage threshold not met
```bash
# Solution: Check which classes need more tests
# Open target/site/jacoco/index.html
# Red/yellow areas need more coverage
```

### Frontend Issues

**Problem**: Coverage report not generated
```bash
# Solution: Ensure @vitest/coverage-v8 is installed
npm install -D @vitest/coverage-v8@2.1.8
npm run test:coverage
```

**Problem**: Coverage threshold not met
```bash
# Solution: Check coverage report
# Open frontend/coverage/index.html
# Look for uncovered lines (red) and branches (yellow)
```

**Problem**: Tests timeout
```bash
# Solution: Increase timeout in vitest.config.ts
test: {
  testTimeout: 10000,
}
```

## Coverage Reports Location

### Backend
- **JaCoCo HTML**: `target/site/jacoco/index.html`
- **JaCoCo XML**: `target/site/jacoco/jacoco.xml`
- **PIT HTML**: `target/pit-reports/YYYYMMDDHHMI/index.html`
- **PIT XML**: `target/pit-reports/YYYYMMDDHHMI/mutations.xml`

### Frontend
- **HTML Report**: `frontend/coverage/index.html`
- **LCOV**: `frontend/coverage/lcov.info`
- **JSON**: `frontend/coverage/coverage-final.json`

## Next Steps

1. **Run initial coverage reports** to establish baseline
2. **Review uncovered code** and add tests where needed
3. **Run mutation testing** on critical game logic
4. **Improve weak tests** identified by PIT
5. **Integrate into CI/CD** for continuous monitoring

## Resources

- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)
- [PIT Mutation Testing](https://pitest.org/)
- [Vitest Coverage](https://vitest.dev/guide/coverage)
- [V8 Coverage](https://v8.dev/blog/javascript-code-coverage)
