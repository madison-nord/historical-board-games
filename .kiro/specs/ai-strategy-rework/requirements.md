# Requirements Document

## Introduction

The single-player AI in Nine Men's Morris is too easy to beat. The root causes are poorly balanced evaluation weights (mills valued at only half a piece difference), mill patterns in the AI that don't match the Board's canonical `MILL_PATTERNS`, no phase-specific strategy, no double mill detection, and no explicit opponent mill blocking. This rework overhauls the AI evaluation function and search strategy to produce a significantly harder opponent that prioritizes forming and exploiting mills.

## Glossary

- **AI_Service**: The backend service (`AIService.java`) that selects moves using minimax with alpha-beta pruning and evaluates board positions.
- **Evaluation_Function**: The scoring function inside AI_Service that assigns a numeric value to a board position from the AI's perspective.
- **Board**: The game board engine (`Board.java`) containing the canonical `MILL_PATTERNS` and adjacency map for 24 positions.
- **Mill**: Three pieces of the same color aligned on a straight line as defined by `Board.MILL_PATTERNS`.
- **Double_Mill**: A board configuration where a single piece can alternate between two mills by moving back and forth, forming a new mill on each turn.
- **Potential_Mill**: A mill pattern containing exactly two pieces of one color and one empty position, with no opponent piece blocking.
- **Phase**: One of three game stages — Placement (placing 9 pieces each), Movement (sliding pieces to adjacent positions), or Flying (a player with exactly 3 pieces can move to any empty position).
- **Intersection**: A board position with 3 or more adjacent connections (positions 1, 3, 5, 7, 9, 11, 13, 15 on the standard board), which are strategically valuable for controlling multiple lines.
- **Mobility**: The count of legal moves available to a player in the current position.
- **Blocked_Piece**: A piece with no adjacent empty positions, unable to move during the Movement phase.
- **Transposition_Table**: A cache of previously evaluated board positions used to avoid redundant computation during minimax search.
- **Rule_Engine**: The engine (`RuleEngine.java`) that generates legal moves and validates move legality.

## Requirements

### Requirement 1: Fix Mill Pattern Consistency

**User Story:** As a developer, I want the AI's mill counting logic to use the same mill patterns as the Board engine, so that the AI correctly identifies mills on the board.

#### Acceptance Criteria

1. THE AI_Service SHALL use `Board.MILL_PATTERNS` (or an identical copy) when counting mills and potential mills, instead of maintaining a separate hardcoded pattern array.
2. WHEN the AI_Service counts mills for a player, THE AI_Service SHALL produce the same count as `Board.getMillsForPlayer()` for that player on the same board state.
3. WHEN the AI_Service counts potential mills, THE AI_Service SHALL use the same 16 mill pattern definitions as `Board.MILL_PATTERNS`.

### Requirement 2: Rebalance Evaluation Weights for Mill Priority

**User Story:** As a player, I want the AI to prioritize forming mills over other factors, so that the AI plays aggressively and is harder to beat.

#### Acceptance Criteria

1. THE Evaluation_Function SHALL assign a mill formation weight that is at least 1.5 times the piece count weight, so that forming a mill is valued higher than a single piece advantage.
2. THE Evaluation_Function SHALL assign a potential mill weight that is at least 30% of the mill weight, so that the AI actively builds toward mill completions.
3. THE Evaluation_Function SHALL assign a weight for blocking opponent potential mills, so that the AI considers defensive play when the opponent threatens a mill.
4. THE Evaluation_Function SHALL assign a double mill configuration weight that is at least 2 times the single mill weight, so that the AI strongly pursues repeatable mill formations.
5. WHEN the AI_Service evaluates a position with a double mill for the AI player, THE Evaluation_Function SHALL return a higher score than a position with two separate non-double mills and the same piece count.

### Requirement 3: Phase-Specific Evaluation Strategy

**User Story:** As a player, I want the AI to adapt its strategy to each game phase, so that it makes contextually appropriate decisions throughout the game.

#### Acceptance Criteria

