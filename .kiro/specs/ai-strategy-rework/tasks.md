# Implementation Plan: AI Strategy Rework

## Overview

Refactor `AIService.java` to produce a significantly harder AI opponent by introducing phase-specific evaluation weights, double mill detection, opponent mill blocking, intersection control, and time-budgeted minimax search. All changes are confined to `AIService.java`. The existing minimax + alpha-beta + transposition table architecture is preserved.

## Tasks

- [x] 1. Introduce PhaseWeights record and phase-specific weight constants
  - [x] 1.1 Add the `PhaseWeights` record and `PLACEMENT_WEIGHTS`, `MOVEMENT_WEIGHTS`, `FLYING_WEIGHTS` constants
    - Define the `PhaseWeights` record with fields: `pieceCount`, `mill`, `potentialMill`, `opponentPotentialMill`, `doubleMill`, `mobility`, `blockedPiece`, `intersection`
    - Define `PLACEMENT_WEIGHTS`, `MOVEMENT_WEIGHTS`, `FLYING_WEIGHTS` with values from the design document
    - Add `INTERSECTION_POSITIONS` constant: `{1, 3, 5, 7, 9, 11, 13, 15}`
    - Add `TIME_BUDGET_MS` constant: `2000`
    - Add `getPhaseWeights(GamePhase)` helper method
    - Remove the old flat weight constants (`PIECE_COUNT_WEIGHT`, `MILL_WEIGHT`, `POTENTIAL_MILL_WEIGHT`, `MOBILITY_WEIGHT`, `BLOCKED_PIECE_WEIGHT`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 6.3_

  - [x] 1.2 Write property test for weight ratio invariants (Property 3)
    - **Property 3: Weight Ratio Invariants**
    - Verify for all phases: `mill >= 1.5 * pieceCount`, `potentialMill >= 0.3 * mill`, `opponentPotentialMill > 0`, `doubleMill >= 2.0 * mill`, `opponentPotentialMill >= potentialMill`
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 5.3**

  - [x] 1.3 Write property test for phase weight ordering (Property 4)
    - **Property 4: Phase Weight Ordering**
    - Verify: Placement `potentialMill` > Movement and Flying `potentialMill`; Movement `mobility` > Placement `mobility`; Movement `blockedPiece` > Placement `blockedPiece`; Flying `mobility` < Movement `mobility`; Flying `mill` > Movement `mill`
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

  - [x] 1.4 Write property test for intersection position identification (Property 9)
    - **Property 9: Intersection Position Identification**
    - Verify that for all 24 positions, a position is an intersection iff `Board.getAdjacentPositions(pos).size() >= 3`, and the set equals `{1, 3, 5, 7, 9, 11, 13, 15}`
    - **Validates: Requirements 6.3**

- [x] 2. Fix mill pattern consistency — delegate to Board.getMillPatterns()
  - [x] 2.1 Replace hardcoded mill patterns in `countMills` and `countPotentialMills` with `Board.getMillPatterns()`
    - Remove the local `millPatterns` arrays from both `countMills()` and `countPotentialMills()`
    - Use `Board.getMillPatterns()` as the single source of truth
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Write property test for mill count consistency (Property 1)
    - **Property 1: Mill Count Consistency**
    - For any board state and player color, `countMills(board, color)` must equal `board.getMillsForPlayer(color).size()`
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Write property test for potential mill count consistency (Property 2)
    - **Property 2: Potential Mill Count Consistency**
    - For any board state and player color, the AI's potential mill count must match a reference implementation iterating `Board.getMillPatterns()`
    - **Validates: Requirements 1.3**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement double mill detection and evaluation
  - [x] 4.1 Add `countDoubleMills(Board, PlayerColor)` method
    - For each position occupied by the player that is part of a completed mill, check adjacent empty positions; if placing the player's piece at that adjacent position would complete a second mill, count it as a double mill
    - _Requirements: 4.1, 4.4_

  - [x] 4.2 Add `evaluateDoubleMills(Board, PlayerColor, PlayerColor)` method
    - Compute `(aiDoubleMills - opponentDoubleMills) * weights.doubleMill()`
    - _Requirements: 4.2, 4.3_

  - [x] 4.3 Write property test for double mill detection correctness (Property 5)
    - **Property 5: Double Mill Detection Correctness**
    - For any board state where a piece is part of a completed mill and adjacent to an empty position that would complete a second mill, `countDoubleMills` must return >= 1
    - **Validates: Requirements 4.1, 4.4**

  - [x] 4.4 Write property test for double mill evaluation impact (Property 6)
    - **Property 6: Double Mill Evaluation Impact**
    - For any board state with a double mill, the evaluation must favor the owning player
    - **Validates: Requirements 4.2, 4.3**

- [x] 5. Implement opponent mill blocking evaluation
  - [x] 5.1 Add `evaluateOpponentBlocking(Board, PlayerColor, PlayerColor)` method
    - Count unblocked opponent potential mills and apply penalty using `weights.opponentPotentialMill()`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.2 Write property test for opponent potential mill penalty (Property 7)
    - **Property 7: Opponent Potential Mill Penalty**
    - For any board state where the opponent has a potential mill, the AI's score must be lower than an otherwise identical state where that potential mill is blocked
    - **Validates: Requirements 5.1, 5.2**

- [x] 6. Implement intersection control evaluation
  - [x] 6.1 Add `evaluateIntersectionControl(Board, PlayerColor, PlayerColor)` method
    - During placement phase, score AI pieces on intersection positions using `weights.intersection()`
    - _Requirements: 3.1, 6.1, 6.2_

  - [x] 6.2 Write property test for intersection control bonus during placement (Property 8)
    - **Property 8: Intersection Control Bonus During Placement**
    - For any placement-phase state, evaluation must increase when an AI piece occupies an intersection vs. a non-intersection position not contributing to a potential mill
    - **Validates: Requirements 3.1, 6.1, 6.2**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Rewire evaluatePosition to use phase-specific weights and new sub-evaluators
  - [x] 8.1 Refactor `evaluatePosition` to select `PhaseWeights` via `getPhaseWeights(state.getPhase())` and call all sub-evaluators
    - Call `evaluatePieceCount` with `weights.pieceCount()`
    - Call `evaluateMills` with `weights.mill()`
    - Call `evaluatePotentialMills` with `weights.potentialMill()`
    - Call `evaluateOpponentBlocking` with `weights.opponentPotentialMill()`
    - Call `evaluateDoubleMills` with `weights.doubleMill()`
    - Call `evaluateMobility` with `weights.mobility()`
    - Call `evaluateBlockedPieces` with `weights.blockedPiece()`
    - Call `evaluateIntersectionControl` with `weights.intersection()`
    - Update existing sub-evaluators to accept weight parameter instead of using old constants
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

  - [x] 8.2 Write property test for evaluation symmetry (Property 13)
    - **Property 13: Evaluation Symmetry**
    - For any valid board state, `evaluatePosition(state, WHITE)` must equal `-evaluatePosition(state, BLACK)`
    - **Validates: Requirements 9.1, 9.2**

  - [x] 8.3 Write unit test: double mill scores higher than two separate mills (Req 2.5)
    - Create a position with a double mill and a position with two separate non-double mills at the same piece count; verify the double mill position scores higher
    - _Requirements: 2.5_

  - [x] 8.4 Write unit test: initial state evaluates to zero for both colors (Req 9.2)
    - Verify `evaluatePosition(initialState, WHITE) == 0` and `evaluatePosition(initialState, BLACK) == 0`
    - _Requirements: 9.2_

- [x] 9. Implement time-budgeted minimax search
  - [x] 9.1 Add `deadline` field and modify `selectMove` to set deadline and track best move so far
    - Set `deadline = System.nanoTime() + TIME_BUDGET_MS * 1_000_000` at start of `selectMove`
    - Track `bestMoveSoFar` across iterations; return it if deadline exceeded
    - If no move evaluated yet when deadline hits, return first legal move as fallback
    - _Requirements: 8.1, 8.2_

  - [x] 9.2 Modify `minimax` to accept and check `deadline` parameter
    - Add `long deadline` parameter to `minimax`
    - Check `System.nanoTime() > deadline` at each node; if exceeded, return current evaluation immediately
    - _Requirements: 8.1, 8.2_

  - [x] 9.3 Write property test for AI performance constraint (Property 11)
    - **Property 11: AI Performance Constraint**
    - For any valid game state, `selectMove` must return within 2000 milliseconds at default depth
    - **Validates: Requirements 8.1**

  - [x] 9.4 Write property test for transposition table caching (Property 12)
    - **Property 12: Transposition Table Caching**
    - After `selectMove` completes on a state with legal moves, transposition table size must be > 0
    - **Validates: Requirements 8.3**

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. AI move legality and integration wiring
  - [x] 11.1 Verify `selectMove` only returns moves from `RuleEngine.generateLegalMoves()` and returns null when no moves exist
    - Review and confirm the existing legality guarantee is preserved after all refactoring
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 11.2 Write property test for AI move legality (Property 10)
    - **Property 10: AI Move Legality**
    - For any valid game state and AI color, `selectMove` returns null or a move in `RuleEngine.generateLegalMoves()` that `RuleEngine.isValidMove()` accepts
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x] 11.3 Update existing unit tests in `AIServiceTest.java` to pass with new evaluation weights
    - Adjust assertions that depend on specific score values or thresholds (e.g., mill bonus >= 40 assertion)
    - Ensure all existing strategic behavior tests still pass
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Run `mvn test --quiet` to verify all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All changes are confined to `AIService.java` and `AIServiceTest.java`
- Property tests use jqwik with `@Property(tries = 100)` and AI search depth 2 for speed
- Performance property (P11) uses default depth 4 with 2-second assertion
