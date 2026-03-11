# Tutorial System - Complete Design Specification

## Overview

This document specifies the complete design for the Nine Men's Morris interactive tutorial system. The tutorial must teach ALL game phases through hands-on practice while preventing players from deviating from the learning path.

## Critical Requirements

### 1. Input Control
- **Board input MUST be disabled by default during tutorial**
- **Only specific positions are clickable for each interactive step**
- **All other positions must be completely non-interactive**
- **Players cannot make moves outside the tutorial script**

### 2. Complete Coverage
- **MUST teach Placement Phase with hands-on practice**
- **MUST teach Movement Phase with hands-on practice**
- **MUST teach Flying Phase with hands-on practice**
- **MUST teach Mill formation and piece removal**
- **MUST teach win conditions**

### 3. Robustness
- **Tutorial must handle any player action gracefully**
- **Tutorial must not break if player clicks wrong positions**
- **Tutorial must provide clear feedback for incorrect actions**
- **Tutorial must be completable from start to finish**

### 4. Progressive Learning
- **Each step builds on previous knowledge**
- **Players practice what they just learned**
- **Complexity increases gradually**
- **No skipping ahead without completing current step**

## Tutorial Structure (15 Steps)

### Phase 1: Introduction (Steps 1-2)
**Goal**: Orient player to the game and board

#### Step 1: Welcome
- **Type**: Informational (no interaction)
- **Title**: "Welcome to Nine Men's Morris"
- **Content**: Game overview, objective, brief history
- **Board State**: Empty board
- **Input**: Disabled
- **Next**: Enabled

#### Step 2: Board Layout
- **Type**: Informational (no interaction)
- **Title**: "The Board"
- **Content**: Explain 24 positions, 3 squares, connecting lines
- **Board State**: Empty board
- **Highlights**: All 24 positions briefly, then outer square (0-7)
- **Input**: Disabled
- **Next**: Enabled

### Phase 2: Placement & Mills (Steps 3-8)
**Goal**: Teach piece placement, mill formation, and piece removal

#### Step 3: First Placement
- **Type**: Interactive (required action)
- **Title**: "Placing Your First Piece"
- **Content**: "You are WHITE. Click position 0 (top-left corner) to place your first piece."
- **Board State**: Empty
- **Highlights**: Position 0 only
- **Allowed Actions**: Place at position 0 ONLY
- **Validation**: Must place at position 0
- **On Success**: 
  - Place white piece at 0
  - Simulate black piece at 8
  - Auto-advance to step 4
- **On Error**: "Please click the highlighted position (top-left corner)"
- **Input**: Only position 0 clickable
- **Next**: Disabled

#### Step 4: Second Placement
- **Type**: Interactive (required action)
- **Title**: "Continue Placing"
- **Content**: "Players alternate turns. Black placed at position 8. Now place your piece at position 1 (top middle)."
- **Board State**: White at 0, Black at 8
- **Highlights**: Position 1 only
- **Allowed Actions**: Place at position 1 ONLY
- **Validation**: Must place at position 1
- **On Success**:
  - Place white piece at 1
  - Simulate black piece at 9
  - Auto-advance to step 5
- **On Error**: "Please click the highlighted position (top middle)"
- **Input**: Only position 1 clickable
- **Next**: Disabled

#### Step 5: Forming a Mill
- **Type**: Interactive (required action)
- **Title**: "Forming a Mill"
- **Content**: "A 'mill' is 3 pieces in a row. Complete the top row by placing at position 2."
- **Board State**: White at 0,1; Black at 8,9
- **Highlights**: Positions 0, 1, 2 (show the mill pattern)
- **Allowed Actions**: Place at position 2 ONLY
- **Validation**: Must place at position 2
- **On Success**:
  - Place white piece at 2
  - Show mill animation (0-1-2)
  - Auto-advance to step 6
- **On Error**: "Place your piece at position 2 to complete the mill"
- **Input**: Only position 2 clickable
- **Next**: Disabled

#### Step 6: Removing Opponent Piece
- **Type**: Interactive (required action)
- **Title**: "Removing Opponent Pieces"
- **Content**: "You formed a mill! Now remove one black piece. Click on position 8 or 9."
- **Board State**: White at 0,1,2 (mill); Black at 8,9
- **Highlights**: Positions 8 and 9 (removable pieces)
- **Allowed Actions**: Remove piece at 8 OR 9
- **Validation**: Must click position 8 or 9
- **On Success**:
  - Remove selected black piece
  - Auto-advance to step 7
- **On Error**: "Click on one of the highlighted black pieces to remove it"
- **Input**: Only positions 8 and 9 clickable
- **Next**: Disabled

