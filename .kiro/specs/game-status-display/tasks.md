# Implementation Plan: Game Status Display

## Overview

This plan implements the game status display feature: an HTML Info Panel, Announcement Banner, contextual action instructions, and Chat Panel repositioning. The approach builds components bottom-up — pure derivation functions first, then DOM components, then integration with GameController and layout changes. Each task builds on the previous, with tests alongside implementation.

The implementation uses TypeScript with Vitest and fast-check for testing. All new components are vanilla TypeScript/HTML/CSS with no framework dependencies.

## Tasks

- [ ] 1. Implement pure derivation functions and their property tests
  - [ ] 1.1 Create derivation functions in `frontend/src/controllers/InfoPanel.ts`
    - Export `deriveActionInstruction(data: InfoPanelData): string` function
    - Export `InfoPanelData` interface
    - Export `deriveTurnMessage(newPlayer, gameMode, localPlayerColor): string` function
    - Export `derivePhaseMessage(phase): { message: string; subtitle: string }` function
    - Export `deriveGameEndMessage(winner, reason, gameMode, localPlayerColor): { message: string; subtitle: string }` function
    - `deriveGameEndMessage` must return "You Won!" / "You Lost!" in online multiplayer and single-player modes based on whether the winner matches the local player color, and "[Color] Wins!" in local two-player mode
    - All functions must be pure (no side effects, no DOM access)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.6, 5.7_

  - [ ] 1.2 Write property tests for derivation functions
    - Create `frontend/src/controllers/InfoPanel.property.test.ts`
    - Implement fast-check generators: `arbGamePhase`, `arbPlayerColor`, `arbGameMode`, `arbPieceCount`, `arbPosition`, `arbGameState`, `arbWinReason`
    - **Property 2: Action instruction derivation correctness** — validate all 6 instruction branches
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
    - **Property 3: Turn announcement message correctness** — validate Your Turn / Opponent's Turn / [Color]'s Turn
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Property 4: Game end announcement message correctness** — validate "You Won!" / "You Lost!" in online and single-player modes, "[Color] Wins!" in local two-player mode, and reason in subtitle
    - **Validates: Requirements 5.1, 5.2, 5.5, 5.6, 5.7**
    - **Property 5: Phase transition message correctness** — validate Movement and Flying messages
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Each property test must run with `{ numRuns: 100 }` minimum
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.5, 5.6, 5.7_

- [ ] 2. Implement InfoPanel DOM component
  - [ ] 2.1 Implement InfoPanel class in `frontend/src/controllers/InfoPanel.ts`
    - Implement `create()` method that builds DOM structure: container, turnIndicator, phaseDisplay, piecesDisplay, playerColorDisplay, actionInstruction
    - Implement `update(gameState, gameMode, playerColor, selectedPosition, isAiThinking)` method using `deriveActionInstruction`
    - Implement `show()`, `hide()`, `destroy()` methods
    - Null-check all DOM elements in `update()` for safety
    - Show playerColorDisplay only in ONLINE_MULTIPLAYER mode
    - Show piecesDisplay only during PLACEMENT phase
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 2.2 Write unit tests for InfoPanel
    - Create `frontend/src/controllers/InfoPanel.test.ts`
    - Test: panel creates correct DOM structure with all expected child elements
    - Test: `show()` and `hide()` toggle visibility
    - Test: displays "You are: White" only in online multiplayer mode
    - Test: hides pieces remaining when not in PLACEMENT phase
    - Test: `destroy()` removes DOM elements
    - Test: `update()` before `create()` does not throw
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

  - [ ] 2.3 Write property test for InfoPanel update rendering
    - Add to `frontend/src/controllers/InfoPanel.property.test.ts`
    - **Property 1: InfoPanel update renders correct game state** — for any valid game state, DOM content reflects current player, phase, piece counts, and player color
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 4.6**
    - Must run with `{ numRuns: 100 }` minimum
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 4.6_

- [ ] 3. Implement AnnouncementBanner component
  - [ ] 3.1 Implement AnnouncementBanner class in `frontend/src/controllers/AnnouncementBanner.ts`
    - Export `AnnouncementOptions` interface with message, subtitle, duration, type fields
    - Implement `create()` method that builds hidden banner container
    - Implement `show(options)` method: dismiss existing, display new, set auto-dismiss timer
    - Implement `dismiss()` method: clear timer, hide banner
    - Implement `destroy()` method: clear timer, remove from DOM
    - Use `pointer-events: none` for transient announcements (turn, phase)
    - Use `pointer-events: auto` for game-end announcements (persistent, duration=0)
    - Default duration: 2000ms for turn/phase, 0 (persistent) for game-end
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.4, 5.1, 5.4_

  - [ ] 3.2 Write unit tests for AnnouncementBanner
    - Create `frontend/src/controllers/AnnouncementBanner.test.ts`
    - Test: banner creates correct DOM structure
    - Test: turn announcement auto-dismisses after duration
    - Test: phase transition displays correct message and subtitle
    - Test: game-end announcement persists (no auto-dismiss, duration=0)
    - Test: game-end uses `pointer-events: auto`
    - Test: transient announcements use `pointer-events: none`
    - Test: calling `show()` replaces existing announcement
    - Test: `show()` before `create()` does not throw
    - Test: `dismiss()` when no announcement is visible is a no-op
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 5.3, 5.4_

