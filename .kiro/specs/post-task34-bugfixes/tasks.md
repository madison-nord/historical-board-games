# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Post-Task 34 Multi-Bug Exploration
  - **CRITICAL**: Write these property-based tests BEFORE implementing any fixes
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - **Scoped PBT Approach**: Scope each property to the concrete failing case(s) for reproducibility
  - **Bug 1 — InfoPanel Initial Content**: Test that when an online game starts (after `gc.setBoardState(...)` and `setInfoPanel(infoPanel)`), the InfoPanel DOM elements have non-empty text content immediately. Assert `turnIndicator.textContent` is not empty, `phaseDisplay.textContent` is not empty, and `actionInstruction.textContent` is not empty. On UNFIXED code, the InfoPanel will be empty because `update()` is never called with initial state during online game setup.
  - **Bug 2 — ChatPanel Overflow**: Test that when a ChatPanel is rendered inside a container of width 280px (the max grid column width), the `.chat-send-button` right edge does not exceed the `.chat-panel` right edge, and after adding 20 messages the `.chat-panel` height does not exceed `max-height`. On UNFIXED code, the Send button overflows and the panel grows.
  - **Bug 3 — Online Game Result Message**: Test that when `UIManager.showGameResult()` is called for an online game end, the result dialog title contains "You Won!" or "You Lost!" (not "White Wins!" or "Black Wins!"). On UNFIXED code, `showGameResult()` always shows color-based messages because it doesn't accept `gameMode`/`localPlayerColor` parameters.
  - **Bug 4 — Local Mill Highlighting**: Test that after `handleMillFormed()` is called in local two-player mode, `boardRenderer.highlightValidMoves()` has been called with removable pieces AND `clearHighlights()` has NOT been called after it (i.e., highlights persist). On UNFIXED code, `clearSelection()` inside `switchPlayer()` clears highlights set by `handleMillFormed()`.
  - **Bug 5 — Local Game-Over Dialog**: Test that when `endGame()` is called in local two-player mode, a callback mechanism notifies the outer scope so `UIManager.showGameResult()` can be invoked. On UNFIXED code, `endGame()` only shows an `AnnouncementBanner` and has no callback to trigger the result dialog.
  - **Bug 6 — AI Failure Recovery**: Test that when `getAIMoveFromBackend()` returns `null` (mocked fetch failure), the game does not remain stuck — either a fallback move is applied or player input is re-enabled. On UNFIXED code, the game freezes with input disabled after AI failure.
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found to understand root cause
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Write preservation property tests (BEFORE implementing fixes)
  - **Property 2: Preservation** - Existing Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - **Observe on UNFIXED code**: Run the unfixed code with non-buggy inputs and record actual outputs
  - Observe: `InfoPanel.update()` with a valid game state produces correct turn, phase, pieces, and action text in all modes
  - Observe: `deriveGameEndMessage(WHITE, reason, LOCAL_TWO_PLAYER, WHITE)` returns `{ message: "White Wins!", subtitle: reason }` (color-based for local)
  - Observe: `deriveGameEndMessage(BLACK, reason, LOCAL_TWO_PLAYER, WHITE)` returns `{ message: "Black Wins!", subtitle: reason }`
  - Observe: `deriveTurnMessage(WHITE, LOCAL_TWO_PLAYER, WHITE)` returns `"White's Turn"`
  - Observe: ChatPanel collapse/mute toggles work correctly, notification badges update when collapsed
  - Observe: In online mode, `handleMillFormed()` correctly highlights removable pieces
  - Observe: When AI move succeeds (non-null), `applyMove()` is called and turn switches
  - Write property-based tests:
    - For all valid `InfoPanelData` inputs, `deriveActionInstruction()` returns a non-empty string (unless game is over)
    - For all `(winner, reason, LOCAL_TWO_PLAYER, playerColor)` combos, `deriveGameEndMessage()` returns color-based messages (not "You Won/Lost")
    - For all `(winner, reason, ONLINE_MULTIPLAYER, playerColor)` combos, `deriveGameEndMessage()` returns perspective-based messages ("You Won!"/"You Lost!")
    - For all valid game states, `getRemovablePieces()` returns correct pieces (not in mills, or all if all in mills)
    - For all non-zero valid AI moves, `applyMove()` updates the board correctly
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_

