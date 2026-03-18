---
title: Frontend-Backend Integration Requirements
inclusion: always
---

# Frontend-Backend Integration Rules

## Rule 1: Every Frontend API Call Must Have a Backend Endpoint
When a task says "call backend API", verify the endpoint exists in a backend controller. If not, create a task to implement it BEFORE the frontend task. Check that request/response DTOs match.

## Rule 2: Never Remove Functionality to Fix a Bug
When a feature produces errors, implement the missing piece. Never delete calling code to silence errors. Never downgrade behavior (e.g., replacing minimax with random).

## Rule 3: Trace Integration Points End-to-End
Before marking integration tasks complete, trace: UI click → frontend method → HTTP/WS call → backend controller → service → engine → response → frontend handler → UI update. Test with actual calls, not just mocks.

## Rule 4: Single-Player and Online Must Both Have Backend Access
Design APIs that accept raw game state, not just game IDs from `activeGames`. REST for stateless ops (AI), WebSocket for stateful ops (online games).

## Rule 5: Spec Tasks Must Be Symmetric
For every frontend task calling a backend API, there must be a corresponding backend task creating that API. Integration tests should verify the contract.