- [ ] 4. Checkpoint - Verify new components work in isolation
  - Run all frontend tests: `cd frontend && npm test -- --silent`
  - Verify all property tests pass with 100+ iterations (Properties 1-5)
  - Verify all InfoPanel unit tests pass (DOM structure, show/hide, update, destroy)
  - Verify all AnnouncementBanner unit tests pass (auto-dismiss, persistence, pointer-events, replacement)
  - Verify all derivation function property tests pass (action instruction, turn message, phase message, game-end message)
  - Verify zero linting errors on all new files with `getDiagnostics`
  - Verify frontend build succeeds: `cd frontend && npm run build`
  - Ask the user if questions arise

- [ ] 5. Integrate InfoPanel and AnnouncementBanner with GameController
  - [ ] 5.1 Add setters and update calls in `frontend/src/controllers/GameController.ts`
    - Add `private infoPanel: InfoPanel | null = null` and `private announcementBanner: AnnouncementBanner | null = null` fields
    - Add `setInfoPanel(infoPanel: InfoPanel): void` and `setAnnouncementBanner(banner: AnnouncementBanner): void` methods
    - Add `private phaseTransitionOccurred: boolean = false` flag for announcement priority
    - In `updateDisplay()`: call `infoPanel.update(...)` with current gameState, gameMode, playerColor, selectedPosition, isAiThinking
    - In `switchPlayer()`: call `announcementBanner.show(...)` with turn change message (skip if `phaseTransitionOccurred` is true, then reset flag)
    - In `updateGamePhase()`: when phase changes, call `announcementBanner.show(...)` with phase transition message and set `phaseTransitionOccurred = true`
    - In `endGame()` / `handleGameEnd()`: call `announcementBanner.show(...)` with game-end message (duration=0, persistent), using `deriveGameEndMessage` which returns personalized "You Won!" / "You Lost!" in online and single-player modes
    - In `handleMovementClick()`: call `infoPanel.update(...)` when piece is selected/deselected for immediate action instruction update
    - _Requirements: 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1_

  - [ ] 5.2 Write unit tests for GameController integration
    - Add tests to existing `frontend/src/controllers/GameController.test.ts` or create a new test file
    - Test: `updateDisplay()` calls `infoPanel.update()` with correct state
    - Test: `switchPlayer()` triggers turn announcement via `announcementBanner.show()`
    - Test: `updateGamePhase()` triggers phase announcement and suppresses turn announcement
    - Test: `endGame()` triggers game-end announcement with persistent duration
    - Test: phase transition takes priority over turn change (Req 3.4)
    - _Requirements: 1.6, 2.1, 3.4, 5.1, 7.1_

- [ ] 6. Modify BoardRenderer to disable canvas game info text
  - [ ] 6.1 Add infoPanelActive flag to `frontend/src/rendering/BoardRenderer.ts`
    - Add `private infoPanelActive: boolean = false` field
    - Add `public setInfoPanelActive(active: boolean): void` method
    - In `render()` full signature path: skip `drawGameInfo()` call when `infoPanelActive` is true
    - _Requirements: 1.7_

  - [ ] 6.2 Write unit tests for BoardRenderer infoPanelActive flag
    - Add tests to existing BoardRenderer test file or create new
    - Test: `drawGameInfo()` is skipped when `infoPanelActive` is true
    - Test: `drawGameInfo()` resumes when `infoPanelActive` is set back to false
    - _Requirements: 1.7_

