# Persistent Win Banner Fix - Bugfix Design

## Overview

When a game ends, `GameController.endGame()` shows an `AnnouncementBanner` with `type: 'game-end'` and `duration: 0` (persistent). This banner stays visible indefinitely because nothing in the new-game or main-menu navigation flow calls `announcementBanner.dismiss()`. The fix adds dismiss calls at the appropriate transition points in `main.ts` so the banner is cleared before any new game or menu is shown.

## Glossary

- **Bug_Condition (C)**: A persistent game-end `AnnouncementBanner` is visible AND the user triggers a navigation action (New Game, Main Menu, or starting any game mode)
- **Property (P)**: The `AnnouncementBanner` is dismissed (hidden, content cleared) before the new game initializes or the main menu renders
- **Preservation**: Turn/phase announcements during gameplay, game-end banner display at end of game, and auto-dismiss behavior for transient announcements must all remain unchanged
- **AnnouncementBanner**: The singleton overlay controller in `frontend/src/controllers/AnnouncementBanner.ts` that displays transient (turn/phase) and persistent (game-end) messages
- **UIManager**: The dialog controller in `frontend/src/controllers/UIManager.ts` that manages menu and result dialogs
- **main.ts**: The application entry point that wires UIManager callbacks, creates the AnnouncementBanner instance, and orchestrates game lifecycle

## Bug Details

### Bug Condition

The bug manifests when a game ends (producing a persistent game-end banner with `duration: 0`) and the user subsequently navigates away via "New Game", "Main Menu", or starts a new game in any mode. The `AnnouncementBanner.dismiss()` method is never called during these transitions, so the stale overlay remains visible on top of the new game or menu.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type NavigationAction (newGame | mainMenu | startGameMode)
  OUTPUT: boolean
  
  RETURN announcementBanner.container IS NOT NULL
         AND announcementBanner.container.style.display !== 'none'
         AND announcementBanner.container.classList.contains('announcement-game-end')
         AND input.type IN ['newGame', 'mainMenu', 'startSinglePlayer', 'startLocalTwoPlayer', 'startTutorial', 'startOnlineMultiplayer']
END FUNCTION
```

### Examples

- User finishes a single-player game (Black wins), clicks "New Game" → starts a new local two-player game → stale "Black Wins!" banner covers the new game board
- User finishes a local two-player game, clicks "Main Menu" → main menu dialog appears but the game-end banner is still visible behind/around it
- User finishes an online game, clicks "Main Menu", then starts a tutorial → the old game-end banner persists over the tutorial
- User finishes a game, clicks "New Game", picks single-player, picks color → new game starts with stale banner overlay (edge case: banner has `pointer-events: auto` so it intercepts clicks)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When a game ends, the persistent game-end `AnnouncementBanner` (duration=0, type='game-end') must still appear correctly with the winner message and subtitle
- Turn and phase announcements during gameplay must continue to auto-dismiss after the default 2000ms duration
- Calling `AnnouncementBanner.show()` while another announcement is visible must continue to dismiss the previous one before showing the new one
- During an active game, turn and phase announcements must display normally without premature dismissal
- The `AnnouncementBanner.dismiss()` method behavior itself must remain unchanged (clear timer, hide container, clear innerHTML)

**Scope:**
All inputs that do NOT involve navigation away from a completed game should be completely unaffected by this fix. This includes:
- Normal gameplay interactions (placing pieces, moving pieces, removing pieces)
- Turn and phase announcement lifecycle during active games
- Game-end banner initial display when a game ends
- Online multiplayer rematch flow (banner should still be dismissed, but rematch wiring is unchanged)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **No dismiss call in navigation callbacks**: In `main.ts`, the `uiManager.setOnNewGame()` callback calls `LocalStorage.clearGameState()` and `uiManager.showMainMenu()` but never calls `announcementBanner.dismiss()`. The banner instance is in scope but simply never told to hide.

2. **No dismiss call in `startGame()` function**: The `startGame()` function in `main.ts` creates a new `GameController`, sets up the info panel and announcement banner, and starts the game — but never dismisses any existing banner first.

3. **No dismiss call in `startTutorial()` function**: Same pattern — creates new controller, wires banner, starts tutorial, but never dismisses a stale banner.

4. **No dismiss call in `startOnlineMultiplayer()`**: The online multiplayer flow in `onlineMultiplayer.ts` also never dismisses the banner when starting matchmaking.

5. **`AnnouncementBanner.show()` only self-dismisses**: The `show()` method does call `this.dismiss()` first, but this only helps if a new announcement is shown. During navigation to main menu or starting a new game, no new announcement is shown until gameplay begins, leaving the stale game-end banner visible.

The fix is straightforward: add `announcementBanner.dismiss()` calls at the transition points in `main.ts` where the user navigates away from a completed game.

## Correctness Properties

Property 1: Bug Condition - Banner Dismissed on Navigation

_For any_ navigation action where a persistent game-end AnnouncementBanner is visible and the user triggers a new game or main menu transition, the system SHALL dismiss the AnnouncementBanner (hide it and clear its content) before the new game initializes or the main menu renders.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Game-End Banner Still Displays

_For any_ game that reaches a game-over state, the system SHALL continue to display the persistent game-end AnnouncementBanner with the correct winner message and subtitle, preserving the existing game-end announcement behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/src/main.ts`