#### Step 7: Placement Practice
- **Type**: Interactive (required action)
- **Title**: "Placement Practice"
- **Content**: "Let's practice placing a few more pieces. Place at position 7 (left middle of outer square)."
- **Board State**: White at 0,1,2; Black at 8 or 9 (one removed)
- **Highlights**: Position 7
- **Allowed Actions**: Place at position 7 ONLY
- **Validation**: Must place at position 7
- **On Success**:
  - Place white piece at 7
  - Simulate black piece at 15
  - Auto-advance to step 8
- **On Error**: "Place your piece at the highlighted position"
- **Input**: Only position 7 clickable
- **Next**: Disabled

#### Step 8: Complete Placement Phase
- **Type**: Informational
- **Title**: "Placement Phase Complete"
- **Content**: "Great! In a real game, you'd place all 9 pieces. Now let's learn about moving pieces."
- **Board State**: Current state from step 7
- **Action**: Reset board to pre-configured movement phase scenario
- **Input**: Disabled
- **Next**: Enabled

### Phase 3: Movement (Steps 9-11)
**Goal**: Teach piece movement along adjacent positions

#### Step 9: Movement Phase Introduction
- **Type**: Informational
- **Title**: "Movement Phase"
- **Content**: "After all pieces are placed, you move them to adjacent empty positions along the lines."
- **Board State**: Pre-configured with pieces for movement practice
  - White at: 0, 1, 7, 16, 17
  - Black at: 8, 9, 15, 23
- **Highlights**: Show adjacency lines from position 0
- **Input**: Disabled
- **Next**: Enabled

#### Step 10: First Move
- **Type**: Interactive (required action)
- **Title**: "Moving a Piece"
- **Content**: "Click your piece at position 0, then click position 7 to move it there."
- **Board State**: Same as step 9
- **Highlights**: Position 0 (to select)
- **Allowed Actions**: 
  - First click: Select piece at position 0 ONLY
  - Second click: Move to position 7 ONLY (adjacent empty position)
- **Validation**: 
  - Must select position 0
  - Must move to adjacent empty position
- **On Success**:
  - Move piece from 0 to 7
  - Simulate black move (9 to 10)
  - Auto-advance to step 11
- **On Error**: 
  - If wrong piece selected: "Select the piece at the top-left corner (position 0)"
  - If wrong destination: "You can only move to adjacent empty positions"
- **Input**: Only position 0 clickable initially, then only valid adjacent positions
- **Next**: Disabled

#### Step 11: Movement Practice
- **Type**: Interactive (required action)
- **Title**: "Practice Moving"
- **Content**: "Now move your piece at position 1 to position 2."
- **Board State**: Updated from step 10
- **Highlights**: Position 1 (to select)
- **Allowed Actions**:
  - Select piece at position 1
  - Move to position 2
- **Validation**: Must complete the specified move
- **On Success**:
  - Move piece 1 to 2
  - Auto-advance to step 12
- **On Error**: "Select position 1, then move to position 2"
- **Input**: Only position 1 clickable, then only position 2
- **Next**: Disabled

### Phase 4: Flying (Steps 12-13)
**Goal**: Teach flying phase rules

#### Step 12: Flying Phase Introduction
- **Type**: Informational
- **Title**: "Flying Phase"
- **Content**: "When you have only 3 pieces left, you can move to ANY empty position, not just adjacent ones!"
- **Board State**: Reset to flying phase scenario
  - White at: 0, 8, 16 (exactly 3 pieces)
  - Black at: 4, 12, 20
- **Highlights**: Show all empty positions
- **Input**: Disabled
- **Next**: Enabled

#### Step 13: Flying Practice
- **Type**: Interactive (required action)
- **Title**: "Practice Flying"
- **Content**: "You have 3 pieces, so you can fly! Move your piece from position 0 to position 23 (not adjacent)."
- **Board State**: Same as step 12
- **Highlights**: Position 0 (to select)
- **Allowed Actions**:
  - Select piece at position 0
  - Move to position 23 (demonstrating flying)
- **Validation**: Must complete the flying move
- **On Success**:
  - Move piece 0 to 23
  - Auto-advance to step 14
- **On Error**: "Select position 0, then click position 23 to fly there"
- **Input**: Only position 0 clickable, then only position 23
- **Next**: Disabled

### Phase 5: Wrap-up (Steps 14-15)
**Goal**: Review win conditions and complete tutorial

