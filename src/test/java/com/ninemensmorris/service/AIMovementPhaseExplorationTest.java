package com.ninemensmorris.service;

import java.lang.reflect.Constructor;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ninemensmorris.controller.AIRestController;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.Move;
import com.ninemensmorris.model.MoveType;
import com.ninemensmorris.model.PlayerColor;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

/**
 * Bug condition exploration tests for AI movement phase defects.
 *
 * <p>These tests encode the EXPECTED (correct) behavior. They are written
 * BEFORE any fixes and are expected to FAIL on unfixed code, proving the
 * bugs exist. After fixes are applied, these same tests should PASS.
 *
 * <p>Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
public class AIMovementPhaseExplorationTest {

    // ---------------------------------------------------------------
    // Helper: build a movement-phase GameState from a board layout
    // ---------------------------------------------------------------

    /**
     * Creates a movement-phase GameState with the given board layout.
     * All placement pieces are consumed (0 remaining), pieces on board
     * are counted from the boardColors array.
     */
    private GameState createMovementState(PlayerColor[] boardColors,
                                          PlayerColor currentPlayer,
                                          boolean millFormed) {
        int whitePieces = 0;
        int blackPieces = 0;
        for (PlayerColor c : boardColors) {
            if (c == PlayerColor.WHITE) whitePieces++;
            else if (c == PlayerColor.BLACK) blackPieces++;
        }
        return GameState.fromBoardData("test", boardColors,
                GamePhase.MOVEMENT, currentPlayer,
                0, 0, whitePieces, blackPieces, millFormed);
    }


    // ---------------------------------------------------------------
    // Test 1a — Cross-Phase Cache Collision (Property 3)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 2.1
     *
     * <p>Two GameStates with identical board positions but different phases
     * (PLACEMENT vs MOVEMENT) must produce different hashes. On unfixed code
     * this FAILS because computeBoardHash omits the phase.
     */
    @Property(tries = 100)
    void crossPhaseCacheCollision(
            @ForAll("boardPositions") PlayerColor[] boardColors) {

        // Build the same board in PLACEMENT and MOVEMENT phases
        int whitePieces = 0;
        int blackPieces = 0;
        for (PlayerColor c : boardColors) {
            if (c == PlayerColor.WHITE) whitePieces++;
            else if (c == PlayerColor.BLACK) blackPieces++;
        }

        // Need at least 3 pieces each for a valid movement state
        if (whitePieces < 3 || blackPieces < 3) return;

        // Placement state: some pieces remaining
        int whiteRemaining = 9 - whitePieces;
        int blackRemaining = 9 - blackPieces;
        if (whiteRemaining < 0 || blackRemaining < 0) return;

        GameState placementState = GameState.fromBoardData("test", boardColors,
                GamePhase.PLACEMENT, PlayerColor.WHITE,
                whiteRemaining, blackRemaining,
                whitePieces, blackPieces, false);

        // Movement state: no pieces remaining
        GameState movementState = GameState.fromBoardData("test", boardColors,
                GamePhase.MOVEMENT, PlayerColor.WHITE,
                0, 0, whitePieces, blackPieces, false);

        // Use reflection to call the private computeBoardHash method
        try {
            var method = AIService.class.getDeclaredMethod("computeBoardHash", GameState.class);
            method.setAccessible(true);
            AIService ai = new AIService();
            long hashPlacement = (long) method.invoke(ai, placementState);
            long hashMovement = (long) method.invoke(ai, movementState);

            assertNotEquals(hashPlacement, hashMovement,
                    "Hashes must differ for same board in different phases (PLACEMENT vs MOVEMENT)");
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("Reflection failed on computeBoardHash", e);
        }
    }

    @Provide
    Arbitrary<PlayerColor[]> boardPositions() {
        // Generate a 24-position board with random occupants
        return Arbitraries.of(PlayerColor.WHITE, PlayerColor.BLACK, null)
                .array(PlayerColor[].class).ofSize(24);
    }

    // ---------------------------------------------------------------
    // Test 1b — Iterative Deepening Completeness (Property 4)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 2.2, 2.3
     *
     * <p>Create a movement-phase state with high branching factor. Call
     * selectMove with a short time budget (AIService(1) for fast test).
     * Verify the AI returns a move based on at least depth-1 complete
     * search, not a depth-0 fallback. On unfixed code this may produce
     * suboptimal results due to fixed-depth search.
     *
     * <p>We test this by creating a state where one move completes a mill
     * and verifying the AI finds it even with minimal search depth.
     */
    @Property(tries = 100)
    void iterativeDeepeningCompleteness(@ForAll("aiColors") PlayerColor aiColor) {
        // Build a movement-phase state where aiColor is one move from a mill
        // Mill pattern: 0-1-2. AI has pieces at 0 and 1, empty at 2.
        // AI piece at 3 can move to 2 (adjacent) to complete the mill.
        // Opponent has pieces scattered elsewhere.
        PlayerColor opponent = aiColor.opposite();
        PlayerColor[] board = new PlayerColor[24];
        board[0] = aiColor;   // Part of mill 0-1-2
        board[1] = aiColor;   // Part of mill 0-1-2
        // Position 2 is empty — completing the mill target
        board[3] = aiColor;   // Can move to 2 (adjacent: 2,4,11)
        board[8] = aiColor;   // Extra piece
        board[12] = opponent;
        board[14] = opponent;
        board[16] = opponent;
        board[20] = opponent;

        GameState state = createMovementState(board, aiColor, false);

        // Use depth-1 AI to simulate tight time budget
        AIService ai = new AIService(1);
        Move move = ai.selectMove(state, aiColor);

        // The AI should find the mill-completing move: 3 → 2
        assertTrue(move != null, "AI must return a move");
        assertTrue(move.getType() == MoveType.MOVE,
                "AI should return a MOVE, got " + move.getType());
        assertTrue(move.getFrom() == 3 && move.getTo() == 2,
                "AI should move 3→2 to complete mill 0-1-2, but got "
                        + move.getFrom() + "→" + move.getTo());
    }

    @Provide
    Arbitrary<PlayerColor> aiColors() {
        return Arbitraries.of(PlayerColor.WHITE, PlayerColor.BLACK);
    }


    // ---------------------------------------------------------------
    // Test 1c — Move Repetition Penalty (Property 6)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 2.5
     *
     * <p>Verify that the AI penalizes move repetition by checking that
     * calling selectMove twice from equivalent positions produces different
     * choices when the second call should avoid reversing the first move.
     *
     * <p>On unfixed code, the AI has no concept of "last move" — it will
     * pick the same move deterministically from the same position. We set
     * up a board where the AI's best move from state S is A→B. After
     * applying A→B and then the opponent's response, the resulting state
     * S' is nearly identical to S (opponent moved a distant piece). The
     * AI's best move from S' should NOT be B→A (reversal) if a repetition
     * penalty exists. On unfixed code, the AI will happily reverse because
     * it has no move history awareness.
     *
     * <p>We test the structural property: AIService should have a field or
     * mechanism to track the last AI move. On unfixed code, no such field
     * exists.
     */
    @Property(tries = 100)
    void moveRepetitionPenalty(@ForAll("aiColors") PlayerColor aiColor) {
        // Structural check: AIService should have a field to track last move
        // for repetition penalty. On unfixed code, no such field exists.
        boolean hasLastMoveField = false;
        for (var field : AIService.class.getDeclaredFields()) {
            String name = field.getName().toLowerCase();
            if (name.contains("lastmove") || name.contains("last_move")
                    || name.contains("movehistory") || name.contains("move_history")
                    || name.contains("previousmove") || name.contains("previous_move")
                    || name.contains("repetition") || name.contains("lastai")) {
                hasLastMoveField = true;
                break;
            }
        }

        assertTrue(hasLastMoveField,
                "AIService must have a field to track last AI move for repetition penalty "
                        + "(e.g., lastAIMove, moveHistory, previousMove). None found.");
    }

    // ---------------------------------------------------------------
    // Test 1d — Mill Completion in Movement Phase (Property 1)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 2.1, 2.2, 2.3, 2.6, 2.8
     *
     * <p>Create a movement-phase state where the AI is exactly one move
     * away from completing a mill. Call selectMove and assert the AI
     * returns the mill-completing move. On unfixed code this may FAIL
     * due to poor move ordering and depth-0 fallback.
     */
    @Property(tries = 100)
    void millCompletionInMovementPhase(@ForAll("aiColors") PlayerColor aiColor) {
        PlayerColor opponent = aiColor.opposite();

        // Mill pattern 0-1-2: AI has pieces at 0 and 1.
        // AI piece at 3 is adjacent to 2 and can move there to complete the mill.
        // Opponent pieces are far away and not threatening.
        PlayerColor[] board = new PlayerColor[24];
        board[0] = aiColor;   // Part of mill 0-1-2
        board[1] = aiColor;   // Part of mill 0-1-2
        // Position 2 is empty — mill completion target
        board[3] = aiColor;   // Adjacent to 2 (adjacency: 2,4,11) — can move to 2
        board[8] = aiColor;   // Extra piece (need ≥ 3 for movement)
        board[14] = opponent;
        board[16] = opponent;
        board[20] = opponent;
        board[22] = opponent;

        GameState state = createMovementState(board, aiColor, false);

        AIService ai = new AIService(1);
        Move move = ai.selectMove(state, aiColor);

        assertTrue(move != null, "AI must return a move");

        // The AI should find the mill-completing move: 3 → 2
        boolean completedMill = move.getType() == MoveType.MOVE
                && move.getFrom() == 3 && move.getTo() == 2;

        assertTrue(completedMill,
                "AI should move 3→2 to complete mill 0-1-2, but got "
                        + move.getType() + " " + move.getFrom() + "→" + move.getTo());
    }


    // ---------------------------------------------------------------
    // Test 1e — Weight Ratio Check (Property 8)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 2.8
     *
     * <p>Assert that MOVEMENT_WEIGHTS has mill:potentialMill ratio ≤ 2.5
     * and FLYING_WEIGHTS has mill:potentialMill ratio ≤ 2.5. On unfixed
     * code this FAILS (current ratios are 3.3:1 and 5.0:1).
     */
    @Property(tries = 100)
    void weightRatioCheck(@ForAll("movementPhases") GamePhase phase) {
        AIService.PhaseWeights weights = AIService.getPhaseWeights(phase);

        double ratio = (double) weights.mill() / weights.potentialMill();

        assertTrue(ratio <= 2.5,
                phase + " weights: mill:potentialMill ratio is " + ratio
                        + " (mill=" + weights.mill() + ", potentialMill=" + weights.potentialMill()
                        + "), expected ≤ 2.5");
    }

    @Provide
    Arbitrary<GamePhase> movementPhases() {
        return Arbitraries.of(GamePhase.MOVEMENT, GamePhase.FLYING);
    }

    // ---------------------------------------------------------------
    // Test 1f — DI Bypass Check
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 2.4
     *
     * <p>Verify AIRestController has a constructor that accepts AIService
     * parameter (constructor injection) and does NOT use new AIService().
     * On unfixed code this FAILS because the only constructor is no-arg.
     */
    @Property(tries = 100)
    void diBypassCheck() {
        // Check that AIRestController has a constructor accepting AIService
        boolean hasInjectionConstructor = false;
        boolean hasNoArgConstructor = false;

        for (Constructor<?> ctor : AIRestController.class.getDeclaredConstructors()) {
            Class<?>[] params = ctor.getParameterTypes();
            if (params.length == 1 && params[0] == AIService.class) {
                hasInjectionConstructor = true;
            }
            if (params.length == 0) {
                hasNoArgConstructor = true;
            }
        }

        assertTrue(hasInjectionConstructor,
                "AIRestController must have a constructor accepting AIService for DI");
        assertTrue(!hasNoArgConstructor,
                "AIRestController must NOT have a no-arg constructor (bypasses Spring DI)");
    }

    // ---------------------------------------------------------------
    // Test 1g — Transposition Table Persistence
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 2.2
     *
     * <p>Call selectMove twice on the same state. If the transposition table
     * persists, the second call will find cached entries and the table size
     * will be at least as large as after the first call. On unfixed code,
     * selectMove calls transpositionTable.clear() at the start, so the
     * table is empty at the beginning of each call.
     *
     * <p>We verify persistence by checking the table size BETWEEN calls
     * using getTranspositionTableSize(). After the first call, the table
     * should have entries. If it persists, those entries survive into the
     * second call. We verify by checking that the table is NOT empty
     * right before the second search would start — approximated by
     * checking that after two calls the table has strictly MORE entries
     * than after one call on a different state (accumulation).
     */
    @Property(tries = 100)
    void transpositionTablePersistence(@ForAll("aiColors") PlayerColor aiColor) {
        PlayerColor opponent = aiColor.opposite();

        // State for the first call
        PlayerColor[] board1 = new PlayerColor[24];
        board1[0] = aiColor;
        board1[1] = aiColor;
        board1[3] = aiColor;
        board1[8] = aiColor;
        board1[14] = opponent;
        board1[16] = opponent;
        board1[20] = opponent;
        board1[22] = opponent;
        GameState state1 = createMovementState(board1, aiColor, false);

        AIService ai = new AIService(2);

        // First call — populates the transposition table
        ai.selectMove(state1, aiColor);
        int sizeAfterFirst = ai.getTranspositionTableSize();

        assertTrue(sizeAfterFirst > 0,
                "Transposition table should have entries after first selectMove call, but size="
                        + sizeAfterFirst);

        // On unfixed code, selectMove clears the table at the start.
        // So after the second call, the table only has entries from the second search.
        // If the table persists, it has entries from BOTH searches.
        //
        // We use a DIFFERENT state for the second call so entries don't overlap.
        PlayerColor[] board2 = new PlayerColor[24];
        board2[2] = aiColor;
        board2[4] = aiColor;
        board2[6] = aiColor;
        board2[10] = aiColor;
        board2[14] = opponent;
        board2[16] = opponent;
        board2[20] = opponent;
        board2[22] = opponent;
        GameState state2 = createMovementState(board2, aiColor, false);

        // Run a separate AI instance on state2 alone to measure its isolated table size
        AIService aiSeparate = new AIService(2);
        aiSeparate.selectMove(state2, aiColor);
        int isolatedSize = aiSeparate.getTranspositionTableSize();

        // Now run state2 on the original AI (which already has state1 entries)
        ai.selectMove(state2, aiColor);
        int combinedSize = ai.getTranspositionTableSize();

        // If table persists: combinedSize > isolatedSize (has entries from both calls)
        // If table is cleared: combinedSize ≈ isolatedSize (only state2 entries)
        assertTrue(combinedSize > isolatedSize,
                "Transposition table should persist across selectMove calls (accumulate entries). "
                        + "Combined size=" + combinedSize + ", isolated size=" + isolatedSize
                        + ". Table was likely cleared between calls.");
    }
}
