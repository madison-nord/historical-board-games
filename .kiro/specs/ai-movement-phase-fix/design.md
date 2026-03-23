# AI Movement Phase Fix — Bugfix Design

## Overview

The AI plays competently during placement but degrades severely in movement/flying phases — oscillating pieces aimlessly, missing obvious mill completions, and failing to plan multi-move sequences. Nine interrelated root causes have been identified spanning the search algorithm, evaluation function, move ordering, caching, and dependency injection. The fix strategy is to address all nine causes as a cohesive unit: introduce iterative deepening with phase-aware transposition hashing, add killer move and potential-mill move ordering heuristics, penalize move repetition, rebalance movement/flying evaluation weights, persist the transposition table across turns, and fix the Spring DI bypass in `AIRestController`.

## Glossary

- **Bug_Condition (C)**: The AI is in the movement or flying phase (`GamePhase.MOVEMENT` or `GamePhase.FLYING`) and at least one of the nine root causes is active, causing suboptimal move selection
- **Property (P)**: The AI selects strategically sound moves in movement/flying — completing mills when possible, avoiding back-and-forth oscillation, and searching to meaningful depth within the 2-second budget
- **Preservation**: Placement-phase behavior, terminal score evaluation, legal move guarantees, and all existing evaluation factors must remain unchanged
- **`AIService`**: The service in `src/main/java/com/ninemensmorris/service/AIService.java` containing minimax search, evaluation, move ordering, and transposition table
- **`AIRestController`**: The REST controller in `src/main/java/com/ninemensmorris/controller/AIRestController.java` that exposes the AI endpoint for single-player games
- **`PhaseWeights`**: The record type holding per-phase evaluation weights (pieceCount, mill, potentialMill, etc.)
- **Iterative Deepening**: Search technique that runs minimax at depth 1, then 2, then 3, etc., always keeping the best move from the last fully completed iteration
- **Killer Move Heuristic**: Remembers moves that caused beta cutoffs at each depth level, trying them early in sibling nodes to improve pruning
- **Transposition Table**: `ConcurrentHashMap<Long, TranspositionEntry>` caching evaluated positions keyed by board hash

## Bug Details

### Bug Condition

The bug manifests when the AI is in the movement or flying phase and any combination of the nine root causes is active. The `selectMove` method either times out to a depth-0 fallback, returns a move based on stale cross-phase cache data, oscillates pieces due to lack of repetition penalty, or evaluates positions with weights that discourage active mill pursuit.

**Formal Specification:**
```
FUNCTION isBugCondition(state, aiColor)
  INPUT: state of type GameState, aiColor of type PlayerColor
  OUTPUT: boolean

  RETURN state.getPhase() IN [MOVEMENT, FLYING]
         AND (
           transpositionHashOmitsPhase(state)
           OR searchTimesOutWithNoFallback(state, aiColor)
           OR noRepetitionPenalty(state)
           OR moveOrderingMissesPotentialMills(state)
           OR noKillerMoveHeuristic()
           OR transpositionTableClearedEveryCall()
           OR weightsDiscouragePotentialMills(state.getPhase())
           OR controllerBypassesDI()
         )
END FUNCTION
```

### Examples

- **Cross-phase cache collision**: WHITE has pieces at 0,1,2 (mill) in PLACEMENT. Same board in MOVEMENT gets the PLACEMENT evaluation score from cache, ignoring that mobility matters more now. AI makes a mobility-irrelevant move.
- **Depth-0 fallback**: In MOVEMENT with 4 pieces each (branching factor ~12-16 per ply), depth-4 search exceeds 2s. AI returns the first legal move evaluated at depth 0 — effectively random.
- **Oscillation**: AI moves piece from position 3→4, then next turn 4→3, then 3→4 again. Both moves evaluate identically because there's no repetition penalty.
- **Missed mill setup**: AI has pieces at positions 0 and 1 (potential mill on 0-1-2). Moving a piece to position 2 would complete the mill, but move ordering doesn't prioritize this setup move, so alpha-beta prunes it before evaluation.
- **Conservative weights**: `potentialMill=60` vs `mill=200` (3.3:1 ratio). AI values keeping an existing mill over setting up a new one, so it never breaks a mill to create a double mill.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Placement-phase evaluation weights (`PLACEMENT_WEIGHTS`) must remain exactly as-is: pieceCount=100, mill=200, potentialMill=80, opponentPotentialMill=80, doubleMill=500, mobility=3, blockedPiece=0, intersection=15
- Terminal position scores: ±10000 for win/loss, 0 for draw
- `evaluatePosition` must continue to consider all 8 evaluation factors (pieceCount, mills, potentialMills, opponentBlocking, doubleMills, mobility, blockedPieces, intersectionControl)
- `selectMove` must always return a legal move (or null if none exist) within the time budget
- All existing property-based tests (Properties 1-10, 12) must continue to pass
- `RuleEngine.generateLegalMoves` and `RuleEngine.isValidMove` behavior is untouched
- Mouse/touch interactions on the frontend are unaffected (backend-only changes)

