# Bugfix Requirements Document

## Introduction

When a game ends, `GameController.endGame()` displays an `AnnouncementBanner` overlay with `duration: 0` (persistent, game-end type). This banner remains visible in the DOM even after the user returns to the main menu and starts a new game in any mode. The stale "Black Wins! Reduced to fewer than 3 pieces" (or similar) message covers the new game because nothing in the new-game or main-menu flow calls `announcementBanner.dismiss()`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a game ends and the user clicks "New Game" or "Main Menu" to start a different game mode THEN the system continues to display the previous game's AnnouncementBanner overlay on top of the new game

1.2 WHEN a game ends with a persistent game-end banner and the user navigates back to the main menu THEN the system does not dismiss or remove the AnnouncementBanner from the DOM

1.3 WHEN a new game is started via `startGame()` in any mode (single-player, local two-player, online, tutorial) THEN the system does not clear any previously displayed AnnouncementBanner before beginning the new game

### Expected Behavior (Correct)

2.1 WHEN a game ends and the user clicks "New Game" or "Main Menu" to start a different game mode THEN the system SHALL dismiss the AnnouncementBanner before showing the main menu or starting the new game

2.2 WHEN the user navigates back to the main menu from a completed game THEN the system SHALL dismiss any visible AnnouncementBanner so the menu is unobstructed

2.3 WHEN a new game is started via `startGame()` in any mode THEN the system SHALL dismiss any previously displayed AnnouncementBanner before initializing the new game state

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a game ends THEN the system SHALL CONTINUE TO display the persistent game-end AnnouncementBanner with the correct winner message and subtitle

3.2 WHEN a turn or phase announcement is shown during gameplay THEN the system SHALL CONTINUE TO auto-dismiss it after the default 2000ms duration

3.3 WHEN `AnnouncementBanner.show()` is called while another announcement is already visible THEN the system SHALL CONTINUE TO dismiss the previous announcement before showing the new one

3.4 WHEN a game is in progress and no game-end has occurred THEN the system SHALL CONTINUE TO display turn and phase announcements normally without premature dismissal
