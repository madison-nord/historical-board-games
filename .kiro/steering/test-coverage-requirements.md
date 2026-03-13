# Test Coverage Requirements

## Core Principle

**Each package/module MUST meet coverage thresholds independently. Overall coverage is not sufficient - untested packages create risk.**

## Why Per-Package Coverage Matters

### The Problem with Overall-Only Coverage

If you only enforce overall coverage (e.g., 80% across entire codebase):
- ❌ Critical packages could have 0% coverage
- ❌ Easy packages (DTOs, models) could inflate overall numbers
- ❌ Complex logic (engine, services) could be undertested
- ❌ Bugs hide in untested packages

**Example of hidden risk:**
```
Overall Coverage: 85% ✅ (looks good!)

But breakdown shows:
- Controllers: 100% (easy to test)
- Models: 100% (simple getters/setters)
- DTOs: 100% (trivial)
- Engine: 45% ❌ (CRITICAL GAME LOGIC UNDERTESTED!)
- Services: 60% ❌ (BUSINESS LOGIC UNDERTESTED!)
```

The overall 85% hides that critical packages are dangerously undertested.

## Coverage Thresholds by Package

### Backend (Java with JaCoCo)

**Required thresholds for EACH package:**

| Package | Line Coverage | Branch Coverage | Rationale |
|---------|--------------|-----------------|-----------|
| `engine.*` | 80% | 75% | Core game logic - critical |
| `service.*` | 80% | 75% | Business logic - critical |
| `controller.*` | 80% | 70% | API endpoints - important |
| `dto.*` | 80% | 70% | Data transfer - important |
| `config.*` | 70% | 60% | Configuration - lower risk |
| `model.*` | 70% | 60% | Simple POJOs - lower risk |

**Overall minimum:** 80% line, 75% branch

### Frontend (TypeScript with Vitest V8)

**Required thresholds for EACH directory:**

| Directory | Statement | Branch | Function | Line | Rationale |
|-----------|-----------|--------|----------|------|-----------|
| `controllers/` | 80% | 75% | 80% | 80% | Game orchestration - critical |
| `rendering/` | 80% | 75% | 80% | 80% | Visual feedback - important |
| `models/` | 80% | 70% | 80% | 80% | Data structures - important |
| `utils/` | 80% | 75% | 80% | 80% | Helper functions - important |
| `network/` | 80% | 75% | 80% | 80% | Communication - critical |

**Overall minimum:** 80% statement, 75% branch, 80% function, 80% line

## Enforcement Strategy

### 1. Configure Coverage Tools Per-Package

**Backend (pom.xml with JaCoCo):**
```xml
<execution>
    <id>check-coverage</id>
    <goals>
        <goal>check</goal>
    </goals>
    <configuration>
        <rules>
            <!-- Overall rules -->
            <rule>
                <element>BUNDLE</element>
                <limits>
                    <limit>
                        <counter>LINE</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.80</minimum>
                    </limit>
                    <limit>
                        <counter>BRANCH</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.75</minimum>
                    </limit>
                </limits>
            </rule>
            <!-- Per-package rules -->
            <rule>
                <element>PACKAGE</element>
                <limits>
                    <limit>
                        <counter>LINE</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.80</minimum>
                    </limit>
                    <limit>
                        <counter>BRANCH</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.75</minimum>
                    </limit>
                </limits>
            </rule>
        </rules>
    </configuration>
</execution>
```

