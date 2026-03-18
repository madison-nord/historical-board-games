# Post-Task 34 Bugfixes Design

## Overview

Six bugs were discovered during manual testing after Task 34 completion, spanning online multiplayer, local two-player, and single-player modes. The bugs affect InfoPanel layout, ChatPanel overflow, game result display, piece removal highlighting, game-over navigation, and AI functionality. This design formalizes the bug conditions, root causes, and targeted fixes for each bug while preserving all existing correct behavior.

## Glossary

- **Bug_Condition (C)**: The set of conditions under which one of the six bugs manifests — e.g., online game start with empty InfoPanel, ChatPanel overflow, raw concatenated result message, missing removal highlights, no main menu after local game-over, or AI freeze.
- **Property (P)**: The desired correct behavior when the bug condition holds — e.g., InfoPanel shows initial content, ChatPanel fits within bounds, result dialog shows "You Won!"/"You Lost!", removal highlights are visible, game-over dialog appears, AI recovers from failure.
- **Preservation**: Existing behaviors that must remain unchanged — e.g., InfoPanel updates during gameplay, ChatPanel collapse/mute, local two-player color-based messages, online mill highlighting, single-player input handling.
- **InfoPanel**: The `InfoPanel` class in `frontend/src/controllers/InfoPanel.ts` that displays game state adjacent to the canvas.
- **ChatPanel**: The `ChatPanel` class in `frontend/src/controllers/ChatPanel.ts` that provides in-game chat during online multiplayer.
- **UIManager**: The `UIManager` class in `frontend/src/controllers/UIManager.ts` that manages all dialog interactions.
- **GameController**: The `GameController` class in `frontend/src/controllers/GameController.ts` that orchestrates game logic and user interactions.
- **deriveGameEndMessage**: Pure function in `InfoPanel.ts` that produces mode-aware game-end messages ("You Won!"/"You Lost!" for online/single-player, "White/Black Wins!" for local two-player).

## Bug Details

### Bug Condition

The six bugs manifest under distinct conditions across three game modes. Together they cover: (1) online game initialization, (2) online ChatPanel layout, (3) online game-end display, (4) local two-player mill removal highlighting, (5) local two-player game-over navigation, and (6) single-player AI failure recovery.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type GameEvent
  OUTPUT: boolean

  // Bug 1: InfoPanel empty/resizing on online game start
  IF input.event == "ONLINE_GAME_START"
     AND infoPanelHasNoContent()
     AND infoPanelHasNoFixedDimensions()
     RETURN true

  // Bug 2: ChatPanel overflow/growth
  IF input.event == "CHAT_PANEL_DISPLAYED"
     AND (sendButtonOverflows() OR panelGrowsWithMessages())
     RETURN true

  // Bug 3: Online game-end shows raw concatenated message
  IF input.event == "ONLINE_GAME_END"
     AND resultDialogShowsConcatenatedMessage()
     RETURN true

  // Bug 4: No removal highlighting in local two-player
  IF input.event == "MILL_FORMED"
     AND input.gameMode == LOCAL_TWO_PLAYER
     AND removableHighlightsNotVisible()
     RETURN true

  // Bug 5: No main menu after local two-player game-over
  IF input.event == "GAME_OVER"
     AND input.gameMode == LOCAL_TWO_PLAYER
     AND noResultDialogShown()
     RETURN true

  // Bug 6: AI does nothing after first move
  IF input.event == "AI_MOVE_REQUESTED"
     AND input.gameMode == SINGLE_PLAYER
     AND aiMoveFailsAndNoRecovery()
     RETURN true

  RETURN false
