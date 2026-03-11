# Tutorial System - Implementation Plan

## Reference
This implementation follows the complete design specification in `tutorial-system-design.md`.

## Implementation Order

### Phase 1: Core Infrastructure (Foundation)
**Goal**: Build the input control system and tutorial state management

#### 1.1 BoardRenderer Input Control
- [ ] Add `clickablePositions` property to BoardRenderer
- [ ] Add `setClickablePositions(positions: number[])` method
- [ ] Modify `handleCanvasClick()` to check if position is clickable
- [ ] Add visual feedback for non-clickable positions (cursor change)
- [ ] Test: Verify only specified positions are clickable

#### 1.2 GameController Tutorial Mode Support
- [ ] Add `isTutorialMode()` method
- [ ] Add `setBoardState(state: GameState)` method to reset board
- [ ] Modify input handling to respect tutorial mode
- [ ] Add method to get current board state for saving/restoring
- [ ] Test: Verify tutorial mode detection works

#### 1.3 TutorialController State Management
- [ ] Add `TutorialState` interface
- [ ] Add `enabledPositions` tracking
- [ ] Add `awaitingAction` state tracking
- [ ] Add `boardStateHistory` for back navigation
- [ ] Add methods to save/restore board state
- [ ] Test: Verify state management works correctly

### Phase 2: Step Configuration (Content)
**Goal**: Define all 15 tutorial steps with complete specifications

#### 2.1 Step Data Structure
- [ ] Update `TutorialStep` interface with new fields:
  - `type`: 'informational' | 'interactive'
  - `allowedPositions`: number[]
  - `expectedAction`: detailed action specification
  - `boardStateConfig`: pre-configured board state
  - `errorMessage`: custom error message
  - `successAction`: what happens on success
- [ ] Test: Verify step interface is complete

#### 2.2 Define All 15 Steps
- [ ] Step 1: Welcome (informational)
- [ ] Step 2: Board Layout (informational)
- [ ] Step 3: First Placement (interactive - place at 0)
- [ ] Step 4: Second Placement (interactive - place at 1)
- [ ] Step 5: Forming a Mill (interactive - place at 2)
- [ ] Step 6: Removing Piece (interactive - remove at 8 or 9)
- [ ] Step 7: Placement Practice (interactive - place at 7)
- [ ] Step 8: Placement Complete (informational + board reset)
- [ ] Step 9: Movement Intro (informational)
- [ ] Step 10: First Move (interactive - move 0 to 7)
- [ ] Step 11: Movement Practice (interactive - move 1 to 2)
- [ ] Step 12: Flying Intro (informational + board reset)
- [ ] Step 13: Flying Practice (interactive - fly 0 to 23)
- [ ] Step 14: Win Conditions (informational)
- [ ] Step 15: Complete (completion)
- [ ] Test: Verify all step configurations are valid

### Phase 3: Input Control Integration (Enforcement)
**Goal**: Ensure players can only perform allowed actions

#### 3.1 Position Filtering
- [ ] Implement `enablePositions()` in TutorialController
- [ ] Call `boardRenderer.setClickablePositions()` on step change
- [ ] Disable all positions by default for interactive steps
- [ ] Enable only specified positions for current step
- [ ] Test: Verify position filtering works

#### 3.2 Action Validation
- [ ] Implement comprehensive `validateAction()` method
- [ ] Check action type matches expected action
- [ ] Check position matches allowed positions
- [ ] Handle multi-step actions (select then move)
- [ ] Provide specific error messages for each failure type
- [ ] Test: Verify validation catches all invalid actions

#### 3.3 Error Feedback
- [ ] Show error message in tutorial panel
- [ ] Keep highlights on correct positions
- [ ] Don't advance step on error
- [ ] Allow player to retry immediately
- [ ] Test: Verify error feedback is clear

### Phase 4: Step Execution Logic (Flow)
**Goal**: Implement the complete step execution flow

#### 4.1 Step Initialization
- [ ] Load step configuration
- [ ] Update tutorial panel (title, instructions)
- [ ] Set board state (may reset board completely)
- [ ] Update highlights based on step type
- [ ] Configure input control (enable/disable positions)
- [ ] Set Next button state (enabled/disabled)
- [ ] Test: Verify step initialization works

#### 4.2 Interactive Step Handling
- [ ] Disable Next button for interactive steps
- [ ] Wait for player action
- [ ] Validate action against step requirements
- [ ] On success:
  - Execute the action (place/move/remove piece)
  - Show success feedback
  - Simulate opponent move if needed
  - Auto-advance to next step after delay
- [ ] On error:
  - Show error message
  - Keep step active
  - Allow retry
- [ ] Test: Verify interactive steps work correctly

#### 4.3 Informational Step Handling
- [ ] Enable Next button
- [ ] Disable board input
- [ ] Show highlights (if any)
- [ ] Wait for Next button click
- [ ] Advance to next step
- [ ] Test: Verify informational steps work

#### 4.4 Board State Management
- [ ] Implement board state reset for steps 8 and 12
- [ ] Pre-configure board states:
  - Movement phase: White at 0,1,7,16,17; Black at 8,9,15,23
  - Flying phase: White at 0,8,16; Black at 4,12,20
- [ ] Save board state before each step (for back navigation)
- [ ] Restore board state on back navigation
- [ ] Test: Verify board state management works

### Phase 5: Opponent Simulation (Realism)
**Goal**: Simulate opponent moves to create realistic scenarios

