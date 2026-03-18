---
title: Frontend-Backend Integration Requirements
inclusion: always
---

# Frontend-Backend Integration Requirements

## Root Cause Analysis: Missing AI REST Endpoint

### What Happened

The single-player AI was supposed to use the backend's minimax algorithm (`AIService.selectMove()`) via a REST call from the frontend. Instead, every AI turn hit `POST /api/game/ai-move` which returned 404, and the game silently fell back to random moves. The user played dozens of games against a "dumb" AI without realizing the real AI was never being used.

### Gap 1: Spec Never Created the REST Endpoint

Task 18.1 says: "Call backend API to get AI move." But no task in the entire spec creates that endpoint. Task 10.1 creates `GameService.getAIMove(gameId)` which only works for games registered in `activeGames` — online multiplayer games managed by the backend. Single-player games are frontend-only and never register with `GameService`, so `getAIMove(gameId)` is unreachable.

The spec assumed the backend API existed but never specified creating it. This is a classic integration gap: the frontend task references an API that no backend task produces.

### Gap 2: Design Doc Lacks Integration Contract

The design document describes `AIService` and `GameController` (frontend) independently. It never specifies how the frontend communicates with `AIService` for single-player games. The architecture diagram shows "REST Controllers (Static Content, Game API, Info Pages)" but never defines what "Game API" includes for single-player AI.

### Gap 3: Initial Fix Attempt Removed Functionality

When first asked to fix the 404 error, the agent removed `getAIMoveFromBackend()` entirely and made `handleAIMove()` use only a local random fallback. This "fixed" the error by downgrading the AI from minimax to random — making the problem worse, not better.

### The Correct Fix

Created `AIRestController.java` with `POST /api/game/ai-move` that accepts raw board state JSON, reconstructs a backend `GameState` via `GameState.fromBoardData()`, runs `AIService.selectMove()`, and returns the best move. The frontend sends the current board state directly — no need for the game to be registered in `activeGames`.

## Prevention Rules

### Rule 1: Every Frontend API Call Must Have a Backend Endpoint

When a task says "call backend API" or "fetch from backend", verify:
- Does the endpoint exist in a backend controller?
- If not, create a task to implement it BEFORE the frontend task
- Check that request/response DTOs exist and match what the frontend sends

### Rule 2: Never Remove Functionality to Fix a Bug

When a feature produces errors:
- Implement the missing piece (endpoint, handler, service method)
- Never delete the calling code to silence the error
- Never downgrade behavior (e.g., replacing minimax with random)
- The fix should make the feature work as designed, not remove it

### Rule 3: Trace Integration Points End-to-End

Before marking any integration task complete:
- Trace the data flow from UI click → frontend method → HTTP/WS call → backend controller → service → engine → response → frontend handler → UI update
- Verify every link in the chain exists and works
- Test with actual HTTP calls, not just mocked responses

### Rule 4: Single-Player and Online Must Both Have Backend Access

Single-player games are frontend-managed but still need backend services (AI, validation). Design APIs that accept raw game state, not just game IDs from `activeGames`. This means:
- REST endpoints for stateless operations (AI move computation)
- WebSocket for stateful operations (online game sessions)
- Both patterns should coexist

### Rule 5: Spec Tasks Must Be Symmetric

For every frontend task that calls a backend API:
- There must be a corresponding backend task that creates that API
- The tasks should reference each other
- Integration tests should verify the contract between them