- [x] 3. Fix Bug 1 — InfoPanel Initial Content & Fixed Dimensions

  - [x] 3.1 Add fixed dimensions to `.info-panel` in `frontend/src/styles/main.css`
    - Add `width: 100%` and `min-height: 150px` to `.info-panel`
    - Add `box-sizing: border-box` to ensure padding doesn't affect dimensions
    - _Bug_Condition: isBugCondition(input) where input.event == "ONLINE_GAME_START" AND infoPanelHasNoFixedDimensions()_
    - _Expected_Behavior: InfoPanel maintains consistent dimensions that do not shift between updates_
    - _Preservation: InfoPanel continues to display correctly in all modes_
    - _Requirements: 2.2_

  - [x] 3.2 Set placeholder initial content in `InfoPanel.create()` in `frontend/src/controllers/InfoPanel.ts`
    - In `create()`, set initial text content for each child element: "Current Turn: —", "Phase: —", etc.
    - This ensures the panel is never empty when first rendered
    - _Bug_Condition: isBugCondition(input) where infoPanelHasNoContent()_
    - _Expected_Behavior: InfoPanel displays placeholder content immediately on creation_
    - _Preservation: InfoPanel update() continues to overwrite placeholders with real data_
    - _Requirements: 2.1_

  - [x] 3.3 Call `infoPanel.update()` explicitly after online game initialization in `frontend/src/onlineMultiplayer.ts`
    - After `gc.setBoardState(...)` and `setGameController(gc)`, call `infoPanel.update()` with the initial game state
    - Pass `infoPanel` as a parameter to `startOnlineMultiplayer()` or retrieve it from the game controller after setup
    - Update `main.ts` to pass `infoPanel` to `startOnlineMultiplayer()`
    - _Bug_Condition: isBugCondition(input) where input.event == "ONLINE_GAME_START" AND infoPanelHasNoContent()_
    - _Expected_Behavior: InfoPanel shows initial game info (turn, phase, player color, action) immediately on online game start_
    - _Preservation: InfoPanel continues to update normally during gameplay_
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Verify bug condition exploration test for Bug 1 now passes
    - **Property 1: Expected Behavior** - InfoPanel Initial Content
    - **IMPORTANT**: Re-run the SAME test from task 1 (Bug 1 portion) — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (confirms InfoPanel shows content on online game start)
    - _Requirements: 2.1, 2.2_

- [x] 4. Fix Bug 2 — ChatPanel CSS Overflow & Growth

  - [x] 4.1 Fix ChatPanel CSS in `frontend/src/styles/ui.css`
    - Add `overflow: hidden` to `.chat-panel` to prevent content from exceeding boundaries
    - Set a fixed `height` on `.chat-panel` (e.g., `height: 500px`) instead of only `max-height`
    - Change `.chat-send-button` to use `flex-shrink: 0` and reduce `min-width` to `auto` or remove it
    - Add `min-width: 0` to `.chat-input` so it can shrink below its default size
    - Ensure `.chat-input-container` clips overflowing children
    - _Bug_Condition: isBugCondition(input) where input.event == "CHAT_PANEL_DISPLAYED" AND (sendButtonOverflows() OR panelGrowsWithMessages())_
    - _Expected_Behavior: All chat elements fit within panel boundaries; panel maintains fixed size with scrollable messages_
    - _Preservation: ChatPanel collapse, mute, notification badges, and auto-scroll continue working_
    - _Requirements: 2.3, 2.4_

  - [x] 4.2 Verify bug condition exploration test for Bug 2 now passes
    - **Property 1: Expected Behavior** - ChatPanel Boundaries
    - **IMPORTANT**: Re-run the SAME test from task 1 (Bug 2 portion) — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (confirms ChatPanel elements fit within boundaries)
    - _Requirements: 2.3, 2.4_

