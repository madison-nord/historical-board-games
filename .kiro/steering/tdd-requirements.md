---
title: Test-Driven Development Requirements
inclusion: always
---

# Test-Driven Development Requirements

## Mandatory Testing Standards

**ALL test tasks are MANDATORY and MUST be completed before marking any task as done.**

### Critical Rules

1. **NEVER mark test tasks as completed without implementing the actual tests**
2. **NEVER delete test files to avoid compilation issues**
3. **NEVER skip or bypass test requirements**
4. **ALL property-based tests MUST run with 100+ iterations and pass**
5. **ALL unit tests MUST be implemented and pass**
6. **MARKING TEST TASKS AS COMPLETE WITHOUT TESTS IS STRICTLY FORBIDDEN**
7. **TEST TASKS ARE MANDATORY - NOT OPTIONAL**
8. **TESTS MUST ACTUALLY TEST THE SPECIFIED REQUIREMENTS**

### Test-First Development Process

1. **Write tests FIRST** before or alongside implementation
2. **Tests must FAIL initially** (red phase)
3. **Implement code to make tests PASS** (green phase)
4. **Refactor while keeping tests passing** (refactor phase)

### Property-Based Testing Requirements

- Use jqwik for Java property-based testing
- Each property test MUST run minimum 100 iterations
- Property tests MUST validate the correctness properties defined in the design document
- Property tests MUST include proper generators for test data
- Property tests MUST have descriptive labels referencing design properties

### Test Quality Standards

- Tests MUST be comprehensive and cover edge cases
- Tests MUST have clear, descriptive names
- Tests MUST include proper assertions with meaningful error messages
- Tests MUST be maintainable and readable
- Tests MUST validate the actual requirements, not just implementation details

### Enforcement

- **Any attempt to mark test tasks as complete without implementing tests is FORBIDDEN**
- **Any attempt to delete or bypass tests to avoid issues is FORBIDDEN**
- **All compilation issues with tests MUST be resolved properly**
- **Tests are not optional - they are a core requirement of the project**
- **Marking tasks as complete without proper test implementation violates TDD principles**
- **Every test task MUST have corresponding test code that validates the specified requirements**

### Test Implementation Verification

Before marking any test task as complete, verify:
1. **Test code exists** and compiles successfully
2. **Test runs** and passes with required iterations (100+ for property tests)
3. **Test validates** the specific requirements mentioned in the task
4. **Test has proper assertions** with meaningful error messages
5. **Test covers the intended scenarios** described in the task

### When Tests Fail to Compile

1. **Fix the compilation issues** - do not delete the tests
2. **Simplify the test approach** if needed, but keep the tests
3. **Ask for help** if stuck on test implementation
4. **Never skip tests** to move forward

## Consequences

Violating these TDD requirements undermines the entire project quality and is not acceptable. Tests are not just nice-to-have - they are essential for ensuring correctness and maintaining code quality.

## Lessons Learned - Common Test Implementation Pitfalls

### Architecture Awareness for Test Design

**CRITICAL**: Before writing property-based tests, understand the target class architecture:

1. **Check for Immutability**: Many well-designed classes (like GameState) are immutable
   - Immutable classes don't have setter methods
   - Tests must work with existing constructors and methods
   - Use `applyMove()` or similar methods to create test scenarios
   - Don't assume you can directly modify object state

2. **Understand the API**: Read the class implementation before writing tests
   - Check what public methods are available
   - Understand constructor parameters and overloads
   - Identify how to create different object states legally
   - Use `readCode` tool to examine class structure

3. **Test Design Patterns for Immutable Objects**:
   - Create test scenarios by applying sequences of operations
   - Use board manipulation for testing game engine logic
   - Work within the constraints of the existing API
   - Don't try to force mutable patterns on immutable designs

### Property Test Complexity Management

**AVOID**: Overly complex property tests that are hard to debug
- Keep test setup simple and focused
- Use clear, predictable test data when possible
- Avoid complex conditional logic in test setup
- Make assertions specific and meaningful

**PREFER**: Simple, focused property tests that validate one concept clearly
- Test the core property being validated
- Use straightforward test scenarios
- Include clear error messages that explain what failed
- Focus on the requirement being tested, not implementation details

### Test Compilation Strategy

**ALWAYS**: Compile and run tests immediately after writing them
- Don't write multiple tests before compiling
- Fix compilation issues before moving to the next test
- Verify tests actually run and pass with 100+ iterations
- Use `mvn test -Dtest=ClassName --quiet` for focused testing
- **Check imports**: When using new classes (List, Map, etc.), ensure imports are added
- **Common missing imports**: `java.util.List`, `java.util.Map`, `java.util.ArrayList`

### Test-First Mindset

**REMEMBER**: The goal is to validate requirements, not just make tests pass
- Tests should fail initially if the requirement isn't implemented
- Tests should pass when the requirement is correctly implemented
- Tests should be meaningful and catch real bugs
- Tests should be maintainable and understandable

This experience reinforced that **understanding the codebase architecture is essential before writing tests**. Taking time to read and understand the existing code prevents wasted effort and ensures tests are designed appropriately for the system.

### Constructor Overloading and Type Safety

**CRITICAL LESSON**: When working with overloaded constructors, always verify parameter types and order

**What Happened**: The Move class has two constructors:
- `Move(MoveType type, int to, PlayerColor player)` - Only for PLACE moves
- `Move(MoveType type, int from, int to, PlayerColor player)` - For MOVE and REMOVE moves

**The Error**: RuleEngine was calling `new Move(MoveType.REMOVE, position, player)` which used the 3-parameter constructor that's restricted to PLACE moves only.

**The Fix**: REMOVE moves need the 4-parameter constructor: `new Move(MoveType.REMOVE, -1, position, player)`

**Prevention Strategies**:
1. **Read constructor documentation carefully** - The Move class clearly documents which constructor is for which move type
2. **Understand the domain model** - REMOVE moves conceptually don't have a "from" position, but the constructor still requires it (use -1)
3. **Run integration tests early** - This error only appeared when the full game flow was tested, not in isolated unit tests
4. **Pay attention to IllegalArgumentException messages** - The error message "This constructor is only for PLACE moves" was very clear about the issue

**Key Takeaway**: Constructor overloading with business logic constraints requires careful attention to parameter types and validation rules. Always verify you're using the correct constructor variant for your use case.