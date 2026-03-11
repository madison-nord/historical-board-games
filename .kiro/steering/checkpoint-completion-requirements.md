# Checkpoint Task Completion Requirements

## Core Principle

**Checkpoint tasks MUST NOT be marked complete until ALL verification steps pass successfully.**

## What Constitutes a Checkpoint Task

Checkpoint tasks are identified by:
- Task name contains "Checkpoint"
- Task description includes "Test", "Verify", or "Ask the user if questions arise"
- Task represents a validation milestone between development phases

## Mandatory Completion Criteria

Before marking ANY checkpoint task as complete, you MUST:

### 1. Run ALL Automated Tests
- ✅ All unit tests must pass
- ✅ All integration tests must pass
- ✅ All property-based tests must pass
- ✅ All E2E tests must pass (if applicable)
- ✅ Backend tests must pass
- ✅ Frontend tests must pass

### 2. Fix ALL Test Failures
- **NEVER skip ahead when tests fail**
- **NEVER mark checkpoint complete with failing tests**
- **NEVER create manual testing checklists as a substitute for fixing automated tests**
- Analyze each failure systematically
- Fix the root cause (code or test)
- Re-run tests until all pass
- Document any issues found and fixed

### 3. Verify Implementation Completeness
- All features mentioned in checkpoint description are implemented
- All UI elements are functional
- All user interactions work correctly
- No placeholder or stub implementations remain

### 4. Create Additional Tests If Needed
- If checkpoint requirements aren't covered by existing tests, write new tests
- E2E tests for user-facing features
- Integration tests for component interactions
- Property-based tests for correctness properties

### 5. Manual Verification (Only After Automated Tests Pass)
- Manual testing is SUPPLEMENTARY, not a replacement
- Only perform manual testing after ALL automated tests pass
- Document manual test results
- Create automated tests for any issues found during manual testing

## Forbidden Behaviors

### ❌ NEVER Do These Things:

1. **Skip ahead to next task when tests fail**
   - This leaves broken code in the codebase
   - Creates technical debt
   - Violates TDD principles

2. **Mark checkpoint complete without running tests**
   - Checkpoints exist to validate quality
   - Skipping validation defeats the purpose

3. **Create manual testing checklists instead of fixing automated tests**
   - Automated tests are repeatable and reliable
   - Manual checklists don't prevent regressions
   - If tests fail, FIX THEM

4. **Assume tests will pass without running them**
   - Always verify
   - Tests catch integration issues
   - Compilation success ≠ tests passing

5. **Defer test fixes to "later"**
   - Fix issues immediately when found
   - Later never comes
   - Broken tests accumulate

## Correct Checkpoint Workflow

```
1. Review checkpoint requirements
   ↓
2. Run ALL automated tests
   ↓
3. Tests pass? 
   ├─ NO → Fix failures, go to step 2
   └─ YES → Continue
   ↓
4. Verify implementation completeness
   ↓
5. Complete? 
   ├─ NO → Implement missing features, go to step 2
   └─ YES → Continue
   ↓
6. Perform manual verification (if required)
   ↓
7. Issues found?
   ├─ YES → Fix issues, create automated tests, go to step 2
   └─ NO → Continue
   ↓
8. Document completion
   ↓
9. Mark checkpoint as complete
   ↓
10. Commit and push changes
```

## Test Failure Analysis Process

When tests fail:

1. **Read the error message carefully**
   - What assertion failed?
   - What was expected vs actual?
   - Which test file and line?

2. **Identify the root cause**
   - Is the implementation wrong?
   - Is the test wrong?
   - Is there a missing feature?
   - Is there an integration issue?

3. **Fix the root cause**
   - Update implementation if logic is wrong
   - Update test if expectations are wrong
   - Implement missing features
   - Fix integration issues

4. **Verify the fix**
   - Run the specific failing test
   - Run all related tests
   - Run the full test suite
   - Ensure no regressions

5. **Document the issue**
   - Add comments explaining the fix
   - Update steering docs if pattern emerges
   - Create test for similar scenarios

## E2E Test Failures

E2E test failures often indicate:
- Missing UI implementation
- Incorrect CSS selectors
- Timing issues (need proper waits)
- Missing DOM elements
- Incorrect event handling

**Fix approach:**
1. Check if UI element exists in implementation
2. Verify CSS classes match test selectors
3. Ensure proper rendering lifecycle
4. Add appropriate waits for async operations
5. Test in actual browser if needed

## Checkpoint Completion Checklist

Before marking checkpoint complete:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All property-based tests pass
- [ ] All E2E tests pass (if applicable)
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Build succeeds without errors
- [ ] No compilation warnings
- [ ] All features implemented
- [ ] No placeholder code remains
- [ ] Manual verification complete (if required)
- [ ] All issues documented
- [ ] Changes committed
- [ ] Changes pushed to repository

## Consequences of Skipping Ahead

Skipping ahead without completing checkpoints:
- Accumulates technical debt
- Creates unstable codebase
- Makes debugging harder later
- Violates professional standards
- Wastes time fixing issues later
- Reduces code quality
- Breaks continuous integration
- Undermines test-driven development

## Remember

**Quality over speed. Complete over quick. Correct over convenient.**

A checkpoint is not complete until ALL tests pass and ALL requirements are met.

No exceptions. No shortcuts. No skipping ahead.
