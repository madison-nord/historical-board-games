# Requirements Document

## Introduction

The Nine Men's Morris game currently renders all game status information (player color, current turn, phase, pieces remaining) directly on the canvas using a small 16px font. This text is hard to read, gets clipped when extra rows are shown in online mode, and provides no prominent announcements for key game events like turn changes, phase transitions, or game end. Additionally, the chat panel in online mode overlays the board, obstructing gameplay. This feature enhances the game's status display and player communication across all game modes (online multiplayer, local two-player, single-player) by moving game info to an HTML panel, adding prominent announcements, contextual action instructions, and repositioning the chat panel so it does not cover the board.

## Glossary

- **Info_Panel**: An HTML element rendered outside the canvas that persistently displays game state information such as player color, current turn, game phase, and pieces remaining.
- **Announcement_Banner**: A prominent, temporarily visible HTML overlay element that displays key game event messages (turn changes, phase transitions, game end) with auto-dismiss behavior.
- **Action_Instruction**: A persistent text element within the Info_Panel that tells the current player what action to perform next (e.g., "Place a piece", "Select a piece to move", "Remove an opponent's piece").
- **Chat_Panel**: The HTML element that provides in-game text chat between players during online multiplayer games.
- **Game_Controller**: The TypeScript class (GameController) that orchestrates game logic, state transitions, and user interactions across all game modes.
- **Board_Renderer**: The TypeScript class (BoardRenderer) that handles visual rendering of the game board on the HTML5 Canvas.
- **Phase_Transition**: A change in the game phase from PLACEMENT to MOVEMENT, or from MOVEMENT to FLYING.
- **Game_Mode**: One of three supported play modes: online multiplayer, local two-player, or single-player (vs AI).

## Requirements

### Requirement 1: HTML Info Panel for Game State Display

**User Story:** As a player, I want to see game state information in a readable HTML panel outside the canvas, so that I can easily understand the current game situation without squinting at small canvas text.

#### Acceptance Criteria

1. THE Info_Panel SHALL display the current turn indicator showing which player (White or Black) is active.
2. THE Info_Panel SHALL display the current game phase (Placement, Movement, or Flying).
3. THE Info_Panel SHALL display the number of pieces remaining to be placed for each player during the Placement phase.
4. WHEN the Game_Mode is online multiplayer, THE Info_Panel SHALL display the local player's assigned color (e.g., "You are: White").
5. THE Info_Panel SHALL be rendered as an HTML element positioned adjacent to the canvas, not drawn on the canvas itself.
6. WHEN the game state changes, THE Info_Panel SHALL update its content within the same rendering frame.
7. THE Board_Renderer SHALL stop rendering game info text on the canvas when the Info_Panel is active.
8. THE Info_Panel SHALL be readable at all supported viewport sizes without being clipped or overlapping the canvas.

### Requirement 2: Turn Change Announcements

**User Story:** As a player, I want a prominent announcement when the turn changes, so that I clearly know when it is my turn or my opponent's turn.

#### Acceptance Criteria

1. WHEN the active turn switches to the local player, THE Announcement_Banner SHALL display "Your Turn" in all Game_Modes.
2. WHEN the active turn switches to the opponent, THE Announcement_Banner SHALL display "Opponent's Turn" in single-player and online multiplayer modes.
3. WHEN the active turn switches to the other local player in local two-player mode, THE Announcement_Banner SHALL display "[Color]'s Turn" (e.g., "Black's Turn").
4. THE Announcement_Banner SHALL appear prominently over the game area without blocking board interaction for longer than 2 seconds.
5. THE Announcement_Banner SHALL auto-dismiss after a duration between 1.5 and 2.5 seconds.

### Requirement 3: Phase Transition Announcements

**User Story:** As a player, I want to be notified when the game phase changes, so that I understand the new rules that apply to my moves.

#### Acceptance Criteria

1. WHEN a Phase_Transition from PLACEMENT to MOVEMENT occurs, THE Announcement_Banner SHALL display a message indicating the Movement phase has begun (e.g., "Movement Phase — Move pieces to adjacent positions").
2. WHEN a Phase_Transition from MOVEMENT to FLYING occurs, THE Announcement_Banner SHALL display a message indicating the Flying phase has begun and that the player can move to any empty position (e.g., "Flying Phase — You can move to any empty position").
3. THE Announcement_Banner for phase transitions SHALL appear in all three Game_Modes.
4. WHEN a phase transition announcement and a turn change announcement occur simultaneously, THE Announcement_Banner SHALL display the phase transition message, as it carries more informational value.