**Scope:**
All inputs where the game phase is PLACEMENT should be completely unaffected by this fix. The fix targets MOVEMENT and FLYING phase behavior exclusively, except for the DI fix (which affects all phases via the controller) and the transposition table persistence (which benefits all phases).


## Hypothesized Root Cause

Based on the bug description and code analysis of `AIService.java`, the nine root causes are:

1. **Transposition table hash omits game phase** (`computeBoardHash`): The hash encodes board positions, current player, and mill-formed flag, but NOT `state.getPhase()`. Identical board layouts in PLACEMENT vs MOVEMENT produce the same hash, so a cached PLACEMENT evaluation (where mobility weight is 3) can be returned for a MOVEMENT lookup (where mobility weight should be 12). This causes the AI to ignore mobility in movement phase when a cached placement entry exists.

2. **Fixed-depth search with hard time cutoff** (`selectMove`): The search always attempts `searchDepth=4`. In movement/flying with branching factor ~12-16 moves per ply (vs ~20 in placement but with simpler evaluation), the search frequently exceeds the 2-second deadline mid-iteration. When this happens, the `for` loop in `selectMove` breaks and returns `bestMoveSoFar`, which may have only evaluated 1-2 root moves at depth 4 — or worse, the fallback `orderedMoves.get(0)`.

3. **No iterative deepening**: Without iterative deepening, there's no guarantee of a complete search at any depth. If depth-4 times out after evaluating 2 of 12 root moves, the AI has no depth-3 or depth-2 complete result to fall back on. The returned move is based on an incomplete search.

4. **`AIRestController` bypasses Spring DI**: The constructor `public AIRestController() { this.aiService = new AIService(); }` creates a new `AIService` instance instead of using `@Autowired` constructor injection. This means the REST endpoint uses a different `AIService` than the one managed by Spring, bypassing any future Spring-configured dependencies and preventing shared transposition table state.

5. **No move repetition penalty** (`evaluatePosition`): The evaluation function has no awareness of move history. A position reached by moving piece A→B evaluates identically to the same position reached by moving piece B→A. This causes the AI to oscillate: move 3→4 scores the same as the position after 4→3, so the AI alternates indefinitely.

6. **Move ordering misses potential mills** (`orderMoves`): The current ordering only prioritizes: (1) REMOVE moves, (2) moves that immediately complete a mill. It does NOT prioritize moves that create potential mills (2 of 3 positions filled). In movement phase, setting up a potential mill is the key multi-step strategy. Without this ordering, alpha-beta may prune the setup move before evaluating it, missing the best line of play.

