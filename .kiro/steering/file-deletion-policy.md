# File Deletion Policy

## Core Principle

**NEVER delete files without explicit user permission.**

## Forbidden Actions

### ❌ NEVER Do These Things:

1. **Delete files to "fix" issues**
   - Don't delete test files because they're failing
   - Don't delete implementation files to start over
   - Don't delete configuration files to reset state
   - Fix the issues instead of deleting files

2. **Delete files to recreate them**
   - Don't delete and recreate files as a "solution"
   - Edit files in place using proper tools (strReplace, editCode)
   - Preserve file history and git tracking

3. **Delete files without asking**
   - Always ask user permission before deleting ANY file
   - Explain why deletion might be needed
   - Wait for explicit approval
   - Offer alternatives to deletion

4. **Delete files as part of "cleanup"**
   - Don't delete "old" or "backup" files without permission
   - Don't delete files you think are unused
   - Don't delete files to "simplify" the codebase
   - Let the user decide what to keep

## Required Behaviors

### ✅ ALWAYS Do These Things:

1. **Fix files instead of deleting them**
   - Use strReplace to fix content
   - Use editCode for code changes
   - Use proper debugging to identify issues
   - Preserve existing work

2. **Ask permission before any deletion**
   - Clearly state which file(s) you want to delete
   - Explain the reason for deletion
   - Provide alternatives if possible
   - Wait for explicit "yes" or approval

3. **Use proper file editing tools**
   - strReplace for text changes
   - editCode for code modifications
   - fsWrite only for NEW files
   - Never delete to "reset" a file

4. **Respect user's work**
   - Files represent time and effort
   - Deletion is destructive and often unnecessary
   - Git can recover deleted files, but it's disruptive
   - Editing is almost always better than deleting

## When Deletion Might Be Appropriate

Deletion should ONLY be considered when:
- User explicitly requests file deletion
- File is a temporary test file created for debugging
- File is a duplicate created by mistake
- File is generated output that needs regeneration

Even in these cases, ASK FIRST.

## Examples

### ❌ WRONG:
```
"The test file has errors. I'll delete it and create a new one."
[Deletes file without asking]
```

### ✅ CORRECT:
```
"The test file has errors. I can fix them by:
1. Updating the mock setup
2. Fixing the assertion logic
3. Adding missing imports

Would you like me to fix these issues?"
```

### ❌ WRONG:
```
"I'll delete these old test files and write new comprehensive tests."
[Deletes files without permission]
```

### ✅ CORRECT:
```
"I see the test files have issues. Would you like me to:
1. Fix the existing tests, or
2. Delete them and write new tests?

If option 2, I'll need your permission to delete:
- TutorialController.test.ts
- TutorialController.property.test.ts"
```

## Recovery Process

If you accidentally deleted files:
1. Immediately stop and acknowledge the mistake
2. Use git to restore the files: `git checkout HEAD -- <filepath>`
3. Apologize to the user
4. Proceed with proper editing instead

## Remember

- Files are valuable - they represent work and history
- Deletion is destructive and often unnecessary
- Editing is almost always better than deleting
- Always ask permission before deleting ANYTHING
- When in doubt, DON'T delete

**If you're thinking about deleting a file, STOP and ask the user first.**
