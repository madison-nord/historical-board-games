# Bugfix Requirements Document

## Introduction

The AI in Nine Men's Morris plays competently during the placement phase but becomes very weak during the movement and flying phases. Players observe the AI moving pieces back and forth aimlessly, failing to complete obvious mill formations (even when only one move away from closing a mill), and not planning multi-move sequences. Nine root causes have been identified: (1) the transposition table hash omits game phase, causing cross-phase cache collisions; (2) the fixed-depth search with a hard time cutoff causes the AI to fall back to depth-0 evaluations under the higher branching factor of movement/flying; (3) no iterative deepening means there is no complete shallower search to fall back on when time runs out; (4) `AIRestController` bypasses Spring DI by instantiating its own `AIService`; (5) the evaluation function has no move repetition penalty, causing back-and-forth oscillation; (6) move ordering only checks for immediate mill completion and ignores moves that set up potential mills (2 of 3 positions filled), which is the key multi-step strategy in movement phase; (7) no killer move heuristic means alpha-beta pruning is far less effective under the high branching factor of movement/flying, wasting search time on bad moves; (8) `selectMove` clears the transposition table on every call, discarding all cached evaluations from prior turns and forcing each search to start from scratch; (9) movement/flying phase evaluation weights are too conservative — `potentialMill` (60) is far too low relative to `mill` (200), so the AI values maintaining existing mills over actively pursuing new mill formations, discouraging it from breaking a mill temporarily to set up a double mill.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the AI is in the movement or flying phase AND the transposition table contains cached entries from a different game phase with the same board positions THEN the system returns stale evaluation scores from the wrong phase, causing the AI to select moves based on incorrect strategic priorities.

1.2 WHEN the AI is in the movement or flying phase AND the branching factor causes the minimax search to exceed the 2-second deadline before completing depth-4 search THEN the system returns a static evaluation with no lookahead (effectively depth 0-1), making the AI play near-randomly.

1.3 WHEN the AI search times out partway through depth-4 AND no shallower complete search result exists THEN the system returns whatever partial result was computed, which may be based on evaluating only a fraction of the legal moves at the root level.

1.4 WHEN a single-player game requests an AI move via the REST endpoint THEN the system uses a locally instantiated `AIService` (via `new AIService()`) instead of the Spring-managed bean, bypassing any Spring-configured dependencies or lifecycle management.

1.5 WHEN the AI evaluates movement-phase positions AND a piece can move to position A and back to its origin on the next turn THEN the system assigns the same evaluation score to both moves, causing the AI to oscillate pieces back and forth without making progress toward forming mills.

1.6 WHEN the AI is in the movement or flying phase AND the evaluation function uses `potentialMill` weight of 60 versus `mill` weight of 200 THEN the system overvalues maintaining existing mills relative to creating new mill threats, causing the AI to avoid breaking a mill temporarily to set up a double mill or pursue new mill formations — the 3.3:1 ratio between `mill` and `potentialMill` makes the AI overly passive and defensive in movement/flying phases.

### Expected Behavior (Correct)

2.1 WHEN the AI is in the movement or flying phase AND the transposition table is consulted THEN the system SHALL include the game phase in the board hash computation so that identical board positions in different phases produce distinct hash keys, preventing cross-phase cache collisions.

2.2 WHEN the AI is in the movement or flying phase AND the search cannot complete at the requested depth within the time budget THEN the system SHALL use iterative deepening to guarantee that a complete search result from a shallower depth is always available as a fallback.

2.3 WHEN the AI search uses iterative deepening AND the time budget expires during a deeper iteration THEN the system SHALL return the best move from the last fully completed iteration rather than a partially evaluated result.

2.4 WHEN a single-player game requests an AI move via the REST endpoint THEN the system SHALL use Spring's dependency injection (`@Autowired` or constructor injection) to obtain the Spring-managed `AIService` bean instead of instantiating a new instance.

2.5 WHEN the AI evaluates movement-phase positions THEN the system SHALL incorporate a repetition penalty that reduces the score of moves that return a piece to a position it recently occupied, discouraging back-and-forth oscillation.

2.6 WHEN the AI orders moves for alpha-beta evaluation THEN the system SHALL prioritize moves that create potential mills (2 of 3 positions filled) in addition to moves that immediately complete mills, improving search efficiency for multi-step mill strategies.

2.7 WHEN the AI performs alpha-beta search in movement or flying phase THEN the system SHALL use a killer move heuristic to remember moves that caused beta cutoffs at each depth, improving pruning efficiency under the high branching factor.

2.8 WHEN the AI is in the movement or flying phase THEN the system SHALL use rebalanced evaluation weights where `potentialMill` weight is increased relative to `mill` weight (reducing the ratio from 3.3:1 to approximately 2:1 or less), encouraging the AI to actively pursue new mill formations and break existing mills temporarily when it sets up a double mill or stronger position.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the AI is in the placement phase THEN the system SHALL CONTINUE TO use placement-phase evaluation weights and strategic priorities (intersection control, high potentialMill weight) without any changes from the movement/flying phase fixes.

3.2 WHEN the AI evaluates a position with no cached transposition table entry THEN the system SHALL CONTINUE TO compute a fresh evaluation using the minimax algorithm with alpha-beta pruning, unaffected by transposition table changes.

3.3 WHEN the AI has legal moves available in any game phase THEN the system SHALL CONTINUE TO return a valid legal move (never null) within the time budget.

3.4 WHEN the AI evaluates terminal positions (game over, win, loss) THEN the system SHALL CONTINUE TO return the correct terminal scores (±10000 for win/loss, 0 for draw) regardless of evaluation weight changes.

3.5 WHEN the AI is in the placement phase AND evaluates piece count, mill formations, double mills, and intersection control THEN the system SHALL CONTINUE TO use the existing `PLACEMENT_WEIGHTS` values unchanged.

3.6 WHEN the AI evaluates positions in any phase THEN the system SHALL CONTINUE TO consider all existing evaluation factors (piece count, mills, potential mills, double mills, mobility, blocked pieces) — the weight rebalancing shall not remove any evaluation component.