#### Step 14: Win Conditions
- **Type**: Informational
- **Title**: "How to Win"
- **Content**: "You win by: 1) Reducing opponent to fewer than 3 pieces, OR 2) Blocking all their moves. Strategy: Form mills to remove pieces!"
- **Board State**: Current state
- **Input**: Disabled
- **Next**: Enabled

#### Step 15: Tutorial Complete
- **Type**: Completion
- **Title**: "Tutorial Complete!"
- **Content**: "Congratulations! You now know how to play Nine Men's Morris. Ready to practice against the AI?"
- **Board State**: Current state
- **Input**: Disabled
- **Next**: Shows "Finish" button
- **On Finish**: Return to main menu, offer practice game vs AI

## Technical Implementation Requirements

### 1. Input Control System

```typescript
interface InputControl {
  // Disable all board input
  disableAllInput(): void;
  
  // Enable only specific positions
  enablePositions(positions: number[]): void;
  
  // Check if position is currently enabled
  isPositionEnabled(position: number): boolean;
  
  // Get currently enabled positions
  getEnabledPositions(): number[];
}
```

### 2. Tutorial State Management

```typescript
interface TutorialState {
  currentStep: number;
  boardState: GameState;
  enabledPositions: number[];
  selectedPosition: number | null;
  awaitingAction: 'select' | 'move' | 'remove' | 'place' | null;
}
```

### 3. Step Execution Flow

```
1. Load step configuration
2. Update tutorial panel (title, instructions)
3. Set board state (may reset board)
4. Update highlights
5. Configure input control (enable specific positions)
6. If interactive step:
   - Disable Next button
   - Wait for player action
   - Validate action
   - Provide feedback
   - On success: execute action, auto-advance
   - On error: show error message, allow retry
7. If informational step:
   - Enable Next button
   - Wait for Next click
```

### 4. Board Renderer Integration

```typescript
interface BoardRendererTutorialAPI {
  // Set which positions are clickable
  setClickablePositions(positions: number[]): void;
  
  // Highlight specific positions
  highlightPositions(positions: number[], style: 'valid' | 'target' | 'info'): void;
  
  // Show adjacency lines from a position
  showAdjacencyLines(position: number): void;
  
  // Clear all highlights
  clearHighlights(): void;
}
```

### 5. Game Controller Integration

```typescript
interface GameControllerTutorialAPI {
  // Check if in tutorial mode
  isTutorialMode(): boolean;
  
  // Validate action with tutorial controller
  validateTutorialAction(action: TutorialAction): boolean;
  
  // Reset board to specific state
  setBoardState(state: GameState): void;
  
  // Disable/enable input
  setInputEnabled(enabled: boolean): void;
}
```

## Error Handling

### Invalid Actions
- **Wrong position clicked**: Show error message, highlight correct position
- **Wrong action type**: Show error message, explain expected action
- **Out of sequence**: Prevent action, show current step requirements

### Edge Cases
- **Rapid clicking**: Debounce input, ignore clicks during animations
- **Back navigation**: Restore previous board state, re-enable correct positions
- **Skip tutorial**: Confirm with user, clean up state, return to menu
- **Browser refresh**: Tutorial restarts from beginning (no persistence)

## Testing Requirements

### Unit Tests
- Each step configuration is valid
- Input control enables/disables correctly
- Action validation works for all steps
- State transitions are correct

### Integration Tests
- Complete tutorial flow from start to finish
- Back/forward navigation works
- Skip functionality works
- Error messages display correctly

### E2E Tests
- Tutorial can be completed successfully
- All interactive steps work
- Board state updates correctly
- Highlights appear and disappear correctly

## Success Criteria

A player who completes the tutorial should:
1. ✅ Understand how to place pieces
2. ✅ Know how to form mills
3. ✅ Know how to remove opponent pieces
4. ✅ Understand how to move pieces
5. ✅ Understand flying phase rules
6. ✅ Know the win conditions
7. ✅ Be ready to play a real game

## Implementation Phases

### Phase 1: Core Infrastructure
1. Implement input control system
2. Update BoardRenderer with clickable positions API
3. Update GameController with tutorial mode support
4. Create tutorial state management

### Phase 2: Step Implementation
1. Implement all 15 step configurations
2. Implement step execution logic
3. Implement action validation for each step
4. Implement board state management

### Phase 3: Polish & Testing
1. Add animations and transitions
2. Implement error messages
3. Write unit tests
4. Write integration tests
5. Write E2E tests
6. Manual testing and refinement

## Notes

- This design ensures the tutorial is **complete**, **robust**, and **educational**
- Players cannot deviate from the learning path
- Every game phase is taught through hands-on practice
- The tutorial can be completed successfully every time
- This specification must be followed exactly during implementation
