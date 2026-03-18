# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Banner Persists After Navigation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the banner is not dismissed during navigation transitions
  - **Scoped PBT Approach**: For each navigation action type (newGame, startGame, startTutorial, startOnlineMultiplayer), scope the property to the concrete case: a visible game-end banner (container displayed, classList contains 'announcement-game-end') followed by the navigation trigger
  - Test file: `frontend/src/controllers/PersistentWinBannerFix.exploration.test.ts`
  - Create an `AnnouncementBanner` instance, call `create()`, then `show({ message: 'Black Wins!', subtitle: 'Reduced to fewer than 3 pieces', type: 'game-end', duration: 0 })` to simulate a persistent game-end banner
  - For each navigation path in `main.ts`:
    - **onNewGame callback**: Simulate the callback logic (currently: `LocalStorage.clearGameState()` + `uiManager.showMainMenu()`) and assert `banner.container.style.display === 'none'` and `banner.container.innerHTML === ''`
    - **startGame()**: Simulate calling `startGame()` and assert banner is dismissed before new GameController is created
    - **startTutorial()**: Simulate calling `startTutorial()` and assert banner is dismissed before TutorialController is created
    - **online-multiplayer case**: Simulate the game mode selection for online multiplayer and assert banner is dismissed before `startOnlineMultiplayer()` is called
  - The test assertions should match the Expected Behavior Properties from design: `announcementBanner.container.style.display === 'none'` AND `announcementBanner.container.innerHTML === ''`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists because no code path calls `dismiss()` during navigation)
  - Document counterexamples found (e.g., "After onNewGame callback, banner container display is '' not 'none', innerHTML still contains 'Black Wins!'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Game-End Banner and Transient Announcement Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Test file: `frontend/src/controllers/PersistentWinBannerFix.preservation.test.ts`
  - **Observe on UNFIXED code**:
    - Observe: `banner.show({ message: 'Black Wins!', type: 'game-end', duration: 0 })` → container is visible, display is not 'none', innerHTML contains message, classList contains 'announcement-game-end', pointerEvents is 'auto'
    - Observe: `banner.show({ message: 'Your Turn', type: 'turn', duration: 2000 })` → container is visible, auto-dismisses after 2000ms (display becomes 'none', innerHTML cleared)
    - Observe: `banner.show({ message: 'Movement Phase', type: 'phase', duration: 2000 })` → same auto-dismiss behavior as turn
    - Observe: calling `banner.show()` while another announcement is visible → previous announcement is dismissed first, new one is shown
  - **Write property-based tests capturing observed behavior**:
    - For all game-end announcements with any message/subtitle string: banner displays persistently (display !== 'none'), content matches message, pointerEvents is 'auto', no auto-dismiss timer fires
    - For all turn/phase announcements with any message string: banner displays then auto-dismisses after duration (use `vi.useFakeTimers()` to advance time), display becomes 'none', innerHTML is cleared
    - For all pairs of announcements (show A then show B): after showing B, only B's content is visible, A's content is gone
    - For all calls to `dismiss()` when no banner is visible: no errors thrown, container remains hidden (no-op safety)
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for persistent win banner not dismissed on navigation

  - [x] 3.1 Implement the fix in main.ts
    - Add `announcementBanner.dismiss()` in the `uiManager.setOnNewGame()` callback, before `LocalStorage.clearGameState()` and `uiManager.showMainMenu()`
    - Add `announcementBanner.dismiss()` at the top of the `startGame()` function, before creating the new `GameController`
    - Add `announcementBanner.dismiss()` at the top of the `startTutorial()` function, before creating the `TutorialController`
    - Add `announcementBanner.dismiss()` in the `uiManager.setOnGameModeSelected()` callback's `'online-multiplayer'` case, before calling `startOnlineMultiplayer()`
    - All four changes are single-line additions; `dismiss()` is safe to call when no banner is visible (no-op)
    - _Bug_Condition: isBugCondition(input) where announcementBanner is visible with 'announcement-game-end' class AND input.type is a navigation action_
    - _Expected_Behavior: announcementBanner.container.style.display === 'none' AND announcementBanner.container.innerHTML === '' after navigation_
    - _Preservation: Turn/phase announcements auto-dismiss after 2000ms, game-end banner still displays on game over, show() still dismisses previous announcement_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Banner Dismissed on Navigation
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (banner dismissed after each navigation action)
    - When this test passes, it confirms the expected behavior is satisfied for all navigation paths
    - Run bug condition exploration test from step 1: `frontend/src/controllers/PersistentWinBannerFix.exploration.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Game-End Banner and Transient Announcement Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2: `frontend/src/controllers/PersistentWinBannerFix.preservation.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run the full frontend test suite to ensure no regressions across the codebase
  - Verify both exploration and preservation test files pass
  - Ensure all existing AnnouncementBanner tests still pass
  - Ensure all existing GameController tests still pass
  - Ask the user if questions arise
