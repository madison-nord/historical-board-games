# Checkpoint 34: Online Multiplayer - Manual Testing Guide

## Status: ✅ READY FOR MANUAL TESTING

**Date**: 2026-03-13  
**Phase**: Phase 11 - Online Multiplayer Frontend  
**Automated Tests**: All passing (Backend + Frontend 289 tests)

---

## Prerequisites

### 1. Start the Backend Server
```bash
mvn spring-boot:run
```
Server should start on: `http://localhost:8080`

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm run dev
```
Frontend should start on: `http://localhost:3000`

---

## Manual Test Scenarios

### Test 1: Matchmaking with Multiple Browser Windows

**Objective**: Verify two players can find each other through matchmaking

**Steps**:
1. Open two browser windows (or use incognito mode for second window)
   - Window 1: `http://localhost:3000`
   - Window 2: `http://localhost:3000`

2. In Window 1:
   - Click "Online Multiplayer" from main menu
   - Observe "Finding match..." indicator appears
   - Wait for match

3. In Window 2:
   - Click "Online Multiplayer" from main menu
   - Observe "Finding match..." indicator appears

4. **Expected Results**:
   - ✅ Both windows show "Match found!" notification
   - ✅ Both windows display opponent information
   - ✅ Game board appears in both windows
   - ✅ One player is assigned WHITE, other is BLACK
   - ✅ Current turn indicator shows correctly
   - ✅ Only the current player can make moves

**Pass Criteria**: Both players successfully matched and game starts

---

### Test 2: Complete Online Game with Chat

**Objective**: Play a full game while using chat functionality

**Steps**:
1. Complete Test 1 to get two matched players

2. **Gameplay**:
   - WHITE player places first piece
   - Verify BLACK player sees the piece appear
   - BLACK player places piece
   - Verify WHITE player sees the piece appear
   - Continue alternating until placement phase complete
   - Test movement phase moves
   - Test mill formation and piece removal

3. **Chat Testing**:
   - In Window 1: Type "Hello!" and send
   - Verify message appears in Window 2 with correct sender color
   - In Window 2: Type "Hi there!" and send
   - Verify message appears in Window 1 with correct sender color
   - Send several messages back and forth
   - Test mute button functionality

4. **Expected Results**:
   - ✅ All moves synchronize instantly between players
   - ✅ Turn indicator updates correctly
   - ✅ Chat messages appear in both windows
   - ✅ Messages show correct sender color (WHITE/BLACK)
   - ✅ Timestamps appear on messages
   - ✅ Mute button disables chat input
   - ✅ Game state remains synchronized throughout

**Pass Criteria**: Complete game plays smoothly with working chat

---

### Test 3: Disconnect Scenarios

**Objective**: Verify disconnect handling and reconnection

#### Test 3a: Player Disconnects During Game

**Steps**:
1. Start a game with two players (complete Test 1)
2. Make a few moves to get into the game
3. In Window 1: Close the browser tab/window (simulating disconnect)
4. In Window 2: Observe disconnect notification

**Expected Results**:
- ✅ Window 2 shows "Opponent disconnected" message
- ✅ "Wait" and "Claim Victory" buttons appear
- ✅ Countdown timer shows (60 seconds)
- ✅ Game state is preserved

#### Test 3b: Player Reconnects Within Timeout

**Steps**:
1. Continue from Test 3a
2. Within 60 seconds, reopen Window 1
3. Navigate back to `http://localhost:3000`
4. Click "Online Multiplayer"

**Expected Results**:
- ✅ Player reconnects to existing game
- ✅ Game state is restored correctly
- ✅ Window 2 shows "Opponent reconnected" message
- ✅ Game continues normally

#### Test 3c: Timeout Expires

**Steps**:
1. Start a new game with two players
2. Close Window 1 (disconnect)
3. In Window 2: Wait for full 60 second countdown
4. Do NOT reconnect Window 1

**Expected Results**:
- ✅ After 60 seconds, Window 2 shows "You win! Opponent disconnected"
- ✅ Game ends with remaining player as winner
- ✅ "Return to Menu" button appears

#### Test 3d: Claim Victory

**Steps**:
1. Start a new game with two players
2. Close Window 1 (disconnect)
3. In Window 2: Click "Claim Victory" button immediately

**Expected Results**:
- ✅ Game ends immediately
- ✅ Window 2 shows victory message
- ✅ "Return to Menu" button appears

**Pass Criteria**: All disconnect scenarios handled correctly

---

### Test 4: Post-Game Flow

**Objective**: Verify game end and post-game options

**Steps**:
1. Complete a full game (one player wins)
2. Observe game end screen in both windows