### Requirement 4: Contextual Action Instructions

**User Story:** As a player, I want a persistent instruction telling me what to do next, so that I always know what action is expected of me.

#### Acceptance Criteria

1. WHILE the game is in the PLACEMENT phase and it is the current player's turn, THE Info_Panel SHALL display the Action_Instruction "Place a piece on an empty position".
2. WHILE the game is in the MOVEMENT or FLYING phase and no piece is selected, THE Info_Panel SHALL display the Action_Instruction "Select a piece to move".
3. WHILE the game is in the MOVEMENT or FLYING phase and a piece is selected, THE Info_Panel SHALL display the Action_Instruction "Select a destination for your piece".
4. WHILE a mill has been formed and the current player must remove an opponent's piece, THE Info_Panel SHALL display the Action_Instruction "Remove an opponent's piece".
5. WHILE it is the opponent's turn in single-player or online multiplayer mode, THE Info_Panel SHALL display the Action_Instruction "Waiting for opponent...".
6. THE Action_Instruction SHALL update immediately when the game state changes.

### Requirement 5: Game End Announcement

**User Story:** As a player, I want a prominent winner announcement when the game ends, so that I clearly see who won and why — and in online or single-player modes, I want to know whether I personally won or lost.

#### Acceptance Criteria

1. WHEN the game ends in local two-player mode, THE Announcement_Banner SHALL display the winner by color (e.g., "White Wins!").
2. WHEN the game ends, THE Announcement_Banner SHALL display the reason for the win (e.g., "Black has fewer than 3 pieces" or "Black has no legal moves").
3. WHEN the game ends in online multiplayer mode due to opponent disconnection, THE Announcement_Banner SHALL display a message indicating the win was by disconnection (e.g., "You Win — Opponent disconnected").
4. THE Announcement_Banner for game end SHALL remain visible until the player dismisses it or navigates away.
5. THE Announcement_Banner for game end SHALL appear in all three Game_Modes.
6. WHEN the game ends in online multiplayer mode, THE Announcement_Banner SHALL display "You Won!" if the local player's color matches the winner, or "You Lost!" if it does not.
7. WHEN the game ends in single-player mode, THE Announcement_Banner SHALL display "You Won!" if the human player won, or "You Lost!" if the AI won.

### Requirement 6: Chat Panel Repositioning

**User Story:** As a player in an online game, I want the chat panel to not cover the game board, so that I can chat and play without obstruction.

#### Acceptance Criteria

1. THE Chat_Panel SHALL be rendered as a side panel adjacent to the game board on viewports wider than 768 pixels, positioned so it does not overlap the canvas.
2. WHEN the viewport width is 768 pixels or narrower, THE Chat_Panel SHALL be rendered in a collapsed state by default, expandable via a toggle button.
3. THE Chat_Panel SHALL provide a visible toggle button to collapse and expand the panel in all viewport sizes.
4. WHILE the Chat_Panel is collapsed, THE Chat_Panel SHALL display only the toggle button and not obstruct any part of the game board.
5. WHEN a new chat message arrives while the Chat_Panel is collapsed, THE Chat_Panel SHALL display a visual notification indicator on the toggle button.

### Requirement 7: Regression Safety

**User Story:** As a developer, I want the new status display features to not break existing functionality, so that WebSocket sync, chat delivery, disconnect handling, tutorial mode, and game result dialogs continue working correctly.

#### Acceptance Criteria

1. THE Game_Controller SHALL continue to synchronize game state over WebSocket in online multiplayer mode after the Info_Panel and Announcement_Banner are integrated.
2. THE Chat_Panel SHALL continue to deliver messages between players after being repositioned.
3. THE Game_Controller SHALL continue to handle player disconnection and reconnection correctly after the display changes.
4. WHILE the game is in tutorial mode, THE Announcement_Banner SHALL not interfere with tutorial step instructions or tutorial panel display.
5. THE existing game result dialog (shown by UIManager) SHALL continue to function correctly alongside the new game end Announcement_Banner.
