# Bugfix Requirements Document

## Introduction

Six bugs were discovered during manual testing of the Nine Men's Morris game after Task 34 completion. These bugs span multiple game modes (online multiplayer, local two-player, and single-player) and affect UI layout, game result display, piece removal highlighting, navigation, and AI functionality. Together they significantly degrade the user experience across all game modes.

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — Online Mode InfoPanel (Layout & Initial Content)**

1.1 WHEN an online multiplayer game starts THEN the InfoPanel displays as a tiny box with no text content until the first move is made, because `InfoPanel.update()` is only called during the game loop render and no initial content is set on creation.

1.2 WHEN the InfoPanel updates each turn in online mode THEN the panel visually resizes to fit the new content, because the `.info-panel` CSS class has no fixed width or height constraints, causing layout shift every turn.

**Bug 2 — Online Mode ChatPanel (Layout & Overflow)**

1.3 WHEN the ChatPanel is displayed in online mode THEN the Send button overflows outside the chat box boundary, because `.chat-send-button` has `min-width: 60px` which combined with the input field exceeds the container width in the narrow grid column (`minmax(200px, 280px)`).

1.4 WHEN messages are sent in the ChatPanel THEN the entire chat panel grows taller with each message instead of staying a fixed size with scrollable content, because the `.chat-panel` has `max-height: 500px` but no fixed height, and the messages container lacks a constrained height with overflow scrolling.

**Bug 3 — Online Mode Win/Lose Display**

1.5 WHEN an online multiplayer game ends THEN the game result dialog shows a concatenated raw message like "Black Wins!Black player has won the game!" instead of mode-appropriate messages like "You Won!" or "You Lost!", because `UIManager.showGameResult()` constructs its own color-based title and message without using the mode-aware `deriveGameEndMessage()` function from InfoPanel.ts.

**Bug 4 — Local Two-Player Mode Piece Removal Highlighting**

1.6 WHEN a mill is formed in local two-player mode THEN no highlighting appears on eligible opponent pieces for removal, even though `handleMillFormed()` calls `highlightValidMoves()` with removable pieces — the highlights are cleared or not rendered before the player can see them.

**Bug 5 — Local Two-Player Mode No Return to Main Menu**

1.7 WHEN a local two-player game ends THEN there is no dialog or button allowing the player to return to the main menu, because `endGame()` in GameController only shows an AnnouncementBanner overlay but does not trigger `UIManager.showGameResult()` which contains the "Main Menu" and "New Game" buttons.

**Bug 6 — Single Player Mode AI Broken**

1.8 WHEN the human player makes their first move in single-player mode THEN the AI opponent never responds and the game freezes on the AI's turn, because `getAIMoveFromBackend()` makes a fetch to `/api/game/ai-move` which either fails silently (no backend endpoint, network error, or incorrect request/response format) and the error is caught but no recovery action is taken — the game remains stuck with input disabled.

### Expected Behavior (Correct)

**Bug 1 — Online Mode InfoPanel**

2.1 WHEN an online multiplayer game starts THEN the InfoPanel SHALL display initial game information immediately (current turn, phase, player color, and action instruction) without requiring a move to be made first.

2.2 WHEN the InfoPanel updates each turn in online mode THEN the InfoPanel SHALL maintain a fixed size (consistent width and height) that does not resize or shift layout between updates.

**Bug 2 — Online Mode ChatPanel**

2.3 WHEN the ChatPanel is displayed in online mode THEN all elements (input field, Send button, header, messages area) SHALL fit entirely within the chat panel boundaries without any overflow or clipping.

2.4 WHEN messages are sent in the ChatPanel THEN the chat panel SHALL maintain a fixed overall size and the messages area SHALL scroll vertically to show new messages instead of the panel growing taller.

**Bug 3 — Online Mode Win/Lose Display**

2.5 WHEN an online multiplayer game ends THEN the game result dialog SHALL display "You Won!" when the local player wins and "You Lost!" when the local player loses, using mode-aware messaging consistent with the `deriveGameEndMessage()` function.

**Bug 4 — Local Two-Player Mode Piece Removal Highlighting**

2.6 WHEN a mill is formed in local two-player mode THEN the system SHALL highlight all eligible opponent pieces for removal with the standard green highlight, and the highlights SHALL remain visible until the player selects a piece to remove.

**Bug 5 — Local Two-Player Mode Return to Main Menu**

2.7 WHEN a local two-player game ends THEN the system SHALL display a game result dialog with "New Game" and "Main Menu" buttons, allowing the player to start a new game or return to the main menu.

**Bug 6 — Single Player Mode AI Recovery**

2.8 WHEN the AI fails to return a valid move in single-player mode THEN the system SHALL recover gracefully by re-enabling player input, displaying an error message or retrying the AI move, so the game does not become permanently stuck.

### Unchanged Behavior (Regression Prevention)

**InfoPanel**

3.1 WHEN the InfoPanel updates during any game mode THEN the system SHALL CONTINUE TO display the correct current turn, phase, piece counts, and action instructions.

3.2 WHEN the InfoPanel is used in tutorial mode THEN the system SHALL CONTINUE TO function correctly with tutorial-specific content.

**ChatPanel**

3.3 WHEN the ChatPanel is collapsed or muted THEN the system SHALL CONTINUE TO track unread messages and show notification badges correctly.

3.4 WHEN the ChatPanel receives messages while expanded THEN the system SHALL CONTINUE TO auto-scroll to the latest message.

**Game Result Display**

3.5 WHEN a local two-player game ends THEN the system SHALL CONTINUE TO display color-based messages like "White Wins!" or "Black Wins!" (not "You Won/Lost").

3.6 WHEN a game ends in tutorial mode THEN the system SHALL CONTINUE TO handle game completion through the tutorial flow without showing the result dialog.

**Piece Removal**

3.7 WHEN a mill is formed in online multiplayer mode THEN the system SHALL CONTINUE TO highlight removable pieces correctly.

3.8 WHEN a mill is formed in single-player mode THEN the system SHALL CONTINUE TO highlight removable pieces correctly.

3.9 WHEN all opponent pieces are in mills THEN the system SHALL CONTINUE TO allow removal of any opponent piece.

**Game Navigation**

3.10 WHEN an online multiplayer game ends THEN the system SHALL CONTINUE TO show the "Play Again" (rematch) button alongside "New Game" and "Main Menu".

3.11 WHEN a single-player game ends THEN the system SHALL CONTINUE TO show the game-end announcement banner.

**AI Behavior**

3.12 WHEN the AI successfully computes a move THEN the system SHALL CONTINUE TO apply the move correctly and switch turns.

3.13 WHEN it is the player's turn in single-player mode THEN the system SHALL CONTINUE TO accept player input normally.