END FUNCTION
```

### Examples

- **Bug 1**: User starts an online multiplayer game. The InfoPanel appears as a tiny empty box. After the first move, it suddenly expands to show content, causing layout shift.
- **Bug 2**: User opens the ChatPanel in online mode. The "Send" button is partially outside the panel boundary. After sending 10 messages, the panel has grown taller than its container.
- **Bug 3**: User wins an online game. The result dialog shows "Black Wins!Black player has won the game!" instead of "You Won!".
- **Bug 4**: User forms a mill in local two-player mode. No green highlights appear on opponent pieces. The user doesn't know which pieces can be removed.
- **Bug 5**: A local two-player game ends. Only the announcement banner appears. There is no dialog with "New Game" or "Main Menu" buttons. The user is stuck.
- **Bug 6**: User plays as White in single-player mode, places a piece. The AI (Black) never responds. The game is frozen with input disabled.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- InfoPanel continues to display correct turn, phase, piece counts, and action instructions during gameplay in all modes
- InfoPanel functions correctly in tutorial mode with tutorial-specific content
- ChatPanel collapse/mute functionality continues to track unread messages and show notification badges
- ChatPanel auto-scrolls to latest message when expanded
- Local two-player game-end continues to show color-based messages ("White Wins!" / "Black Wins!")
- Tutorial mode game completion continues through the tutorial flow without showing the result dialog
- Online multiplayer mill formation continues to highlight removable pieces correctly
- Single-player mill formation continues to highlight removable pieces correctly
- When all opponent pieces are in mills, any opponent piece can still be removed
- Online multiplayer game-end continues to show "Play Again" (rematch) alongside "New Game" and "Main Menu"
- Single-player game-end continues to show the announcement banner
- AI successfully computed moves continue to be applied correctly
- Player input continues to work normally during the player's turn in single-player mode

**Scope:**
All inputs that do NOT involve the six bug conditions should be completely unaffected by these fixes. This includes:
- Normal gameplay moves (placement, movement, flying) in all modes
- Tutorial mode interactions
- Game state persistence (save/load)
- WebSocket communication for non-game-end messages
- Board rendering and animations

## Hypothesized Root Cause

Based on code analysis, the root causes are:

1. **Bug 1 — InfoPanel Empty/Resizing**: In `onlineMultiplayer.ts`, after `gc.setBoardState(...)` is called, no explicit `infoPanel.update(...)` call is made. The InfoPanel only gets updated inside `GameController.updateDisplay()` during the render loop, but the initial `setBoardState` call triggers `updateDisplay` before the InfoPanel is wired up via `setInfoPanel`. Additionally, `.info-panel` in `main.css` has no fixed `width` or `min-height`, so it collapses when empty and resizes on content change.

2. **Bug 2 — ChatPanel Overflow/Growth**: The `.chat-send-button` has `min-width: 60px` which, combined with the flex input, can exceed the narrow grid column width (`minmax(200px, 280px)`). The `.chat-panel` uses `max-height: 500px` but no fixed `height`, and the `.chat-messages` container lacks `overflow: hidden` on the parent to constrain growth.

3. **Bug 3 — Online Win/Lose Display**: `UIManager.showGameResult(winner, isOnlineGame)` constructs its own title as "White Wins!" or "Black Wins!" and message as "[Color] player has won the game!" without using `deriveGameEndMessage()`. In online mode, the caller passes `winner` (a `PlayerColor`) but the dialog doesn't know the local player's color, so it can't produce "You Won!" / "You Lost!".

4. **Bug 4 — No Removal Highlighting**: In `handleMillFormed()`, `boardRenderer.highlightValidMoves(removablePieces)` is called, but the game loop's `render()` method calls `drawBoard()` → `drawHighlights()` → `drawPieces()` each frame. The highlights are set, but the render cycle may clear and redraw them before the user sees them. The issue is likely that `clearHighlights()` is called somewhere in the flow between `handleMillFormed()` and the next render frame — specifically in `switchPlayer()` which calls `clearSelection()` which calls `boardRenderer.clearHighlights()`. For PLACE moves, `applyMove` calls `handleMillFormed()` (which sets highlights), then the code path continues and may call `switchPlayer()` or `clearSelection()` before the next render.

5. **Bug 5 — No Main Menu After Game Over**: `endGame()` in `GameController.ts` only shows an `AnnouncementBanner` overlay with `duration: 0` (persistent). It never calls `UIManager.showGameResult()` because `GameController` has no reference to `UIManager`. In online mode, `onlineMultiplayer.ts` wires up `onGameEnd` and `onGameOverFromStateUpdate` callbacks that call `ui.showGameResult()`, but for local/single-player modes, no such wiring exists.

6. **Bug 6 — AI Broken**: `getAIMoveFromBackend()` makes a `fetch` to `/api/game/ai-move`. If the backend endpoint doesn't exist or returns an error, the catch block logs the error and returns `null`. In `handleAIMove()`, when `aiMove` is `null`, it logs "Failed to get AI move" but takes no recovery action. The `finally` block sets `isAiThinking = false` and re-enables input if it's the player's turn, but since it's the AI's turn, input stays disabled. The game is stuck.

## Correctness Properties

Property 1: Bug Condition — InfoPanel Shows Initial Content on Online Game Start

_For any_ online multiplayer game start event, the InfoPanel SHALL display initial game information (current turn, phase, player color, action instruction) immediately after the game state is initialized, without requiring a move to be made first, and SHALL maintain consistent dimensions that do not shift between updates.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition — ChatPanel Elements Fit Within Boundaries

_For any_ online multiplayer game where the ChatPanel is displayed, all elements (input field, Send button, header, messages area) SHALL fit entirely within the chat panel boundaries, and the panel SHALL maintain a fixed overall size with the messages area scrolling vertically.

**Validates: Requirements 2.3, 2.4**

Property 3: Bug Condition — Online Game Result Shows Mode-Aware Message

_For any_ online multiplayer game end event, the game result dialog SHALL display "You Won!" when the local player wins and "You Lost!" when the local player loses, using the `deriveGameEndMessage()` function with the local player's color and game mode.

**Validates: Requirements 2.5**

Property 4: Bug Condition — Local Two-Player Mill Removal Highlighting

_For any_ mill formation in local two-player mode, the system SHALL highlight all eligible opponent pieces for removal with green highlights, and the highlights SHALL remain visible until the player selects a piece to remove.

**Validates: Requirements 2.6**

Property 5: Bug Condition — Local Two-Player Game-Over Navigation

_For any_ local two-player game end event, the system SHALL display a game result dialog with "New Game" and "Main Menu" buttons, allowing the player to navigate after the game ends.

**Validates: Requirements 2.7**

Property 6: Bug Condition — Single-Player AI Failure Recovery

_For any_ AI move failure in single-player mode, the system SHALL recover gracefully by re-enabling player input and/or retrying the AI move using a local fallback, so the game does not become permanently stuck.

**Validates: Requirements 2.8**

Property 7: Preservation — Existing Behavior Unchanged

_For any_ input where none of the six bug conditions hold, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for normal gameplay, tutorial mode, online multiplayer communication, game state persistence, and board rendering.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13**


## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

### Bug 1 — InfoPanel Initial Content & Fixed Dimensions

**File**: `frontend/src/onlineMultiplayer.ts`

**Change**: After `gc.setBoardState(...)` and `setGameController(gc)`, call `infoPanel.update(...)` explicitly with the initial game state so the panel has content immediately on game start. This requires passing the `infoPanel` reference into `startOnlineMultiplayer` or accessing it via the game controller.

**Specific Changes**:
1. Pass `infoPanel` as a parameter to `startOnlineMultiplayer()` (or retrieve it from the game controller after setup)
2. After `gc.setBoardState(...)`, call the InfoPanel update with the initial state

**File**: `frontend/src/styles/main.css`

**Change**: Add fixed dimensions to `.info-panel` so it doesn't collapse when empty or resize on content change.

**Specific Changes**:
1. Add `width: 100%` and `min-height: 150px` to `.info-panel`
2. Add `box-sizing: border-box` to ensure padding doesn't affect dimensions

**File**: `frontend/src/controllers/InfoPanel.ts`

**Change**: Set placeholder initial content in the `create()` method so the panel is never empty.

**Specific Changes**:
1. In `create()`, set initial text content for each child element (e.g., "Current Turn: —", "Phase: —", etc.)

### Bug 2 — ChatPanel CSS Fixes

**File**: `frontend/src/styles/ui.css`

**Change**: Fix ChatPanel CSS to prevent Send button overflow and panel growth.

**Specific Changes**:
1. Add `overflow: hidden` to `.chat-panel` to prevent content from exceeding boundaries
2. Change `.chat-send-button` to use `flex-shrink: 0` and reduce `min-width` or use `white-space: nowrap`
3. Add `min-width: 0` to `.chat-input` so it can shrink below its default size
4. Ensure `.chat-input-container` uses `overflow: hidden` to clip overflowing children
5. Set a fixed `height` on `.chat-panel` instead of only `max-height`

### Bug 3 — Online Win/Lose Display

**File**: `frontend/src/controllers/UIManager.ts`

**Change**: Add an overload or additional parameters to `showGameResult()` that accept `gameMode` and `localPlayerColor`, then use `deriveGameEndMessage()` to produce mode-aware title and message.

**Specific Changes**:
1. Add optional `gameMode` and `localPlayerColor` parameters to `showGameResult()`
2. When `gameMode` is `ONLINE_MULTIPLAYER` or `SINGLE_PLAYER`, use `deriveGameEndMessage()` to derive the title ("You Won!" / "You Lost!") and subtitle
3. Fall back to existing color-based messages for `LOCAL_TWO_PLAYER` mode

**File**: `frontend/src/onlineMultiplayer.ts`

**Change**: Pass `gameMode` and `localPlayerColor` when calling `ui.showGameResult()` in all game-end handlers.

**Specific Changes**:
1. Update `webSocketClient.setOnGameEnd(...)` callback to pass mode info
2. Update `gc.setOnGameOverFromStateUpdate(...)` callback to pass mode info
3. Update `endGameWithDisconnectVictory()` to pass mode info

### Bug 4 — Local Two-Player Piece Removal Highlighting

**File**: `frontend/src/controllers/GameController.ts`

**Change**: The issue is that `handleMillFormed()` sets highlights, but `clearSelection()` (called from `switchPlayer()` or elsewhere in the flow) clears them. Ensure highlights set by `handleMillFormed()` are not cleared before the user can interact.

**Specific Changes**:
1. In `handleMillFormed()`, ensure `boardRenderer.highlightValidMoves(removablePieces)` is called AFTER any `clearSelection()` calls
2. Verify the call order in `applyMove()`: after detecting a mill, `handleMillFormed()` should be the last thing that touches highlights
3. Add a guard so `clearSelection()` does not clear highlights when `millFormed` is true

### Bug 5 — Local Two-Player Return to Main Menu

**File**: `frontend/src/controllers/GameController.ts`

**Change**: Add a callback mechanism so `endGame()` can notify the outer scope (main.ts) that the game has ended, similar to `onGameOverFromStateUpdate` used in online mode.

**Specific Changes**:
1. Add a new callback property `private onGameEnd: ((winner: PlayerColor | null) => void) | null = null`
2. Add a public setter `setOnGameEnd(callback: (winner: PlayerColor | null) => void): void`
3. In `endGame()`, invoke `this.onGameEnd?.(winner)` after showing the announcement banner

**File**: `frontend/src/main.ts`

**Change**: Wire up the `onGameEnd` callback to show `UIManager.showGameResult()` for local and single-player modes.

**Specific Changes**:
1. After creating a `GameController` in `startGame()`, call `gameController.setOnGameEnd(winner => uiManager.showGameResult(winner))`
2. This ensures the result dialog with "New Game" and "Main Menu" buttons appears after the announcement banner

### Bug 6 — Single-Player AI Recovery

**File**: `frontend/src/controllers/GameController.ts`

**Change**: When `getAIMoveFromBackend()` returns `null` (API failure), implement a local fallback AI that picks a random valid move, or at minimum re-enable player input and show an error.

**Specific Changes**:
1. In `handleAIMove()`, when `aiMove` is `null`, call a new `getLocalFallbackAIMove()` method
2. `getLocalFallbackAIMove()` computes a random valid move locally:
   - In PLACEMENT phase: pick a random empty position
   - In MOVEMENT/FLYING phase: pick a random piece with valid moves, then pick a random destination
3. If the fallback also fails (no valid moves), the game-end check will handle it
4. If the fallback produces a move, apply it normally
5. This ensures the game never freezes even if the backend is unavailable

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate each bug condition and assert the expected behavior. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **InfoPanel Initial Content Test**: Create an online game and check InfoPanel has content immediately (will fail on unfixed code)
2. **ChatPanel Overflow Test**: Render ChatPanel in a narrow container and check Send button bounds (will fail on unfixed code)
3. **Online Game Result Message Test**: End an online game and check result dialog text for "You Won!"/"You Lost!" (will fail on unfixed code)
4. **Local Mill Highlighting Test**: Form a mill in local two-player and check highlights are present (will fail on unfixed code)
5. **Local Game-Over Dialog Test**: End a local two-player game and check for result dialog (will fail on unfixed code)
6. **AI Failure Recovery Test**: Mock fetch to fail and check game doesn't freeze (will fail on unfixed code)

**Expected Counterexamples**:
- InfoPanel is empty on game start, no initial update call
- Send button extends beyond chat panel boundary
- Result dialog shows "Black Wins!" instead of "You Lost!"
- Highlights are cleared before user can see them
- No result dialog appears, only announcement banner
- Game freezes with input disabled after AI failure

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for normal gameplay interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **InfoPanel Update Preservation**: Verify InfoPanel continues to update correctly during normal gameplay in all modes
2. **ChatPanel Functionality Preservation**: Verify collapse, mute, notification badges, and auto-scroll continue working
3. **Local Two-Player Result Message Preservation**: Verify local games still show "White Wins!" / "Black Wins!" (not "You Won!")
4. **Tutorial Mode Preservation**: Verify tutorial completion doesn't show result dialog
5. **Online Rematch Preservation**: Verify online game-end still shows "Play Again" button
6. **Normal AI Move Preservation**: Verify successful AI moves still apply correctly

### Unit Tests

- Test InfoPanel `create()` sets initial placeholder content
- Test InfoPanel `update()` with initial game state produces correct text
- Test `deriveGameEndMessage()` for all mode/winner combinations
- Test `UIManager.showGameResult()` with mode-aware parameters
- Test `GameController.endGame()` invokes `onGameEnd` callback
- Test `getLocalFallbackAIMove()` returns valid moves for placement, movement, and flying phases
- Test `handleMillFormed()` highlights are not cleared by subsequent operations
- Test ChatPanel CSS constraints (visual regression)

### Property-Based Tests

- Generate random game states and verify InfoPanel update produces non-empty content for all valid states
- Generate random board configurations and verify `getLocalFallbackAIMove()` returns a valid move when legal moves exist
- Generate random game-end scenarios and verify `deriveGameEndMessage()` produces correct mode-aware messages
- Generate random mill formations and verify removable piece highlights persist until removal

### Integration Tests

- Test full online game flow: start → play → end → verify "You Won!"/"You Lost!" message
- Test full local two-player flow: start → form mill → verify highlights → remove piece → game end → verify dialog
- Test full single-player flow: start → player move → AI failure → verify recovery
- Test that game-over dialog "Main Menu" button returns to main menu
- Test that game-over dialog "New Game" button starts a new game
