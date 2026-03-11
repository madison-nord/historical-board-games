# New File Linting Standards

## Core Principle

**All newly created files MUST have zero linting errors before being committed to version control.**

## Mandatory Requirements

### 1. Zero Linting Errors for New Files

When creating ANY new file (Java, TypeScript, configuration, etc.), you MUST:

- ✅ Run diagnostics on the new file immediately after creation
- ✅ Fix ALL linting errors before proceeding
- ✅ Fix ALL linting warnings before proceeding
- ✅ Verify zero diagnostics with `getDiagnostics` tool
- ✅ Only commit files with clean diagnostics

### 2. Acceptable Exceptions

Linting errors are ONLY acceptable in new files when:

- **Missing implementation from future tasks**: The error is caused by referencing a class, method, or feature that belongs to a future task and hasn't been implemented yet
- **Intentional placeholder**: The file is a deliberate stub/placeholder with TODO comments indicating future implementation
- **External dependency issue**: The error is caused by a third-party library issue beyond our control

In these cases:
- Document the exception with a clear comment explaining why
- Reference the future task number that will resolve it
- Add a TODO or FIXME comment
- Inform the user about the temporary exception

### 3. Common Linting Issues to Fix

#### Java Files
- Missing imports
- Unused imports (remove them)
- Missing `@NonNull` annotations on method parameters
- Unused variables or parameters (use `@SuppressWarnings("unused")` with justification comment)
- Null safety warnings (add proper annotations or suppressions)
- Missing JavaDoc for public methods (add comprehensive documentation)

#### TypeScript Files
- Unused imports (remove them)
- Unused variables (prefix with `_` or remove)
- Missing type annotations
- `any` types (use proper types)
- Console statements in production code (use proper logging)

#### Test Files
- Unused `setUp` methods: Add `@SuppressWarnings("unused") // Used by JUnit framework`
- Null safety warnings on mocks: Add `@SuppressWarnings("null") // Mock objects are non-null in test context`
- Unused test helper methods: Either use them or remove them

### 4. Verification Process

Before committing new files:

```
1. Create the new file(s)
   ↓
2. Run getDiagnostics on each new file
   ↓
3. Any errors or warnings?
   ├─ YES → Fix them immediately
   └─ NO → Continue
   ↓
4. Run getDiagnostics again to verify
   ↓
5. Still clean?
   ├─ YES → Ready to commit
   └─ NO → Go back to step 3
   ↓
6. Run full test suite to ensure no regressions
   ↓
7. Commit with clean files
```

### 5. Old Files vs New Files

**Different standards apply:**

- **Old/Existing Files**: May have linting errors that will be cleaned up in a dedicated cleanup task later
- **New Files**: MUST be created clean from the start - no exceptions (except those listed in section 2)

**Rationale**: 
- It's easier to maintain quality by keeping new code clean
- Old code cleanup can be done systematically in batches
- New code sets the standard for future development
- Clean new files prevent technical debt accumulation

### 6. Linting Tools by Language

#### Java
- Use `getDiagnostics` tool to check for errors
- Pay attention to Eclipse/IntelliJ warnings
- Use Maven compiler warnings: `mvn compile`
- Check for null safety issues
- Verify proper annotations

#### TypeScript
- Use ESLint: `npm run lint`
- Use Prettier: `npm run format:check`
- Use TypeScript compiler: `npm run type-check`
- Fix all three before committing

### 7. Suppression Guidelines

When using `@SuppressWarnings` or similar:

- **Always add a comment** explaining WHY the warning is suppressed
- **Be specific**: Use specific warning types, not blanket suppressions
- **Minimize scope**: Apply to smallest scope possible (method, not class)
- **Review regularly**: Suppressions should be temporary when possible

**Good examples:**
```java
@SuppressWarnings("unused") // Used by JUnit framework
void setUp() { ... }

@SuppressWarnings("null") // Mock objects are non-null in test context
void testMethod() { ... }
```

**Bad examples:**
```java
@SuppressWarnings("all") // Too broad, hides real issues
void someMethod() { ... }

@SuppressWarnings("unused") // No explanation
void helper() { ... }
```

### 8. Pre-Commit Checklist

Before committing ANY new files:

- [ ] All new files have zero diagnostics (verified with `getDiagnostics`)
- [ ] All imports are used and necessary
- [ ] All variables are used or properly suppressed
- [ ] All public methods have documentation
- [ ] All null safety issues are addressed
- [ ] All type safety issues are resolved
- [ ] Full test suite passes
- [ ] Build succeeds without warnings
- [ ] Code follows project conventions

### 9. Enforcement

**This is a MANDATORY standard, not a suggestion.**

- Reviewers should reject commits with linting errors in new files
- CI/CD should fail on linting errors in new files
- Developers should run diagnostics before requesting review
- No exceptions without explicit justification and documentation

### 10. Benefits

Following this standard ensures:

- ✅ High code quality from the start
- ✅ Easier code reviews (no noise from linting issues)
- ✅ Better maintainability
- ✅ Consistent code style
- ✅ Fewer bugs (many linting errors indicate real issues)
- ✅ Professional codebase
- ✅ Reduced technical debt

## Remember

**Clean code is professional code. New files should be exemplary, not problematic.**

If you're creating a new file and it has linting errors, fix them immediately. Don't commit broken code. Don't defer cleanup. Do it right the first time.

**Quality is not negotiable.**