**Specific Changes**:

1. **`uiManager.setOnNewGame()` callback**: Add `announcementBanner.dismiss()` before `LocalStorage.clearGameState()` and `uiManager.showMainMenu()`. This covers the "New Game" button in the game result dialog.

2. **`startGame()` function**: Add `announcementBanner.dismiss()` at the top of the function, before creating the new `GameController`. This covers all local game mode starts (single-player, local two-player).

3. **`startTutorial()` function**: Add `announcementBanner.dismiss()` at the top of the function, before creating the tutorial controller. This covers tutorial mode start.

4. **`uiManager.setOnGameModeSelected()` callback — `'online-multiplayer'` case**: Add `announcementBanner.dismiss()` before calling `startOnlineMultiplayer()`. This covers online multiplayer start.

All four changes are single-line additions of `announcementBanner.dismiss()` at the appropriate points. The `dismiss()` method is safe to call even when no banner is visible (it's a no-op when the container is already hidden), so there are no side effects.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate the game-end → navigation flow and assert that the AnnouncementBanner is dismissed. Run these tests on the UNFIXED code to observe failures and confirm the bug exists.

**Test Cases**:
1. **New Game after game-end**: End a game, trigger `onNewGame` callback → banner should be dismissed (will fail on unfixed code)
2. **Main Menu after game-end**: End a game, call `showMainMenu` via result dialog → banner should be dismissed (will fail on unfixed code)
3. **Start single-player after game-end**: End a game, call `startGame()` → banner should be dismissed (will fail on unfixed code)
4. **Start tutorial after game-end**: End a game, call `startTutorial()` → banner should be dismissed (will fail on unfixed code)

**Expected Counterexamples**:
- `announcementBanner.container.style.display` is NOT `'none'` after navigation
- `announcementBanner.container.innerHTML` is NOT empty after navigation
- Possible cause: no code path calls `dismiss()` during navigation transitions

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL navigationAction WHERE isBugCondition(navigationAction) DO
  result := executeNavigation_fixed(navigationAction)
  ASSERT announcementBanner.container.style.display === 'none'
  ASSERT announcementBanner.container.innerHTML === ''
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT gameEndBanner_original(input) = gameEndBanner_fixed(input)
  ASSERT turnAnnouncement_original(input) = turnAnnouncement_fixed(input)
  ASSERT phaseAnnouncement_original(input) = phaseAnnouncement_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for game-end announcements and transient announcements, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Game-end banner display preservation**: Verify that when a game ends, the persistent banner still appears with correct message and subtitle
2. **Turn announcement preservation**: Verify that turn announcements during gameplay still auto-dismiss after 2000ms
3. **Phase announcement preservation**: Verify that phase transition announcements still display and auto-dismiss correctly
4. **Show-over-show preservation**: Verify that calling `show()` while another announcement is visible still dismisses the previous one first

### Unit Tests

- Test that `announcementBanner.dismiss()` is called in the `onNewGame` callback
- Test that `announcementBanner.dismiss()` is called at the start of `startGame()`
- Test that `announcementBanner.dismiss()` is called at the start of `startTutorial()`
- Test that `announcementBanner.dismiss()` is called before `startOnlineMultiplayer()`
- Test that `dismiss()` is safe to call when no banner is visible (no-op)

### Property-Based Tests

- Generate random sequences of game-end → navigation actions and verify the banner is always dismissed before the new context begins
- Generate random game states and verify that game-end banner display is preserved (still shows correct message)
- Generate random announcement types (turn, phase, game-end) and verify transient announcements still auto-dismiss correctly

### Integration Tests

- Test full flow: start game → play to completion → game-end banner appears → click "New Game" → banner dismissed → new game starts clean
- Test full flow: start game → play to completion → game-end banner appears → click "Main Menu" → banner dismissed → menu appears clean
- Test that starting a tutorial after a completed game shows no stale banner
- Test that starting online multiplayer after a completed game shows no stale banner
