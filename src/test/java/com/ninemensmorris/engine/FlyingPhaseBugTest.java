package com.ninemensmorris.engine;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.Move;
import com.ninemensmorris.model.MoveType;
import com.ninemensmorris.model.PlayerColor;

/**
 * Tests for the flying phase bug where the board becomes non-interactive.
 *
 * Bug: When the game enters FLYING phase (one player has 3 pieces), the player
 * with MORE than 3 pieces cannot make any moves because isValidMovement()
 * returns false for adjacent moves during FLYING phase when piecesOnBoard != 3.
 *
 * Root cause: In RuleEngine.isValidMovement(), the FLYING phase branch only
 * returns true when piecesOnBoard == 3, but doesn't allow adjacency-based
 * movement for players with more than 3 pieces.
 */
public class FlyingPhaseBugTest {

    private final RuleEngine ruleEngine = new RuleEngine();

    /**
     * Core bug reproduction: in FLYING phase, a player with >3 pieces tries to
     * make an adjacent move. generateLegalMoves() produces the move, but
     * isValidMove() rejects it.
     */
    @Test
    @DisplayName("Bug: isValidMove must accept adjacent moves for >3 pieces player in FLYING phase")
    void isValidMoveAcceptsAdjacentMovesForNonFlyingPlayerInFlyingPhase() {
        GameState state = buildFlyingPhaseState();

        assertNotNull(state, "Should have built a valid flying phase state");
        assertFalse(state.isGameOver(), "Game should not be over");
        assertEquals(GamePhase.FLYING, state.getPhase(), "Should be in FLYING phase");

        // WHITE has >3 pieces, BLACK has exactly 3
        assertTrue(state.getWhitePiecesOnBoard() > 3,
            "WHITE should have >3 pieces, has " + state.getWhitePiecesOnBoard());
        assertEquals(3, state.getBlackPiecesOnBoard(),
            "BLACK should have exactly 3 pieces");

        // Ensure it's WHITE's turn (the >3 pieces player)
        if (state.getCurrentPlayer() != PlayerColor.WHITE) {
            // Play one BLACK move to get to WHITE's turn
            List<Move> blackMoves = ruleEngine.generateLegalMoves(state);
            assertFalse(blackMoves.isEmpty(), "BLACK should have moves");
            state = state.applyMove(blackMoves.get(0));
            if (state.isGameOver() || state.getPhase() != GamePhase.FLYING) return;
        }

        assertEquals(PlayerColor.WHITE, state.getCurrentPlayer());

        // Generate legal moves for WHITE (>3 pieces player)
        List<Move> legalMoves = ruleEngine.generateLegalMoves(state);
        assertFalse(legalMoves.isEmpty(),
            "WHITE with " + state.getWhitePiecesOnBoard() + " pieces should have legal moves in FLYING phase");

        // THE BUG: each generated move should be accepted by isValidMove
        for (Move move : legalMoves) {
            assertTrue(ruleEngine.isValidMove(state, move),
                String.format("isValidMove rejected generated move: %s (player %s has %d pieces in FLYING phase)",
                    move, move.getPlayer(), state.getPiecesOnBoard(move.getPlayer())));
        }
    }

    @Test
    @DisplayName("Player with 3 pieces can fly to any empty position in FLYING phase")
    void playerWith3PiecesCanFlyAnywhere() {
        GameState state = buildFlyingPhaseState();

        assertNotNull(state);
        assertFalse(state.isGameOver());
        assertEquals(GamePhase.FLYING, state.getPhase());

        // Find BLACK's turn (the 3-piece player)
        PlayerColor flyingPlayer = PlayerColor.BLACK;
        assertEquals(3, state.getPiecesOnBoard(flyingPlayer));

        // Get to flying player's turn
        if (state.getCurrentPlayer() != flyingPlayer) {
            List<Move> moves = ruleEngine.generateLegalMoves(state);
            if (!moves.isEmpty()) {
                state = state.applyMove(moves.get(0));
            }
            if (state.isGameOver() || state.getPhase() != GamePhase.FLYING) return;
        }

        if (state.getCurrentPlayer() != flyingPlayer) return;

        List<Move> legalMoves = ruleEngine.generateLegalMoves(state);
        assertFalse(legalMoves.isEmpty());

        // All generated moves should be valid
        for (Move move : legalMoves) {
            assertTrue(ruleEngine.isValidMove(state, move),
                String.format("Flying move %s should be valid", move));
        }

        // Should include non-adjacent moves (flying)
        Board board = state.getBoard();
        boolean hasNonAdjacent = legalMoves.stream().anyMatch(m -> {
            List<Integer> adj = board.getAdjacentPositions(m.getFrom());
            return !adj.contains(m.getTo());
        });
        assertTrue(hasNonAdjacent, "Player with 3 pieces should have non-adjacent (flying) moves");
    }

