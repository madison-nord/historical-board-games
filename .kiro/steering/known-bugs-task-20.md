# Known Bugs - Task 20 (Local Gameplay)

**Status**: Code fixes implemented, manual testing in progress

## Fixed Bugs (2026-02-19)

### ✅ Bug 1: Movement Phase Unresponsive - FIXED
**Severity**: CRITICAL
**Description**: When the game transitions to MOVEMENT phase, clicking on pieces no longer works. The game becomes completely unresponsive.
**Root Causes**:
1. The `switchPlayer()` method wasn't checking for `millFormed` flag when re-enabling input
2. Player text not updating after piece removal because `updateDisplay()` was called before `switchPlayer()`
3. `hasLegalMoves()` was returning false when phase is PLACEMENT and pieces remaining is 0, causing `checkGameEnd()` to incorrectly end the game

**Fixes Applied**:
1. Updated `switchPlayer()` to check `!this.currentGameState.millFormed` before enabling input
2. Reordered operations in `removePiece()` to call `switchPlayer()` BEFORE `updateDisplay()`
3. Fixed `hasLegalMoves()` to fall through to movement check when in PLACEMENT phase with 0 pieces remaining

**Location**: `frontend/src/controllers/GameController.ts` - `switchPlayer()`, `removePiece()`, and `hasLegalMoves()` methods
**Status**: Fixed and verified in browser - phase transitions correctly, pieces are clickable
**Build**: `index-JWLC9ekV.js` deployed

### ✅ Bug 2: Piece Removal After Mill Not Working - FIXED
**Severity**: CRITICAL
**Description**: When a mill is formed, removable opponent pieces are highlighted correctly, but clicking them does not remove the piece from the board. However, the piece counter still decrements.
**Root Cause**: The order of operations was wrong. The removal animation was started BEFORE updating the board state and calling `updateDisplay()`. This caused:
1. Animation starts (captures piece color/position)
2. Board state updated (piece removed from array)
3. `updateDisplay()` called → `render()` → `drawPieces()` draws board WITHOUT piece
4. `renderAnimations()` draws the RemovalAnimation which RE-DRAWS the piece with fade effect
5. Result: Piece appears to stay on board even though it's removed from state

**Fix**: Reordered operations in `removePiece()`:
1. Update board state FIRST (remove piece from array)
2. Call `updateDisplay()` to render board WITHOUT the piece
3. THEN start removal animation which draws the fading piece OVER the updated board
4. When animation completes, piece is already gone from board state

This ensures the piece is removed from the board immediately, and the animation just shows a visual fade-out effect on top.

**Location**: `frontend/src/controllers/GameController.ts` - `removePiece()` method
**Status**: Fixed and verified with TDD tests (4 tests passing)
**Build**: `index-BMkc-4D8.js` deployed

### ✅ Bug 3: Text Overlaps Board - CODE FIXED
**Severity**: HIGH
**Description**: Game information text (current player, phase, remaining pieces) renders inside the board area and becomes unreadable
**Root Cause**: The `drawGameInfo()` method was positioning text at `yOffset = padding` (20px from top), which overlaps the board.
**Fix**: Changed text positioning to `yOffset = this.boardSize + padding` to place text BELOW the board instead of overlapping it.
**Location**: `frontend/src/rendering/BoardRenderer.ts` - `drawGameInfo()` method
**Status**: Code fixed, needs manual verification

### ✅ Bug 4: Deprecated API Warning - FIXED
**Severity**: LOW
**Description**: Using deprecated `substr()` method in `generateGameId()`
**Fix**: Replaced `substr(2, 9)` with `substring(2, 11)` to use the modern API.
**Location**: `frontend/src/controllers/GameController.ts` - `generateGameId()` method
**Status**: Fixed and verified

### ✅ Bug 5: Incorrect Board Layout - FIXED
**Severity**: CRITICAL
**Description**: Backend and frontend were using incorrect Nine Men's Morris board layout (9+9+6 positions instead of standard 8+8+8)
**Root Cause**: Implementation didn't follow STANDARD Nine Men's Morris rules
**Fix**: Updated entire stack to use STANDARD layout:
- Backend `Board.java`: Fixed adjacency map and mill patterns (16 mills: 6 horizontal + 6 vertical edges + 4 radial)
- Frontend `BoardRenderer.ts`: Fixed position initialization to 8+8+8 layout
- Frontend `GameController.ts`: Fixed adjacency map and mill patterns to match backend
- Created steering file documenting STANDARD layout
**Location**: Multiple files across backend and frontend
**Status**: Fixed and verified with tests

## Testing Status

- ✅ All backend tests pass (80 tests)
- ✅ All frontend tests pass (93 tests including 3 new removal bug tests)
- ✅ Frontend builds successfully (latest: `index-BJf6-WIW.js`)
- ✅ Backend starts without errors
- ⏳ Manual gameplay testing IN PROGRESS

## Manual Testing Checklist

**Server running at**: http://localhost:8080

Test the following scenarios:

1. **Text Display**:
   - [ ] Game info text is visible and readable
   - [ ] Text appears BELOW the board, not overlapping it
   - [ ] Text updates correctly as game progresses

2. **Placement Phase**:
   - [ ] Both players can place all 9 pieces
   - [ ] Pieces appear at correct positions
   - [ ] Turn alternates between WHITE and BLACK

3. **Mill Formation and Removal**:
   - [ ] When a mill is formed, opponent pieces are highlighted
   - [ ] Clicking a highlighted piece removes it from the board
   - [ ] Piece counter decrements correctly
   - [ ] Removed piece disappears visually

4. **Movement Phase**:
   - [ ] After all pieces placed, game transitions to MOVEMENT phase
   - [ ] Pieces are clickable and selectable
   - [ ] Valid moves are highlighted
   - [ ] Pieces move to adjacent positions correctly
   - [ ] Game remains responsive throughout

5. **Flying Phase**:
   - [ ] When player has 3 pieces, can move to any empty position
   - [ ] Flying phase works correctly

6. **Win Conditions**:
   - [ ] Game ends when player has fewer than 3 pieces
   - [ ] Game ends when player has no legal moves
   - [ ] Winner is displayed correctly

## Next Steps

1. Open browser to http://localhost:8080
2. Test local two-player mode thoroughly
3. Verify all bugs are fixed
4. Test single-player mode with AI
5. Mark task 20 as complete if all tests pass

## Lessons Learned

1. **Always test end-to-end before marking tasks complete** - Unit tests passing doesn't mean the integration works
2. **Visual bugs require visual testing** - Text overlap only visible when actually viewing the game
3. **State management is critical** - Input enabling/disabling must account for all game states (millFormed, isAiThinking, etc.)
4. **Display updates must happen at the right time** - Updating display before animations ensures visual consistency
5. **NEVER match incorrect implementations** - Always fix to standard rules, not work around bugs
6. **Fix the entire stack** - Backend through frontend must all follow the same correct rules

## Technical Notes

- The board position layout (0-7 outer, 8-15 middle, 16-23 inner) is CORRECT and matches STANDARD Nine Men's Morris
- The fixes maintain backward compatibility with all existing tests
- No breaking changes to the API or data structures
- All 16 mill patterns are correctly implemented across backend and frontend
- Adjacency maps match exactly between Board.java and GameController.ts
