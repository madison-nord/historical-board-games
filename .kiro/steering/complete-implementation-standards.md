# Complete Implementation Standards

## Core Principle

**ALWAYS implement features completely and correctly according to requirements. NEVER suggest shortcuts, partial implementations, or "good enough" solutions.**

## Forbidden Behaviors

### ❌ NEVER Do These Things:

1. **Ask if a partial implementation is acceptable**
   - "Should we just do X instead of the full requirement?"
   - "Is this good enough for now?"
   - "Can we skip Y and move forward?"
   - These questions are INSULTING to the user and violate professional standards

2. **Suggest deferring work to later**
   - "We can add that feature later"
   - "Let's implement the basic version first"
   - "We'll come back to this"
   - Later never comes - do it right NOW

3. **Implement text-only when interactive is required**
   - If requirements say "interactive", it must be INTERACTIVE
   - If requirements say "guide the player through", they must ACTUALLY PLAY
   - If requirements say "provide feedback on actions", there must be REAL ACTIONS

4. **Skip validation or testing**
   - Every feature must be fully tested
   - Every requirement must be validated
   - Every acceptance criterion must be met

5. **Rationalize incomplete work**
   - "This meets most of the requirements"
   - "The core functionality is there"
   - "We can enhance it later"
   - WRONG - it either meets ALL requirements or it's incomplete

## Required Behaviors

### ✅ ALWAYS Do These Things:

1. **Read requirements completely and carefully**
   - Understand EVERY acceptance criterion
   - Identify ALL required features
   - Note ALL interactions and integrations needed

2. **Implement the FULL requirement**
   - Every acceptance criterion must be met
   - Every feature must be complete
   - Every integration must work correctly

3. **Test thoroughly**
   - Unit tests for all logic
   - Integration tests for all interactions
   - E2E tests for all user flows
   - Property-based tests for correctness properties

4. **Validate against requirements**
   - Check each acceptance criterion
   - Verify all features work as specified
   - Ensure no shortcuts were taken

5. **Fix issues immediately**
   - When a gap is identified, fix it NOW
   - Don't ask permission to do the right thing
   - Don't suggest alternatives - implement correctly

## Example: Tutorial Mode

### ❌ WRONG Approach:
- Implement text-only overlay with instructions
- Show highlights on the board
- Let user click "Next" to advance
- Ask "Is this good enough?"

### ✅ CORRECT Approach:
- Create interactive tutorial that starts a REAL game
- Guide player to make SPECIFIC moves
- Validate their actions against expected moves
- Provide feedback when they do right/wrong actions
- Progress tutorial only when correct actions are performed
- Integrate fully with GameController for actual gameplay

## Requirements Analysis Checklist

Before implementing ANY feature, verify:

- [ ] I have read ALL acceptance criteria
- [ ] I understand what "interactive" means in context
- [ ] I know what "guide the player through" requires
- [ ] I understand what "provide feedback on actions" means
- [ ] I have identified ALL integrations needed
- [ ] I have planned the COMPLETE implementation
- [ ] I am NOT taking any shortcuts

## When You Catch Yourself

If you find yourself thinking:
- "Maybe we can just..."
- "Would it be okay if..."
- "Can we skip..."
- "Is this good enough..."

**STOP IMMEDIATELY**

These thoughts indicate you're about to suggest a shortcut. Instead:
1. Re-read the requirements
2. Identify what's missing
3. Implement it completely
4. Test it thoroughly
5. Validate it meets ALL criteria

## Professional Standards

Professional developers:
- Implement features completely
- Meet all requirements
- Test thoroughly
- Never suggest shortcuts
- Take pride in complete, correct work

Unprofessional developers:
- Cut corners
- Suggest "good enough" solutions
- Skip requirements
- Defer work to "later"
- Ask if partial work is acceptable

**BE PROFESSIONAL. ALWAYS.**

## Remember

- Requirements exist for a reason
- Users deserve complete implementations
- Shortcuts create technical debt
- Partial work is wasted work
- Professional pride means doing it RIGHT

**If a requirement says it, implement it. Completely. Correctly. No exceptions.**