1. WHILE the game is in the Placement phase, THE Evaluation_Function SHALL apply a bonus for pieces placed on intersection positions (positions with 3 or more adjacencies).
2. WHILE the game is in the Placement phase, THE Evaluation_Function SHALL apply a higher weight to potential mills than during other phases, so that the AI builds mill threats early.
3. WHILE the game is in the Movement phase, THE Evaluation_Function SHALL apply a higher weight to mobility and blocked opponent pieces than during the Placement phase.
4. WHILE the game is in the Flying phase, THE Evaluation_Function SHALL reduce the mobility weight, since a player with 3 pieces can move to any empty position.
5. WHILE the game is in the Flying phase, THE Evaluation_Function SHALL increase the mill weight, since forming mills is the primary path to victory when pieces are scarce.

### Requirement 4: Double Mill Detection

**User Story:** As a player, I want the AI to recognize and pursue double mill configurations, so that it can repeatedly capture opponent pieces.

#### Acceptance Criteria

1. THE AI_Service SHALL detect double mill configurations where a single piece can alternate between two mill lines by moving to an adjacent position.
2. WHEN a double mill configuration exists for the AI player, THE Evaluation_Function SHALL add a bonus score proportional to the double mill weight.
3. WHEN a double mill configuration exists for the opponent, THE Evaluation_Function SHALL subtract a penalty score proportional to the double mill weight.
4. THE AI_Service SHALL identify a double mill by checking whether any piece belonging to a player is part of one completed mill and adjacent to an empty position that would complete a second mill for the same player.

### Requirement 5: Opponent Mill Blocking

**User Story:** As a player, I want the AI to block my mill attempts, so that I cannot easily form mills without resistance.

#### Acceptance Criteria

1. THE Evaluation_Function SHALL include a term that penalizes positions where the opponent has unblocked potential mills.
2. WHEN the opponent has a potential mill (2 pieces in a line with the third position empty and reachable), THE Evaluation_Function SHALL subtract a blocking penalty from the AI's score.
3. THE blocking penalty for an opponent potential mill SHALL be at least equal to the AI's own potential mill bonus, so that the AI treats blocking as equally important to building.
4. WHEN the AI is in the Placement phase and the opponent has a potential mill, THE AI_Service SHALL prioritize placing a piece in the blocking position over non-strategic placements, as reflected by the evaluation score.

### Requirement 6: Strategic Intersection Control During Placement

**User Story:** As a player, I want the AI to prioritize key board positions during placement, so that it establishes strong positional control early in the game.

#### Acceptance Criteria

1. WHILE the game is in the Placement phase, THE Evaluation_Function SHALL assign a bonus for each AI piece occupying an intersection position.
2. THE intersection bonus SHALL be weighted so that occupying an intersection is valued higher than occupying a non-intersection position that does not contribute to a potential mill.
3. THE Evaluation_Function SHALL identify intersection positions as those with 3 or more entries in the Board adjacency map (positions 1, 3, 5, 7, 9, 11, 13, 15).

### Requirement 7: AI Move Legality Preservation

**User Story:** As a developer, I want the AI rework to preserve move legality guarantees, so that the AI never produces invalid moves.

#### Acceptance Criteria

1. THE AI_Service SHALL only return moves that are present in the list generated by `Rule_Engine.generateLegalMoves()`.
2. WHEN no legal moves are available, THE AI_Service SHALL return null.
3. FOR ALL valid game states and AI colors, THE AI_Service `selectMove` method SHALL return either null or a move that `Rule_Engine.isValidMove()` accepts as valid.

### Requirement 8: AI Performance Constraint

**User Story:** As a player, I want the AI to respond within a reasonable time, so that the game feels responsive.

#### Acceptance Criteria

1. THE AI_Service SHALL return a move within 2 seconds for any valid game state when using the default search depth.
2. IF the search at the default depth exceeds the time budget, THEN THE AI_Service SHALL return the best move found so far rather than continuing to search.
3. THE Transposition_Table SHALL continue to cache evaluated positions to avoid redundant computation across the search tree.

### Requirement 9: Evaluation Symmetry

**User Story:** As a developer, I want the evaluation function to be symmetric, so that swapping the AI color produces the negated score for the same board position.

#### Acceptance Criteria

1. FOR ALL valid board positions, THE Evaluation_Function SHALL satisfy: `evaluatePosition(state, WHITE) == -evaluatePosition(state, BLACK)`.
2. THE Evaluation_Function SHALL produce a score of 0 for the initial empty board state for both colors.