#### 5.1 Opponent Move Logic
- [ ] Define opponent moves for each interactive step:
  - Step 3: Black places at 8
  - Step 4: Black places at 9
  - Step 7: Black places at 15
  - Step 10: Black moves 9 to 10
- [ ] Implement `simulateOpponentMove()` method
- [ ] Temporarily disable tutorial validation during opponent move
- [ ] Apply opponent move to board
- [ ] Re-enable tutorial validation
- [ ] Test: Verify opponent moves work correctly

#### 5.2 Timing and Animation
- [ ] Add delay before opponent move (400ms)
- [ ] Show opponent move animation
- [ ] Add delay before auto-advancing (800ms total)
- [ ] Ensure smooth transitions
- [ ] Test: Verify timing feels natural

### Phase 6: Navigation Controls (UX)
**Goal**: Implement back/forward/skip navigation

#### 6.1 Back Navigation
- [ ] Restore previous board state
- [ ] Restore previous step configuration
- [ ] Re-enable correct positions
- [ ] Update tutorial panel
- [ ] Disable back button on step 1
- [ ] Test: Verify back navigation works

#### 6.2 Skip Functionality
- [ ] Show confirmation dialog (optional)
- [ ] Clean up tutorial state
- [ ] Return to main menu
- [ ] Call completion callback
- [ ] Test: Verify skip works correctly

#### 6.3 Progress Indicator
- [ ] Update "Step X of 15" display
- [ ] Update button text ("Next" vs "Finish")
- [ ] Show completion message on final step
- [ ] Test: Verify progress indicator is accurate

### Phase 7: Testing (Quality Assurance)
**Goal**: Ensure tutorial works perfectly

#### 7.1 Unit Tests
- [ ] Test each step configuration
- [ ] Test input control system
- [ ] Test action validation
- [ ] Test state management
- [ ] Test opponent simulation
- [ ] Test navigation controls
- [ ] All unit tests must pass

#### 7.2 Integration Tests
- [ ] Test complete tutorial flow (steps 1-15)
- [ ] Test back navigation at various points
- [ ] Test skip functionality
- [ ] Test error handling
- [ ] Test board state resets
- [ ] All integration tests must pass

#### 7.3 E2E Tests
- [ ] Test tutorial completion in browser
- [ ] Test interactive steps work
- [ ] Test error messages display
- [ ] Test highlights appear correctly
- [ ] Test responsive design
- [ ] All E2E tests must pass

#### 7.4 Manual Testing
- [ ] Complete tutorial from start to finish
- [ ] Try clicking wrong positions (should be blocked)
- [ ] Test back navigation
- [ ] Test skip functionality
- [ ] Test on different screen sizes
- [ ] Document any issues found

### Phase 8: Polish and Refinement (Excellence)
**Goal**: Make the tutorial feel professional and polished

#### 8.1 Visual Polish
- [ ] Smooth animations for all transitions
- [ ] Clear visual feedback for clickable positions
- [ ] Attractive highlight styles
- [ ] Consistent spacing and typography
- [ ] Test: Verify visual quality

#### 8.2 Error Messages
- [ ] Clear, helpful error messages for each scenario
- [ ] Friendly tone
- [ ] Specific guidance on what to do
- [ ] Test: Verify messages are helpful

#### 8.3 Performance
- [ ] No lag or stuttering
- [ ] Smooth animations
- [ ] Responsive input
- [ ] Test: Verify performance is good

## Implementation Rules

### MUST DO
1. ✅ Implement phases in order (1 → 8)
2. ✅ Complete each phase before moving to next
3. ✅ Test each component as it's built
4. ✅ Follow the design specification exactly
5. ✅ Disable input by default, enable only what's needed
6. ✅ Implement all 15 steps completely
7. ✅ Handle all error cases gracefully
8. ✅ Make tutorial completable from start to finish

### MUST NOT DO
1. ❌ Skip phases or steps
2. ❌ Implement partial functionality
3. ❌ Leave input uncontrolled
4. ❌ Skip any of the 15 steps
5. ❌ Allow players to deviate from script
6. ❌ Leave error cases unhandled
7. ❌ Mark complete until all tests pass

## Success Criteria

The tutorial implementation is complete when:
- [ ] All 15 steps are implemented
- [ ] Input control works perfectly (only allowed positions clickable)
- [ ] All interactive steps require correct actions
- [ ] All informational steps work correctly
- [ ] Board state resets work for movement and flying phases
- [ ] Opponent moves are simulated correctly
- [ ] Back/forward/skip navigation works
- [ ] All error cases are handled
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Manual testing confirms everything works
- [ ] Tutorial can be completed successfully every time
- [ ] Players cannot break the tutorial by clicking wrong positions

## Estimated Effort

- Phase 1: 2-3 hours (foundation)
- Phase 2: 1-2 hours (content)
- Phase 3: 2-3 hours (enforcement)
- Phase 4: 3-4 hours (flow)
- Phase 5: 1-2 hours (simulation)
- Phase 6: 1-2 hours (navigation)
- Phase 7: 2-3 hours (testing)
- Phase 8: 1-2 hours (polish)

**Total: 13-21 hours of focused work**

This is a significant implementation, but it will result in a professional, complete tutorial that actually teaches the game properly.

## Next Steps

1. Review this plan with the user
2. Get approval to proceed
3. Start with Phase 1: Core Infrastructure
4. Work through each phase systematically
5. Test thoroughly at each stage
6. Don't skip ahead or take shortcuts