    /**
     * Builds a FLYING phase state by playing a scripted game.
     *
     * Strategy: WHITE places pieces at 0, 2, 9 (among others) so it can form
     * mill {0,1,2} by moving 9→1. Then repeatedly form/break that mill to
     * remove BLACK pieces down to 3.
     *
     * Placement plan (alternating WHITE/BLACK):
     *   W@0,  B@8,  W@2,  B@10, W@9,  B@12,
     *   W@4,  B@14, W@6,  B@16, W@20, B@18,
     *   W@22, B@3,  W@7,  B@5,  W@11, B@13
     *
     * After placement:
     *   WHITE at: 0, 2, 4, 6, 7, 9, 11, 20, 22 (9 pieces)
     *   BLACK at: 3, 5, 8, 10, 12, 13, 14, 16, 18 (9 pieces)
     *   Empty: 1, 15, 17, 19, 21, 23
     *
     * Mill strategy: move W@9→1 forms mill {0,1,2}, remove a BLACK piece,
     * BLACK makes a move, W@1→9 breaks mill, BLACK makes a move, repeat.
     */
    private GameState buildFlyingPhaseState() {
        GameState s = new GameState("flying-bug-test");

        // === PLACEMENT PHASE (18 moves) ===
        s = s.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));   // W@0
        s = s.applyMove(new Move(MoveType.PLACE, 8, PlayerColor.BLACK));   // B@8
        s = s.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE));   // W@2
        s = s.applyMove(new Move(MoveType.PLACE, 10, PlayerColor.BLACK));  // B@10
        s = s.applyMove(new Move(MoveType.PLACE, 9, PlayerColor.WHITE));   // W@9
        s = s.applyMove(new Move(MoveType.PLACE, 12, PlayerColor.BLACK));  // B@12
        s = s.applyMove(new Move(MoveType.PLACE, 4, PlayerColor.WHITE));   // W@4
        s = s.applyMove(new Move(MoveType.PLACE, 14, PlayerColor.BLACK));  // B@14
        s = s.applyMove(new Move(MoveType.PLACE, 6, PlayerColor.WHITE));   // W@6
        s = s.applyMove(new Move(MoveType.PLACE, 16, PlayerColor.BLACK));  // B@16
        s = s.applyMove(new Move(MoveType.PLACE, 20, PlayerColor.WHITE));  // W@20
        s = s.applyMove(new Move(MoveType.PLACE, 18, PlayerColor.BLACK));  // B@18
        s = s.applyMove(new Move(MoveType.PLACE, 22, PlayerColor.WHITE));  // W@22
        s = s.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.BLACK));   // B@3
        s = s.applyMove(new Move(MoveType.PLACE, 7, PlayerColor.WHITE));   // W@7
        s = s.applyMove(new Move(MoveType.PLACE, 5, PlayerColor.BLACK));   // B@5
        s = s.applyMove(new Move(MoveType.PLACE, 11, PlayerColor.WHITE));  // W@11
        s = s.applyMove(new Move(MoveType.PLACE, 13, PlayerColor.BLACK)); // B@13

        assertEquals(GamePhase.MOVEMENT, s.getPhase(), "Should be in MOVEMENT after placement");
        assertEquals(9, s.getWhitePiecesOnBoard(), "WHITE should have 9 pieces on board");
        assertEquals(9, s.getBlackPiecesOnBoard(), "BLACK should have 9 pieces on board");
        assertEquals(PlayerColor.WHITE, s.getCurrentPlayer(), "WHITE should move first after placement");

        // === MOVEMENT PHASE: Form mill {0,1,2} by moving W@9→1, remove BLACK pieces ===
        // Mill {0,1,2}: positions 0(W), 1(empty), 2(W) — moving 9→1 completes it
        // 9 is adjacent to 1 (radial connection)

        // --- Removal cycle 1: remove B@8 ---
        s = s.applyMove(new Move(MoveType.MOVE, 9, 1, PlayerColor.WHITE));  // W@9→1, mill {0,1,2}
        assertTrue(s.isMillFormed(), "Mill {0,1,2} should be formed");
        s = s.applyMove(new Move(MoveType.REMOVE, -1, 8, PlayerColor.WHITE)); // remove B@8
        assertEquals(8, s.getBlackPiecesOnBoard());
        // BLACK moves: B@10→9 (10 adj to 9)
        s = s.applyMove(new Move(MoveType.MOVE, 10, 9, PlayerColor.BLACK));
        // WHITE breaks mill: W@1→9 — wait, 9 is now occupied by BLACK
        // Instead: W@7→15 (7 adj to 15, 15 is empty) — just a random WHITE move
        s = s.applyMove(new Move(MoveType.MOVE, 7, 15, PlayerColor.WHITE));
        // BLACK: B@9→10 (9 adj to 10)
        s = s.applyMove(new Move(MoveType.MOVE, 9, 10, PlayerColor.BLACK));
        // WHITE breaks mill: W@1→9 (1 adj to 9)
        s = s.applyMove(new Move(MoveType.MOVE, 1, 9, PlayerColor.WHITE));
        // BLACK: B@10→8 (10 adj to... wait, let me check)
        // 10 adj to 9, 11. 9 is now WHITE. Let's move B@16→17 (16 adj to 17, 17 is empty)
        s = s.applyMove(new Move(MoveType.MOVE, 16, 17, PlayerColor.BLACK));

        // --- Removal cycle 2: remove B@10 ---
        s = s.applyMove(new Move(MoveType.MOVE, 9, 1, PlayerColor.WHITE));  // W@9→1, mill {0,1,2}
        assertTrue(s.isMillFormed(), "Mill {0,1,2} should be formed again");
        s = s.applyMove(new Move(MoveType.REMOVE, -1, 10, PlayerColor.WHITE)); // remove B@10
        assertEquals(7, s.getBlackPiecesOnBoard());
        // BLACK: B@17→16 (17 adj to 16)
        s = s.applyMove(new Move(MoveType.MOVE, 17, 16, PlayerColor.BLACK));
        // WHITE breaks mill: W@1→9
        s = s.applyMove(new Move(MoveType.MOVE, 1, 9, PlayerColor.WHITE));
        // BLACK: B@16→17
        s = s.applyMove(new Move(MoveType.MOVE, 16, 17, PlayerColor.BLACK));

        // --- Removal cycle 3: remove B@12 ---
        s = s.applyMove(new Move(MoveType.MOVE, 9, 1, PlayerColor.WHITE));  // mill {0,1,2}
        assertTrue(s.isMillFormed());
        s = s.applyMove(new Move(MoveType.REMOVE, -1, 12, PlayerColor.WHITE));
        assertEquals(6, s.getBlackPiecesOnBoard());
        // BLACK: B@17→16
        s = s.applyMove(new Move(MoveType.MOVE, 17, 16, PlayerColor.BLACK));
        // WHITE: W@1→9
        s = s.applyMove(new Move(MoveType.MOVE, 1, 9, PlayerColor.WHITE));
        // BLACK: B@16→17
        s = s.applyMove(new Move(MoveType.MOVE, 16, 17, PlayerColor.BLACK));

        // --- Removal cycle 4: remove B@14 ---
        s = s.applyMove(new Move(MoveType.MOVE, 9, 1, PlayerColor.WHITE));  // mill {0,1,2}
        assertTrue(s.isMillFormed());
        s = s.applyMove(new Move(MoveType.REMOVE, -1, 14, PlayerColor.WHITE));
        assertEquals(5, s.getBlackPiecesOnBoard());
        // BLACK: B@17→16
        s = s.applyMove(new Move(MoveType.MOVE, 17, 16, PlayerColor.BLACK));
        // WHITE: W@1→9
        s = s.applyMove(new Move(MoveType.MOVE, 1, 9, PlayerColor.WHITE));
        // BLACK: B@16→17
        s = s.applyMove(new Move(MoveType.MOVE, 16, 17, PlayerColor.BLACK));

        // --- Removal cycle 5: remove B@16 ---
        s = s.applyMove(new Move(MoveType.MOVE, 9, 1, PlayerColor.WHITE));  // mill {0,1,2}
        assertTrue(s.isMillFormed());
        // B@16 is not in a mill, can be removed. Wait — BLACK just moved to 17.
        // BLACK pieces at: 3, 5, 13, 16, 17, 18 — wait, 16 was moved to 17 last move
        // Let me recalculate. After cycle 4 BLACK moved 16→17, so BLACK is at: 3, 5, 13, 17, 18
        // That's only 5 pieces. Let me remove B@17 instead (not in a mill)
        // Actually let me check: B@18 is at position 18. Mill {18,19,20}? 19 is empty, 20 is WHITE. No mill.
        // Mill {16,17,18}? 16 is empty, 17 is BLACK, 18 is BLACK — not a mill (need all 3).
        // So B@17 is not in a mill, can remove it.
        s = s.applyMove(new Move(MoveType.REMOVE, -1, 17, PlayerColor.WHITE));
        assertEquals(4, s.getBlackPiecesOnBoard());
        // BLACK pieces at: 3, 5, 13, 18 (4 pieces)
        // BLACK: B@18→17 (18 adj to 17, 17 is now empty)
        s = s.applyMove(new Move(MoveType.MOVE, 18, 17, PlayerColor.BLACK));
        // WHITE: W@1→9
        s = s.applyMove(new Move(MoveType.MOVE, 1, 9, PlayerColor.WHITE));
        // BLACK: B@17→18
        s = s.applyMove(new Move(MoveType.MOVE, 17, 18, PlayerColor.BLACK));

        // --- Removal cycle 6: remove B@18 → BLACK down to 3 ---
        s = s.applyMove(new Move(MoveType.MOVE, 9, 1, PlayerColor.WHITE));  // mill {0,1,2}
        assertTrue(s.isMillFormed());
        s = s.applyMove(new Move(MoveType.REMOVE, -1, 18, PlayerColor.WHITE));

        // BLACK now has 3 pieces (at: 3, 5, 13), WHITE has 9 pieces
        assertEquals(3, s.getBlackPiecesOnBoard(), "BLACK should have 3 pieces");
        assertEquals(9, s.getWhitePiecesOnBoard(), "WHITE should have 9 pieces");
        assertEquals(GamePhase.FLYING, s.getPhase(), "Should be in FLYING phase");
        assertFalse(s.isGameOver(), "Game should not be over");

        return s;
    }
}