7. **No killer move heuristic**: Alpha-beta pruning effectiveness depends heavily on move ordering. The killer move heuristic remembers moves that caused beta cutoffs at each depth and tries them first in sibling nodes. Without it, the search wastes time on bad moves, especially under the high branching factor of movement/flying (12-16 moves vs placement's effective ~20 but with more pruning opportunities).

8. **`selectMove` clears transposition table every call**: `transpositionTable.clear()` at the start of `selectMove` discards all cached evaluations from prior turns. In a game with ~40-60 moves, this means the AI re-evaluates positions it has already deeply analyzed. Persisting the table across calls (with phase-aware hashing from fix #1) would give the AI a significant head start on each search.

9. **Movement/flying weights too conservative**: `MOVEMENT_WEIGHTS.potentialMill=60` vs `MOVEMENT_WEIGHTS.mill=200` gives a 3.3:1 ratio. This means the AI values an existing mill 3.3x more than a potential mill setup. In movement phase, the primary strategy is to create double mills by temporarily breaking one mill to set up another. The 3.3:1 ratio makes the AI refuse to break a mill (losing 200 points) even when it would gain a potential mill (only +60 points). A ~2:1 ratio would make the AI willing to pursue active mill strategies.

## Correctness Properties

Property 1: Bug Condition - AI Movement Phase Strategic Quality

_For any_ game state in MOVEMENT or FLYING phase where the AI has a move that completes a mill (3 in a row), the fixed `selectMove` function SHALL return that mill-completing move (or a move of equal or greater strategic value), demonstrating that the search reaches sufficient depth to identify immediate tactical opportunities.

**Validates: Requirements 2.1, 2.2, 2.3, 2.6, 2.8**

Property 2: Preservation - Placement Phase Behavior Unchanged

_For any_ game state in PLACEMENT phase, the fixed `evaluatePosition` function SHALL produce the exact same score as the original function, and `selectMove` SHALL continue to return legal moves within the time budget, preserving all existing placement-phase strategic behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

Property 3: Bug Condition - Transposition Table Phase Isolation

_For any_ two game states with identical board positions but different game phases, the fixed `computeBoardHash` function SHALL produce distinct hash values, preventing cross-phase cache collisions.

**Validates: Requirements 2.1**

Property 4: Bug Condition - Iterative Deepening Completeness

_For any_ game state where `selectMove` is called, the fixed implementation SHALL always return a move based on at least a depth-1 complete search, never falling back to a depth-0 static evaluation for the best move.

**Validates: Requirements 2.2, 2.3**

Property 5: Preservation - Terminal Score Invariance

_For any_ terminal game state (game over with a winner or draw), the fixed `evaluatePosition` function SHALL return the same terminal scores as the original: +10000 for AI win, -10000 for AI loss, 0 for draw.

**Validates: Requirements 3.4**

Property 6: Bug Condition - Move Repetition Penalty

_For any_ movement-phase game state where the AI's last move was A→B, the fixed evaluation SHALL assign a lower score to the reverse move B→A compared to an equivalent non-reversing move, discouraging oscillation.

**Validates: Requirements 2.5**

Property 7: Preservation - AI Move Legality

_For any_ valid game state and AI color, the fixed `selectMove` SHALL return either null (when no legal moves exist) or a move contained in `RuleEngine.generateLegalMoves(state, aiColor)`, preserving the existing legality guarantee.

**Validates: Requirements 3.3**

Property 8: Bug Condition - Weight Rebalancing

_For any_ MOVEMENT or FLYING phase, the fixed `PhaseWeights` SHALL have a `mill:potentialMill` ratio of at most 2.5:1 (down from 3.3:1), encouraging active mill pursuit.

**Validates: Requirements 2.8**


## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/main/java/com/ninemensmorris/service/AIService.java`

**1. Fix transposition table hash to include game phase** (`computeBoardHash`)

- Add `state.getPhase().ordinal()` to the hash computation
- Current: `hash = hash * 5 + (currentPlayer == WHITE ? 1 : 2)`
- Fixed: `hash = hash * 5 + (currentPlayer == WHITE ? 1 : 2); hash = hash * 7 + state.getPhase().ordinal();`
- This ensures PLACEMENT, MOVEMENT, and FLYING produce distinct hashes for the same board

**2. Implement iterative deepening in `selectMove`**

- Replace the single fixed-depth search with a loop from depth 1 to `searchDepth`
- Each iteration performs a complete minimax search at that depth
- Track `bestMoveFromLastCompleteIteration` separately from the current iteration's partial result
- If the deadline is exceeded during an iteration, return the best move from the last fully completed iteration
- This guarantees at least a depth-1 complete search result is always available

```
FUNCTION selectMove(state, aiColor)
  legalMoves := generateLegalMoves(state, aiColor)
  IF legalMoves is empty THEN RETURN null
  
  deadline := now() + TIME_BUDGET_MS
  orderedMoves := orderMoves(legalMoves, state)
  bestMove := orderedMoves[0]  // fallback
  
  FOR depth := 1 TO searchDepth DO
    IF now() > deadline THEN BREAK
    
    iterationBestMove := null
    iterationBestScore := -INFINITY
    iterationComplete := true
    
    FOR EACH move IN orderedMoves DO
      IF now() > deadline THEN
        iterationComplete := false
        BREAK
      END IF
      
      newState := state.applyMove(move)
      score := minimax(newState, depth - 1, -INF, +INF, false, aiColor, deadline)
      
      IF score > iterationBestScore THEN
        iterationBestScore := score
        iterationBestMove := move
      END IF
    END FOR
    
    IF iterationComplete AND iterationBestMove != null THEN
      bestMove := iterationBestMove
      // Re-order moves: put bestMove first for next iteration (PV move)
      orderedMoves := reorderWithPVFirst(orderedMoves, bestMove)
    END IF
  END FOR
  
  RETURN bestMove
END FUNCTION
```

**3. Stop clearing transposition table every call**

- Remove `transpositionTable.clear()` from `selectMove`
- The table now persists across calls, giving the AI cached evaluations from prior turns
- Combined with fix #1 (phase-aware hashing), stale cross-phase entries are no longer a concern
- The existing `MAX_TRANSPOSITION_TABLE_SIZE` eviction guard prevents unbounded memory growth
- Add a `newGame()` or similar method to clear the table when a new game starts (called from controller)

**4. Add move repetition penalty**

- Add a `moveHistory` parameter or field to track recent moves (last 4-6 moves)
- In `evaluatePosition` or as a post-evaluation adjustment in `selectMove`, penalize moves that reverse the AI's last move
- Penalty: subtract a fixed score (e.g., 30-50 points) for a move that returns a piece to its previous position
- Implementation approach: pass the parent move into minimax, and in the evaluation or move scoring, check if the current move reverses it

```
FUNCTION penalizeRepetition(move, recentMoves)
  IF recentMoves is empty THEN RETURN 0
  lastAIMove := most recent AI move from recentMoves
  IF lastAIMove != null
     AND move.getFrom() == lastAIMove.getTo()
     AND move.getTo() == lastAIMove.getFrom() THEN
    RETURN -40  // repetition penalty
  END IF
  RETURN 0
END FUNCTION
```

**5. Enhance move ordering with potential mill detection** (`orderMoves`)

- Add a third priority tier: moves that create a potential mill (2 of 3 positions filled with 1 empty, no opponent blocking)
- Current ordering: (0) REMOVE, (1) mill-completing, (2) everything else
- New ordering: (0) REMOVE, (1) mill-completing, (2) potential-mill-creating, (3) killer moves, (4) everything else

```
FUNCTION orderMoves(moves, state, killerMoves, depth)
  FOR EACH move IN moves DO
    IF move.type == REMOVE THEN priority := 0
    ELSE IF formsMill(move, state) THEN priority := 1
    ELSE IF createsPotentialMill(move, state) THEN priority := 2
    ELSE IF isKillerMove(move, killerMoves, depth) THEN priority := 3
    ELSE priority := 4
  END FOR
  SORT moves BY priority ASC
END FUNCTION
```

**6. Add killer move heuristic**

- Maintain a `killerMoves` array indexed by depth, storing up to 2 moves per depth level
- When a move causes a beta cutoff in minimax, store it as a killer move for that depth
- In `orderMoves`, prioritize killer moves (after mill-completing and potential-mill moves)
- Killer moves are reset at the start of each iterative deepening iteration (or persist across iterations for better results)

```
// killerMoves[depth] = [Move, Move] (up to 2 killer moves per depth)
private Move[][] killerMoves = new Move[MAX_DEPTH + 1][2];

FUNCTION storeKillerMove(move, depth)
  IF move != killerMoves[depth][0] THEN
    killerMoves[depth][1] := killerMoves[depth][0]
    killerMoves[depth][0] := move
  END IF
END FUNCTION
```

**7. Rebalance movement/flying evaluation weights**

- Current `MOVEMENT_WEIGHTS`: potentialMill=60, mill=200 (ratio 3.3:1)
- New `MOVEMENT_WEIGHTS`: potentialMill=100, mill=200 (ratio 2.0:1)
- Current `FLYING_WEIGHTS`: potentialMill=60, mill=300 (ratio 5.0:1)
- New `FLYING_WEIGHTS`: potentialMill=120, mill=300 (ratio 2.5:1)
- Also increase `opponentPotentialMill` proportionally to maintain the constraint `opponentPotentialMill >= potentialMill`
- New `MOVEMENT_WEIGHTS.opponentPotentialMill`: 100 (was 60)
- New `FLYING_WEIGHTS.opponentPotentialMill`: 120 (was 60)
- All existing weight ratio invariants (Property 3 from ai-strategy-rework) must still hold after rebalancing

---

**File**: `src/main/java/com/ninemensmorris/controller/AIRestController.java`

**8. Fix Spring DI bypass**

- Remove the no-arg constructor: `public AIRestController() { this.aiService = new AIService(); }`
- Replace with constructor injection: `public AIRestController(AIService aiService) { this.aiService = aiService; }`
- Spring will auto-inject the `@Service`-annotated `AIService` bean
- This ensures the REST endpoint shares the same `AIService` instance (and transposition table) as `GameService`


## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior. All tests target `AIService` and `AIRestController` — no frontend changes are needed.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that create movement/flying phase game states with obvious tactical opportunities (e.g., one move away from completing a mill) and verify the AI fails to find them. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Cross-Phase Cache Collision Test**: Populate the transposition table with a PLACEMENT evaluation, then query the same board in MOVEMENT phase. Verify the hash collision occurs and the wrong score is returned (will fail on unfixed code — same hash for different phases).
2. **Depth-0 Fallback Test**: Create a movement-phase state with high branching factor and a short time budget. Verify the AI returns a suboptimal move because it couldn't complete depth-4 search (will fail on unfixed code — no iterative deepening fallback).
3. **Oscillation Test**: Set up a movement-phase position and call `selectMove` twice in sequence. Verify the AI moves a piece back to its previous position (will fail on unfixed code — no repetition penalty).
4. **Missed Mill Completion Test**: Create a movement-phase state where the AI is one move away from completing a mill. Verify the AI fails to find the mill-completing move within the time budget (may fail on unfixed code due to poor move ordering and depth-0 fallback).
5. **DI Bypass Test**: Verify `AIRestController` creates its own `AIService` instance instead of using the Spring-managed bean (will fail on unfixed code — constructor uses `new AIService()`).

**Expected Counterexamples**:
- Transposition table returns PLACEMENT-phase scores for MOVEMENT-phase queries
- AI returns first legal move (depth-0) instead of mill-completing move in movement phase
- AI oscillates pieces between two positions across consecutive calls
- Possible causes: hash collision, timeout without fallback, no repetition awareness

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL state WHERE isBugCondition(state, aiColor) DO
  move := selectMove_fixed(state, aiColor)
  ASSERT move is legal
  ASSERT move is not a depth-0 fallback (search completed at least depth 1)
  ASSERT IF mill-completing move exists THEN move completes mill OR has higher strategic value
  ASSERT IF last AI move was A→B THEN move is NOT B→A (unless only legal move)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL state WHERE state.getPhase() == PLACEMENT DO
  score_original := evaluatePosition_original(state, aiColor)
  score_fixed := evaluatePosition_fixed(state, aiColor)
  ASSERT score_original == score_fixed
END FOR

FOR ALL terminal state DO
  ASSERT evaluatePosition_fixed(state, aiColor) IN {-10000, 0, 10000}
END FOR
```

**Testing Approach**: Property-based testing with jqwik is recommended for preservation checking because:
- It generates many random game states automatically across the input domain
- It catches edge cases in weight calculations that manual unit tests might miss
- It provides strong guarantees that placement-phase behavior is unchanged
- The existing `gameStates` arbitrary generator can be reused

**Test Plan**: Observe behavior on UNFIXED code first for placement-phase evaluations and terminal scores, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Placement Evaluation Preservation**: Generate random placement-phase states, evaluate with both old and new weights, verify scores are identical (placement weights unchanged)
2. **Terminal Score Preservation**: Generate random terminal states, verify ±10000/0 scores are unchanged
3. **Legal Move Preservation**: Generate random states in any phase, verify `selectMove` always returns a legal move or null
4. **Weight Ratio Invariant Preservation**: Verify all existing weight ratio constraints still hold after rebalancing (mill >= 1.5 * pieceCount, potentialMill >= 0.3 * mill, etc.)

### Unit Tests

- Test `computeBoardHash` produces different hashes for same board in different phases
- Test iterative deepening returns a move from the last complete iteration when time runs out
- Test repetition penalty reduces score for reversing moves
- Test `orderMoves` prioritizes potential-mill-creating moves
- Test killer move storage and retrieval
- Test `AIRestController` uses injected `AIService` (Spring context test)
- Test rebalanced weights satisfy all ratio constraints
- Test transposition table persists across `selectMove` calls (table size > 0 after second call without explicit clear)

### Property-Based Tests

- Generate random movement/flying states with jqwik and verify `selectMove` always returns a legal move (Property 7 — existing Property 10 extended)
- Generate random placement states and verify `evaluatePosition` scores match the original implementation (Property 2)
- Generate random board positions and verify `computeBoardHash` produces distinct hashes for different phases (Property 3)
- Generate random terminal states and verify terminal scores are ±10000/0 (Property 5)
- Verify weight ratio invariants hold for all phases after rebalancing (Property 8 — extends existing Property 3)
- Generate random movement states with a known mill-completing move and verify the AI finds it (Property 1 — targeted)

### Integration Tests

- Test full AI move flow via REST endpoint in movement phase — verify the Spring-managed `AIService` is used
- Test AI plays a complete game (placement → movement → flying) without oscillation or timeout
- Test AI finds mill-completing moves in movement phase within the 2-second budget
- Test transposition table accumulates entries across multiple `selectMove` calls in a game
- Test `AIRestController` WebMvc test with `@Autowired` `AIService` bean injection