- [ ] 7. Update CSS layout and ChatPanel repositioning
  - [ ] 7.1 Update CSS Grid layout in `frontend/src/styles/main.css`
    - Change `#app` grid to support multi-area layout: info-panel, canvas, chat-panel
    - Desktop (>768px): three-column layout with info panel left, canvas center, chat panel right (online only)
    - Mobile (≤768px): single-column stacked layout with info panel above canvas
    - Add styles for `.info-panel` container (background, padding, border-radius, responsive sizing)
    - Add styles for `.announcement-banner` overlay (position absolute within canvas grid cell, centered, z-index, CSS animations for fade-in/fade-out)
    - Add styles for announcement types: `.announcement-turn`, `.announcement-phase`, `.announcement-game-end`
    - Ensure canvas is not clipped or overlapped by panels
    - _Requirements: 1.5, 1.8, 6.1, 6.2, 6.4_

  - [ ] 7.2 Modify ChatPanel for non-overlapping layout in `frontend/src/controllers/ChatPanel.ts`
    - Change CSS positioning: remove `position: fixed`, use grid area placement on desktop (>768px)
    - On mobile (≤768px): collapsed by default with toggle button, positioned below canvas
    - Add `private unreadCount: number = 0` and `private notificationBadge: HTMLElement | null = null`
    - Add `updateNotificationBadge()`: increment unread count and show badge when collapsed and message arrives
    - Add `clearNotificationBadge()`: reset count when panel is expanded
    - Update `addMessage()` to call `updateNotificationBadge()` when collapsed
    - Update `toggleCollapse()` to call `clearNotificationBadge()` when expanding
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.2_

  - [ ] 7.3 Write unit tests for ChatPanel notification badge
    - Add tests for notification badge behavior
    - Test: toggle button exists and works
    - Test: notification badge appears when message received while collapsed
    - Test: notification badge clears when panel expanded
    - Test: unread count increments correctly
    - _Requirements: 6.3, 6.5_

  - [ ] 7.4 Write property test for ChatPanel notification badge
    - Add to `frontend/src/controllers/InfoPanel.property.test.ts` or create separate file
    - **Property 6: Chat notification badge on collapsed panel** — for any sequence of messages while collapsed, badge count equals messages received since last expand; expanding resets to zero
    - **Validates: Requirements 6.5**
    - Must run with `{ numRuns: 100 }` minimum
    - _Requirements: 6.5_

- [ ] 8. Checkpoint - Verify layout and integration
  - Run all frontend tests: `cd frontend && npm test -- --silent`
  - Verify GameController integration tests pass (updateDisplay calls InfoPanel, switchPlayer triggers announcement, phase transition priority)
  - Verify BoardRenderer infoPanelActive tests pass (drawGameInfo skipped/resumed)
  - Verify ChatPanel notification badge tests pass (badge appears, clears, increments)
  - Verify ChatPanel notification badge property test passes with 100+ iterations (Property 6)
  - Verify zero linting errors on all modified files with `getDiagnostics`
  - Verify frontend build succeeds: `cd frontend && npm run build`
  - Verify no regressions in existing tests (all 289+ existing tests still pass)
  - Ask the user if questions arise

- [ ] 9. Wire everything together in main.ts and index.html
  - [ ] 9.1 Update `frontend/index.html` for new layout structure
    - Add `<div id="info-panel-container"></div>` element inside `#app` before the canvas
    - Add `<div id="announcement-container"></div>` element inside `#app` overlaying the canvas area
    - Ensure semantic HTML structure supports the CSS Grid layout
    - _Requirements: 1.5_

  - [ ] 9.2 Update `frontend/src/main.ts` to create and wire components
    - Import `InfoPanel` and `AnnouncementBanner`
    - Create `InfoPanel` and `AnnouncementBanner` instances
    - Call `infoPanel.create()` and `announcementBanner.create()`
    - Pass to `GameController` via `setInfoPanel()` and `setAnnouncementBanner()`
    - Call `boardRenderer.setInfoPanelActive(true)` to disable canvas text
    - Pass `InfoPanel` reference to `startOnlineMultiplayer()` so online mode can use it
    - Ensure components are created before `startGame()` is called
    - _Requirements: 1.5, 1.7, 7.1, 7.3, 7.4, 7.5_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Run full frontend test suite: `cd frontend && npm test -- --silent`
  - Run full backend test suite: `mvn test --quiet`
  - Verify ALL property tests pass with 100+ iterations (Properties 1-6)
  - Verify ALL unit tests pass for InfoPanel, AnnouncementBanner, ChatPanel, BoardRenderer, GameController
  - Verify zero linting errors across all new and modified files with `getDiagnostics`
  - Verify frontend build succeeds: `cd frontend && npm run build`
  - Verify no regressions: all existing tests (289+ frontend, all backend) still pass
  - Verify InfoPanel displays correctly in all game modes (online, local two-player, single-player)
  - Verify AnnouncementBanner triggers for turn changes, phase transitions, and game end
  - Verify ChatPanel does not overlap the board and notification badge works
  - Verify BoardRenderer no longer draws game info text on canvas
  - Ask the user if questions arise

## Notes

- ALL test tasks are MANDATORY and must be completed before marking any implementation task as done
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and must not be marked complete until all verification steps pass
- Property tests validate universal correctness properties from the design document and must run 100+ iterations
- Unit tests validate specific examples and edge cases
- All derivation functions are pure and testable independently from DOM
- The design uses setter injection (`setInfoPanel`, `setAnnouncementBanner`) to avoid breaking existing GameController constructor signatures