**Frontend (vitest.config.ts):**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  thresholds: {
    // Overall thresholds
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
    // Per-file thresholds
    perFile: true,
    // Specific directory thresholds
    'src/controllers/**': {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    'src/rendering/**': {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    'src/utils/**': {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
}
```

### 2. Review Coverage Reports by Package

**Always check package-level breakdown:**

```bash
# Backend - view by package
mvn clean test
# Open target/site/jacoco/index.html
# Click into each package to see coverage

# Frontend - view by directory
cd frontend
npm run test:coverage
# Open frontend/coverage/index.html
# Check each directory's coverage
```

### 3. Identify Gaps Early

When coverage report shows a package below threshold:
1. **Don't ignore it** - fix it immediately
2. **Identify untested code** - what's missing?
3. **Write targeted tests** - focus on the gaps
4. **Verify improvement** - re-run coverage

### 4. Prevent Regression

**In CI/CD:**
- Fail build if ANY package is below threshold
- Don't allow "overall good enough" to pass
- Require per-package compliance

**In Code Review:**
- Check coverage report for new code
- Ensure new packages meet thresholds
- Don't merge if coverage drops

## Common Pitfalls

### ❌ Pitfall 1: "Overall coverage is good"

```
Developer: "We have 85% overall coverage, we're good!"
Reality: Engine package has 45% coverage - critical bugs lurking
```

**Solution:** Check EVERY package, not just overall.

### ❌ Pitfall 2: "DTOs inflate our numbers"

```
Coverage Report:
- DTOs: 100% (50 lines)
- Engine: 60% (500 lines)
Overall: 85% ✅ (but engine is undertested!)
```

**Solution:** Enforce per-package thresholds.

### ❌ Pitfall 3: "We'll fix it later"

```
Developer: "Let's ship now, improve coverage later"
Reality: Later never comes, bugs accumulate
```

**Solution:** Meet thresholds BEFORE moving forward.

### ❌ Pitfall 4: "Tests are too hard to write"

```
Developer: "This package is hard to test, can we skip it?"
Reality: Hard to test = poorly designed or most critical
```

**Solution:** Make code testable, write the tests.

## Benefits of Per-Package Coverage

### ✅ Benefit 1: Find Real Gaps

Per-package coverage reveals:
- Which packages are undertested
- Where bugs are likely to hide
- What needs immediate attention

### ✅ Benefit 2: Prevent False Confidence

Overall coverage can be misleading:
- High overall doesn't mean all code is tested
- Critical packages could be undertested
- Per-package prevents this illusion

### ✅ Benefit 3: Maintain Quality Standards

Each package must meet the bar:
- No free rides from other packages
- Consistent quality across codebase
- Every package is production-ready

### ✅ Benefit 4: Guide Testing Effort

Coverage reports show:
- Where to focus testing effort
- Which packages need more tests
- Progress toward quality goals

## Implementation Checklist

When starting a new project or improving existing coverage:

- [ ] Define per-package coverage thresholds
- [ ] Configure coverage tools to enforce per-package
- [ ] Generate initial coverage report
- [ ] Identify packages below threshold
- [ ] Write tests to bring each package to threshold
- [ ] Verify all packages meet requirements
- [ ] Configure CI/CD to enforce per-package
- [ ] Document thresholds in project README
- [ ] Review coverage in every code review
- [ ] Never merge code that drops package coverage

## Monitoring and Reporting

### Regular Coverage Reviews

**Weekly:**
- Check coverage report for all packages
- Identify any packages that dropped
- Plan testing effort for next sprint

**Per Pull Request:**
- Verify new code meets thresholds
- Check that no package coverage dropped
- Require tests for all new code

**Per Release:**
- Generate comprehensive coverage report
- Verify all packages meet thresholds
- Document coverage in release notes

### Coverage Trends

Track coverage over time:
- Overall coverage trend
- Per-package coverage trend
- Identify improving/declining packages
- Celebrate coverage improvements

## Summary

**Key Principles:**
1. **Per-package coverage is mandatory** - overall is not enough
2. **Every package must meet thresholds** - no exceptions
3. **Configure tools to enforce** - automation prevents regression
4. **Review coverage regularly** - make it part of workflow
5. **Fix gaps immediately** - don't defer to "later"

**Remember:** Untested code is a liability. Per-package coverage ensures every part of your codebase is tested and reliable.

---

**This project requires:**
- Backend: 80% line, 75% branch per package
- Frontend: 80% statement, 75% branch per directory
- No package/directory below threshold
- Enforcement in CI/CD
- Regular monitoring and review