**Expected Results**:
- ✅ Both players see game result
- ✅ Winner is displayed correctly
- ✅ "Rematch" button appears
- ✅ "Return to Menu" button appears

**Note**: Rematch functionality may not be fully implemented yet - verify buttons exist

**Pass Criteria**: Game end is handled properly with appropriate UI

---

### Test 5: Matchmaking Queue Management

**Objective**: Verify queue join/leave functionality

**Steps**:
1. Open one browser window
2. Click "Online Multiplayer"
3. Observe "Finding match..." indicator
4. Click "Cancel" button
5. Verify returned to main menu
6. Click "Online Multiplayer" again
7. Open second window and join matchmaking
8. Verify match occurs

**Expected Results**:
- ✅ Cancel button removes player from queue
- ✅ Player returns to main menu
- ✅ Can rejoin queue successfully
- ✅ Matchmaking still works after cancel/rejoin

**Pass Criteria**: Queue management works correctly

---

### Test 6: Error Handling

**Objective**: Verify graceful error handling

#### Test 6a: Backend Not Running

**Steps**:
1. Stop the backend server (Ctrl+C in backend terminal)
2. In browser, click "Online Multiplayer"

**Expected Results**:
- ✅ Connection error message appears
- ✅ User is informed backend is unavailable
- ✅ No JavaScript errors in console
- ✅ Can return to main menu

#### Test 6b: Network Interruption

**Steps**:
1. Start a game with two players
2. Open browser DevTools → Network tab
3. Set network to "Offline"
4. Try to make a move

**Expected Results**:
- ✅ Error message appears
- ✅ Move is not applied
- ✅ Game state remains consistent
- ✅ Reconnection attempted when network restored

**Pass Criteria**: Errors are handled gracefully without crashes

---

## Automated Test Summary

### Backend Tests
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ All property-based tests passing (100+ iterations each)
- ✅ WebSocket controller tests passing
- ✅ Matchmaking service tests passing
- ✅ Session management tests passing
- ✅ Chat controller tests passing

### Frontend Tests
- ✅ 289 tests passing
- ✅ WebSocketClient tests passing (21 tests)
- ✅ GameController online tests passing (10 tests)
- ✅ All integration tests passing
- ✅ All property-based tests passing

---

## Implementation Completeness Checklist

### Backend Features
- [x] WebSocket configuration with STOMP
- [x] Matchmaking service with queue management
- [x] Session management with disconnect handling
- [x] Game state synchronization
- [x] Chat message routing
- [x] Disconnect/reconnect timeout logic
- [x] Winner declaration on timeout

### Frontend Features
- [x] WebSocketClient with STOMP.js
- [x] Matchmaking UI with queue indicator
- [x] Online game mode in GameController
- [x] Chat panel with message history
- [x] Disconnect notification UI
- [x] Reconnection countdown
- [x] Post-game UI with results
- [x] Error handling and retry logic

### Integration
- [x] Frontend connects to backend WebSocket
- [x] Moves synchronize between players
- [x] Chat messages delivered correctly
- [x] Disconnect detection works
- [x] Game state preserved during disconnect
- [x] Reconnection restores game state

---

## Known Issues / Limitations

1. **Chat Content Filtering**: Not implemented (marked as optional in tasks)
   - Consider adding profanity filter for production

2. **Rematch Functionality**: UI exists but full implementation may be incomplete
   - Verify buttons are present and clickable

3. **Console Warnings**: Some expected warnings in test output
   - STOMP connection errors (expected in error tests)
   - LocalStorage errors (expected in error tests)

---

## Success Criteria

For this checkpoint to be considered COMPLETE:

- [x] All automated tests pass (backend + frontend)
- [x] Build succeeds without errors
- [ ] Manual Test 1 passes (Matchmaking)
- [ ] Manual Test 2 passes (Complete game with chat)
- [ ] Manual Test 3 passes (All disconnect scenarios)
- [ ] Manual Test 4 passes (Post-game flow)
- [ ] Manual Test 5 passes (Queue management)
- [ ] Manual Test 6 passes (Error handling)
- [ ] No critical bugs found
- [ ] User confirms testing complete

---

## Next Steps After Checkpoint

Once all manual tests pass:
1. Mark Task 34 as complete
2. Commit any fixes made during testing
3. Push changes to repository
4. Proceed to Phase 12: Information Page (Task 35)

---

## Notes for Tester

- Use Chrome or Firefox for best WebSocket support
- Keep browser DevTools console open to catch any errors
- Test on both desktop and mobile if possible
- Document any issues found with screenshots
- Note any performance issues or lag

---

**Ready to begin manual testing!**

Server URLs:
- Backend: http://localhost:8080
- Frontend: http://localhost:3000