- [x] 5. Fix Bug 3 — Online Win/Lose Display

  - [x] 5.1 Add `gameMode` and `localPlayerColor` parameters to `UIManager.showGameResult()` in `frontend/src/controllers/UIManager.ts`
    - Add optional `gameMode?: GameMode` and `localPlayerColor?: PlayerColor` parameters
    - When `gameMode` is `ONLINE_MULTIPLAYER` or `SINGLE_PLAYER`, use `deriveGameEndMessage()` to derive the title ("You Won!" / "You Lost!") and subtitle
    - Fall back to existing color-based messages for `LOCAL_TWO_PLAYER` mode or when parameters are not provided
    - Import `GameMode` and `deriveGameEndMessage` from the appropriate modules
    - _Bug_Condition: isBugCondition(input) where input.event == "ONLINE_GAME_END" AND resultDialogShowsConcatenatedMessage()_
    - _Expected_Behavior: Online game result shows "You Won!" or "You Lost!" using deriveGameEndMessage()_
    - _Preservation: Local two-player games continue to show "White Wins!" / "Black Wins!"_
    - _Requirements: 2.5, 3.5_

  - [x] 5.2 Pass `gameMode` and `localPlayerColor` in all game-end handlers in `frontend/src/onlineMultiplayer.ts`
    - Update `webSocketClient.setOnGameEnd(...)` callback to pass `GameMode.ONLINE_MULTIPLAYER` and `myPlayerColor`
    - Update `gc.setOnGameOverFromStateUpdate(...)` callback to pass mode info
    - Update `endGameWithDisconnectVictory()` to pass mode info
    - _Bug_Condition: isBugCondition(input) where input.event == "ONLINE_GAME_END"_
    - _Expected_Behavior: All online game-end paths pass mode-aware parameters to showGameResult()_
    - _Preservation: Online rematch button ("Play Again") continues to appear_
    - _Requirements: 2.5, 3.10_

  - [x] 5.3 Verify bug condition exploration test for Bug 3 now passes
    - **Property 1: Expected Behavior** - Online Game Result Message
    - **IMPORTANT**: Re-run the SAME test from task 1 (Bug 3 portion) — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (confirms "You Won!"/"You Lost!" for online games)
    - _Requirements: 2.5_

- [x] 6. Fix Bug 4 — Local Two-Player Piece Removal Highlighting

  - [x] 6.1 Add guard in `clearSelection()` to preserve mill highlights in `frontend/src/controllers/GameController.ts`
    - Modify `clearSelection()` so that when `this.currentGameState?.millFormed` is true, it does NOT call `boardRenderer.clearHighlights()`
    - This ensures highlights set by `handleMillFormed()` are not cleared by `switchPlayer()` → `clearSelection()`
    - _Bug_Condition: isBugCondition(input) where input.event == "MILL_FORMED" AND input.gameMode == LOCAL_TWO_PLAYER AND removableHighlightsNotVisible()_
    - _Expected_Behavior: Removal highlights persist until the player selects a piece to remove_
    - _Preservation: Online and single-player mill highlighting continues to work; highlights are still cleared on deselection and player switch when no mill is formed_
    - _Requirements: 2.6, 3.7, 3.8, 3.9_

  - [x] 6.2 Verify bug condition exploration test for Bug 4 now passes
    - **Property 1: Expected Behavior** - Local Mill Highlighting
    - **IMPORTANT**: Re-run the SAME test from task 1 (Bug 4 portion) — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (confirms highlights persist during mill removal)
    - _Requirements: 2.6_

- [x] 7. Fix Bug 5 — Local Two-Player Return to Main Menu

  - [x] 7.1 Add `onGameEnd` callback to `GameController` in `frontend/src/controllers/GameController.ts`
    - Add `private onGameEnd: ((winner: PlayerColor | null) => void) | null = null`
    - Add `public setOnGameEnd(callback: (winner: PlayerColor | null) => void): void`
    - In `endGame()`, invoke `this.onGameEnd?.(winner)` after showing the announcement banner
    - _Bug_Condition: isBugCondition(input) where input.event == "GAME_OVER" AND input.gameMode == LOCAL_TWO_PLAYER AND noResultDialogShown()_
    - _Expected_Behavior: endGame() notifies outer scope via callback so result dialog can be shown_
    - _Preservation: Announcement banner continues to show; tutorial mode game completion unaffected_
    - _Requirements: 2.7, 3.6, 3.11_

  - [x] 7.2 Wire `onGameEnd` callback in `startGame()` in `frontend/src/main.ts`
    - After creating a `GameController` in `startGame()`, call `gameController.setOnGameEnd(winner => uiManager.showGameResult(winner))`
    - For single-player mode, pass `GameMode.SINGLE_PLAYER` and `playerColor` to `showGameResult()`
    - For local two-player mode, pass `GameMode.LOCAL_TWO_PLAYER` (or omit mode params to get color-based messages)
    - _Bug_Condition: isBugCondition(input) where noResultDialogShown()_
    - _Expected_Behavior: Game result dialog with "New Game" and "Main Menu" buttons appears after game ends_
    - _Preservation: Tutorial mode does not trigger result dialog; online mode continues using its own handlers_
    - _Requirements: 2.7, 3.6_

  - [x] 7.3 Verify bug condition exploration test for Bug 5 now passes
    - **Property 1: Expected Behavior** - Local Game-Over Dialog
    - **IMPORTANT**: Re-run the SAME test from task 1 (Bug 5 portion) — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (confirms result dialog is triggered on local game end)
    - _Requirements: 2.7_

- [x] 8. Fix Bug 6 — Single-Player AI Failure Recovery

  - [x] 8.1 Implement `getLocalFallbackAIMove()` in `frontend/src/controllers/GameController.ts`
    - Add a new private method `getLocalFallbackAIMove(): Move | null`
    - In PLACEMENT phase: pick a random empty position and return a PLACE move
    - In MOVEMENT/FLYING phase: find all AI pieces with valid moves, pick a random piece, then pick a random destination
    - If no valid moves exist, return null (game-end check will handle it)
    - _Bug_Condition: isBugCondition(input) where input.event == "AI_MOVE_REQUESTED" AND aiMoveFailsAndNoRecovery()_
    - _Expected_Behavior: Local fallback AI computes a valid random move when backend fails_
    - _Preservation: Successful backend AI moves continue to be applied correctly_
    - _Requirements: 2.8, 3.12, 3.13_

  - [x] 8.2 Update `handleAIMove()` to use fallback when backend returns null
    - In `handleAIMove()`, when `getAIMoveFromBackend()` returns `null`, call `getLocalFallbackAIMove()`
    - If fallback returns a valid move, apply it normally via `applyMove()`
    - If fallback also returns null (no valid moves), log a warning — the game-end check will handle it
    - _Bug_Condition: isBugCondition(input) where aiMoveFailsAndNoRecovery()_
    - _Expected_Behavior: Game never freezes; fallback move is applied or game ends naturally_
    - _Preservation: Normal AI flow (backend success) is unchanged_
    - _Requirements: 2.8_

  - [x] 8.3 Verify bug condition exploration test for Bug 6 now passes
    - **Property 1: Expected Behavior** - AI Failure Recovery
    - **IMPORTANT**: Re-run the SAME test from task 1 (Bug 6 portion) — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (confirms game recovers from AI failure)
    - _Requirements: 2.8_

- [x] 9. Verify all preservation tests still pass

  - [x] 9.1 Re-run preservation property tests
    - **Property 2: Preservation** - Existing Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after all six bug fixes (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_

- [x] 10. Checkpoint - Ensure all tests pass
  - Run the full frontend test suite to verify no regressions
  - Ensure all bug condition exploration tests pass (confirming all 6 bugs are fixed)
  - Ensure all preservation property tests pass (confirming no regressions)
  - Ensure existing test suites (unit, integration, property) continue to pass
  - Ask the user if questions arise
