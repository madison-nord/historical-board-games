package com.ninemensmorris.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.engine.RuleEngine;
import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.Move;
import com.ninemensmorris.model.PlayerColor;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

/**
 * Preservation property tests for AI movement phase bugfix.
 *
 * <p>These tests capture baseline behavior on UNFIXED code. They should PASS
 * on unfixed code and continue to PASS after fixes are applied, confirming
 * no regressions were introduced.
 *
 * <p>Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
public class AIMovementPhasePreservationTest {

    private final RuleEngine ruleEngine = new RuleEngine();

    // ---------------------------------------------------------------
    // Arbitrary providers
    // ---------------------------------------------------------------

    /**
     * Generates random game states by applying random legal moves
     * from the initial position. Reuses the pattern from AIServiceTest.
     */
    @Provide
    Arbitrary<GameState> gameStates() {
        return Arbitraries.create(() -> {
            GameState state = new GameState("test-pres-" + System.nanoTime());
            RuleEngine re = new RuleEngine();
            int maxMoves = Arbitraries.integers().between(0, 20).sample();

            for (int i = 0; i < maxMoves && !state.isGameOver(); i++) {
                PlayerColor current = state.getCurrentPlayer();
                List<Move> legal = re.generateLegalMoves(state, current);
                if (legal.isEmpty()) break;
                Move pick = legal.get(
                        Arbitraries.integers().between(0, legal.size() - 1).sample());
                state = state.applyMove(pick);
            }
            return state;
        });
    }

    @Provide
    Arbitrary<PlayerColor> playerColors() {
        return Arbitraries.of(PlayerColor.WHITE, PlayerColor.BLACK);
    }

    @Provide
    Arbitrary<GamePhase> allPhases() {
        return Arbitraries.of(GamePhase.PLACEMENT, GamePhase.MOVEMENT, GamePhase.FLYING);
    }

    // ---------------------------------------------------------------
    // Helper: create a movement-phase GameState from a board layout
    // ---------------------------------------------------------------

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
    // Test 2a — Placement Evaluation Preservation (Property 2)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 3.1, 3.5
     *
     * <p>For any PLACEMENT-phase game state, assert placement weights are
     * exactly: pieceCount=100, mill=200, potentialMill=80,
     * opponentPotentialMill=80, doubleMill=500, mobility=3,
     * blockedPiece=0, intersection=15.
     *
     * <p>This ensures placement-phase evaluation is unchanged after fixes.
     */
    @Property(tries = 100)
    void placementEvaluationPreservation(@ForAll("playerColors") PlayerColor aiColor) {
        AIService.PhaseWeights weights = AIService.getPhaseWeights(GamePhase.PLACEMENT);

        assertEquals(100, weights.pieceCount(),
                "PLACEMENT pieceCount must be 100");
        assertEquals(200, weights.mill(),
                "PLACEMENT mill must be 200");
        assertEquals(80, weights.potentialMill(),
                "PLACEMENT potentialMill must be 80");
        assertEquals(80, weights.opponentPotentialMill(),
                "PLACEMENT opponentPotentialMill must be 80");
        assertEquals(500, weights.doubleMill(),
                "PLACEMENT doubleMill must be 500");
        assertEquals(3, weights.mobility(),
                "PLACEMENT mobility must be 3");
        assertEquals(0, weights.blockedPiece(),
                "PLACEMENT blockedPiece must be 0");
        assertEquals(15, weights.intersection(),
                "PLACEMENT intersection must be 15");
    }

    // ---------------------------------------------------------------
    // Test 2b — Terminal Score Invariance (Property 5)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 3.4
     *
     * <p>For any terminal game state (game over), assert evaluatePosition
     * returns +10000 for AI win, -10000 for AI loss, 0 for draw.
     */
    @Property(tries = 100)
    void terminalScoreInvariance(@ForAll("gameStates") GameState state,
                                 @ForAll("playerColors") PlayerColor aiColor) {
        if (!state.isGameOver()) return; // skip non-terminal states

        AIService ai = new AIService();
        int score = ai.evaluatePosition(state, aiColor);
        PlayerColor winner = state.getWinner();

        if (winner == aiColor) {
            assertEquals(10000, score,
                    "AI win must score +10000, got " + score);
        } else if (winner == aiColor.opposite()) {
            assertEquals(-10000, score,
                    "AI loss must score -10000, got " + score);
        } else {
            assertEquals(0, score,
                    "Draw must score 0, got " + score);
        }
    }

    // ---------------------------------------------------------------
    // Test 2c — AI Move Legality (Property 7)
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 3.3
     *
     * <p>For any valid non-terminal game state, assert selectMove returns
     * either null (no legal moves) or a move contained in
     * RuleEngine.generateLegalMoves(state, aiColor).
     */
    @Property(tries = 100)
    void aiMoveLegality(@ForAll("gameStates") GameState state,
                        @ForAll("playerColors") PlayerColor aiColor) {
        if (state.isGameOver()) return; // skip terminal states

        AIService ai = new AIService(1); // depth-1 for speed
        Move move = ai.selectMove(state, aiColor);

        List<Move> legalMoves = ruleEngine.generateLegalMoves(state, aiColor);

        if (legalMoves.isEmpty()) {
            assertTrue(move == null,
                    "selectMove must return null when no legal moves exist");
        } else {
            assertTrue(move != null,
                    "selectMove must return a move when legal moves exist");
            assertTrue(legalMoves.contains(move),
                    "selectMove returned " + move + " which is not in legalMoves: " + legalMoves);
        }
    }

    // ---------------------------------------------------------------
    // Test 2d — Weight Ratio Invariants
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 3.6
     *
     * <p>For all phases, assert weight ratio invariants that hold on
     * unfixed code and must continue to hold after fixes:
     * <ul>
     *   <li>mill >= 1.5 * pieceCount</li>
     *   <li>potentialMill >= 0.2 * mill (holds for all current phases)</li>
     *   <li>opponentPotentialMill > 0</li>
     *   <li>doubleMill >= 2.0 * mill</li>
     *   <li>opponentPotentialMill >= potentialMill</li>
     * </ul>
     */
    @Property(tries = 100)
    void weightRatioInvariants(@ForAll("allPhases") GamePhase phase) {
        AIService.PhaseWeights w = AIService.getPhaseWeights(phase);

        assertTrue(w.mill() >= 1.5 * w.pieceCount(),
                phase + ": mill (" + w.mill() + ") must be >= 1.5 * pieceCount (" + w.pieceCount() + ")");
        assertTrue(w.potentialMill() >= 0.2 * w.mill(),
                phase + ": potentialMill (" + w.potentialMill() + ") must be >= 0.2 * mill (" + w.mill() + ")");
        assertTrue(w.opponentPotentialMill() > 0,
                phase + ": opponentPotentialMill must be > 0");
        assertTrue(w.doubleMill() >= 2.0 * w.mill(),
                phase + ": doubleMill (" + w.doubleMill() + ") must be >= 2.0 * mill (" + w.mill() + ")");
        assertTrue(w.opponentPotentialMill() >= w.potentialMill(),
                phase + ": opponentPotentialMill (" + w.opponentPotentialMill()
                        + ") must be >= potentialMill (" + w.potentialMill() + ")");
    }

    // ---------------------------------------------------------------
    // Test 2e — All 8 Evaluation Factors Present
    // ---------------------------------------------------------------

    /**
     * Validates: Requirements 3.6
     *
     * <p>Assert that evaluatePosition considers all 8 evaluation factors:
     * pieceCount, mills, potentialMills, opponentBlocking, doubleMills,
     * mobility, blockedPieces, and intersectionControl (placement only).
     *
     * <p>Verified by constructing board states where changing a single
     * factor changes the evaluation score.
     */
    @Property(tries = 100)
    void allEightEvaluationFactorsPresent(
            @ForAll("playerColors") PlayerColor aiColor) {

        AIService ai = new AIService();
        PlayerColor opponent = aiColor.opposite();

        // --- Factor 1: pieceCount ---
        // State A: AI has 4 pieces, opponent has 3
        // State B: AI has 3 pieces, opponent has 3
        {
            PlayerColor[] boardA = new PlayerColor[24];
            boardA[0] = aiColor;
            boardA[3] = aiColor;
            boardA[6] = aiColor;
            boardA[16] = aiColor;
            boardA[10] = opponent;
            boardA[14] = opponent;
            boardA[20] = opponent;
            GameState stateA = createMovementState(boardA, aiColor, false);

            PlayerColor[] boardB = new PlayerColor[24];
            boardB[0] = aiColor;
            boardB[3] = aiColor;
            boardB[6] = aiColor;
            boardB[10] = opponent;
            boardB[14] = opponent;
            boardB[20] = opponent;
            GameState stateB = createMovementState(boardB, aiColor, false);

            int scoreA = ai.evaluatePosition(stateA, aiColor);
            int scoreB = ai.evaluatePosition(stateB, aiColor);
            assertNotEquals(scoreA, scoreB,
                    "pieceCount factor: changing piece count must change score");
        }

        // --- Factor 2: mills ---
        // State with a mill vs state without a mill
        {
            // Mill at 0-1-2 for aiColor
            PlayerColor[] boardMill = new PlayerColor[24];
            boardMill[0] = aiColor;
            boardMill[1] = aiColor;
            boardMill[2] = aiColor;
            boardMill[8] = aiColor;
            boardMill[14] = opponent;
            boardMill[16] = opponent;
            boardMill[20] = opponent;
            boardMill[22] = opponent;
            GameState stateMill = createMovementState(boardMill, opponent, false);

            // No mill: move piece from 2 to 3
            PlayerColor[] boardNoMill = new PlayerColor[24];
            boardNoMill[0] = aiColor;
            boardNoMill[1] = aiColor;
            boardNoMill[3] = aiColor;
            boardNoMill[8] = aiColor;
            boardNoMill[14] = opponent;
            boardNoMill[16] = opponent;
            boardNoMill[20] = opponent;
            boardNoMill[22] = opponent;
            GameState stateNoMill = createMovementState(boardNoMill, opponent, false);

            int scoreMill = ai.evaluatePosition(stateMill, aiColor);
            int scoreNoMill = ai.evaluatePosition(stateNoMill, aiColor);
            assertNotEquals(scoreMill, scoreNoMill,
                    "mill factor: having a mill must change score");
        }

        // --- Factor 3: potentialMills ---
        // State with a potential mill vs state without
        {
            // Potential mill: aiColor at 0,1 (empty at 2) — 2 of 3 in pattern {0,1,2}
            PlayerColor[] boardPM = new PlayerColor[24];
            boardPM[0] = aiColor;
            boardPM[1] = aiColor;
            boardPM[6] = aiColor;
            boardPM[8] = aiColor;
            boardPM[10] = opponent;
            boardPM[14] = opponent;
            boardPM[20] = opponent;
            boardPM[22] = opponent;
            GameState statePM = createMovementState(boardPM, opponent, false);

            // No potential mill: scatter pieces
            PlayerColor[] boardNoPM = new PlayerColor[24];
            boardNoPM[0] = aiColor;
            boardNoPM[4] = aiColor;
            boardNoPM[6] = aiColor;
            boardNoPM[8] = aiColor;
            boardNoPM[10] = opponent;
            boardNoPM[14] = opponent;
            boardNoPM[20] = opponent;
            boardNoPM[22] = opponent;
            GameState stateNoPM = createMovementState(boardNoPM, opponent, false);

            int scorePM = ai.evaluatePosition(statePM, aiColor);
            int scoreNoPM = ai.evaluatePosition(stateNoPM, aiColor);
            assertNotEquals(scorePM, scoreNoPM,
                    "potentialMill factor: having a potential mill must change score");
        }

        // --- Factor 4: opponentBlocking (opponent potential mills) ---
        // This is tested implicitly via potentialMills since evaluateOpponentBlocking
        // uses the same countPotentialMills. We verify by checking that opponent
        // potential mills affect the score.
        {
            // Opponent has potential mill at 16,17 (empty 18)
            PlayerColor[] boardOB = new PlayerColor[24];
            boardOB[0] = aiColor;
            boardOB[3] = aiColor;
            boardOB[6] = aiColor;
            boardOB[8] = aiColor;
            boardOB[16] = opponent;
            boardOB[17] = opponent;
            boardOB[14] = opponent;
            boardOB[22] = opponent;
            GameState stateOB = createMovementState(boardOB, aiColor, false);

            // Opponent has no potential mill — scatter
            PlayerColor[] boardNoOB = new PlayerColor[24];
            boardNoOB[0] = aiColor;
            boardNoOB[3] = aiColor;
            boardNoOB[6] = aiColor;
            boardNoOB[8] = aiColor;
            boardNoOB[10] = opponent;
            boardNoOB[14] = opponent;
            boardNoOB[20] = opponent;
            boardNoOB[22] = opponent;
            GameState stateNoOB = createMovementState(boardNoOB, aiColor, false);

            int scoreOB = ai.evaluatePosition(stateOB, aiColor);
            int scoreNoOB = ai.evaluatePosition(stateNoOB, aiColor);
            assertNotEquals(scoreOB, scoreNoOB,
                    "opponentBlocking factor: opponent potential mills must change score");
        }

        // --- Factor 5: doubleMills ---
        // A double mill: piece at position in a completed mill, adjacent to empty
        // position that would form another mill if moved there.
        {
            // AI mill at 0-1-2, piece at 2 adjacent to 3, and if 2→3 then
            // 3 is part of pattern {2,3,4}. Need aiColor at 4 too.
            PlayerColor[] boardDM = new PlayerColor[24];
            boardDM[0] = aiColor;
            boardDM[1] = aiColor;
            boardDM[2] = aiColor;  // mill 0-1-2, piece at 2 adj to 3
            boardDM[4] = aiColor;  // pattern {2,3,4}: if 2→3, mill formed
            boardDM[14] = opponent;
            boardDM[16] = opponent;
            boardDM[20] = opponent;
            boardDM[22] = opponent;
            GameState stateDM = createMovementState(boardDM, opponent, false);

            // No double mill: same pieces but no second mill possible
            PlayerColor[] boardNoDM = new PlayerColor[24];
            boardNoDM[0] = aiColor;
            boardNoDM[1] = aiColor;
            boardNoDM[2] = aiColor;  // mill 0-1-2
            boardNoDM[8] = aiColor;  // no second mill setup
            boardNoDM[14] = opponent;
            boardNoDM[16] = opponent;
            boardNoDM[20] = opponent;
            boardNoDM[22] = opponent;
            GameState stateNoDM = createMovementState(boardNoDM, opponent, false);

            int scoreDM = ai.evaluatePosition(stateDM, aiColor);
            int scoreNoDM = ai.evaluatePosition(stateNoDM, aiColor);
            assertNotEquals(scoreDM, scoreNoDM,
                    "doubleMill factor: having a double mill must change score");
        }

        // --- Factor 6: mobility ---
        // More legal moves = higher mobility score
        {
            // High mobility: pieces in center with many adjacent empty positions
            PlayerColor[] boardHM = new PlayerColor[24];
            boardHM[1] = aiColor;   // adj: 0,2,9 — 3 moves possible
            boardHM[5] = aiColor;   // adj: 4,6,13 — 3 moves possible
            boardHM[9] = aiColor;   // adj: 8,10,17 — 3 moves possible
            boardHM[13] = aiColor;  // adj: 12,14,21 — 3 moves possible
            boardHM[0] = opponent;
            boardHM[16] = opponent;
            boardHM[20] = opponent;
            boardHM[22] = opponent;
            GameState stateHM = createMovementState(boardHM, aiColor, false);

            // Low mobility: pieces in corners surrounded by opponent
            PlayerColor[] boardLM = new PlayerColor[24];
            boardLM[0] = aiColor;   // adj: 1,7
            boardLM[2] = aiColor;   // adj: 1,3
            boardLM[4] = aiColor;   // adj: 3,5
            boardLM[6] = aiColor;   // adj: 5,7
            boardLM[1] = opponent;  // blocks 0 and 2
            boardLM[3] = opponent;  // blocks 2 and 4
            boardLM[5] = opponent;  // blocks 4 and 6
            boardLM[7] = opponent;  // blocks 6 and 0
            GameState stateLM = createMovementState(boardLM, aiColor, false);

            int scoreHM = ai.evaluatePosition(stateHM, aiColor);
            int scoreLM = ai.evaluatePosition(stateLM, aiColor);
            assertNotEquals(scoreHM, scoreLM,
                    "mobility factor: different mobility must change score");
        }

        // --- Factor 7: blockedPieces ---
        // Already tested via mobility above (blocked pieces have 0 moves),
        // but let's verify the blocked piece factor specifically.
        {
            // Opponent has blocked pieces (surrounded)
            PlayerColor[] boardBP = new PlayerColor[24];
            boardBP[0] = opponent;  // adj: 1,7 — both occupied by AI
            boardBP[1] = aiColor;
            boardBP[7] = aiColor;
            boardBP[6] = aiColor;
            boardBP[8] = aiColor;
            boardBP[16] = opponent;
            boardBP[20] = opponent;
            boardBP[22] = opponent;
            GameState stateBP = createMovementState(boardBP, aiColor, false);

            // Opponent not blocked
            PlayerColor[] boardNoBP = new PlayerColor[24];
            boardNoBP[0] = opponent;  // adj: 1,7 — 7 is empty
            boardNoBP[1] = aiColor;
            boardNoBP[6] = aiColor;
            boardNoBP[8] = aiColor;
            boardNoBP[10] = aiColor;
            boardNoBP[16] = opponent;
            boardNoBP[20] = opponent;
            boardNoBP[22] = opponent;
            GameState stateNoBP = createMovementState(boardNoBP, aiColor, false);

            int scoreBP = ai.evaluatePosition(stateBP, aiColor);
            int scoreNoBP = ai.evaluatePosition(stateNoBP, aiColor);
            assertNotEquals(scoreBP, scoreNoBP,
                    "blockedPiece factor: blocked opponent pieces must change score");
        }

        // --- Factor 8: intersectionControl (placement only) ---
        // Intersection positions: {1, 3, 5, 7, 9, 11, 13, 15}
        // This factor only applies in PLACEMENT phase.
        {
            // AI controls intersections
            PlayerColor[] boardIC = new PlayerColor[24];
            boardIC[1] = aiColor;   // intersection
            boardIC[3] = aiColor;   // intersection
            boardIC[5] = aiColor;   // intersection
            boardIC[10] = opponent;
            boardIC[14] = opponent;
            boardIC[20] = opponent;
            int wCount = 3;
            int bCount = 3;
            GameState stateIC = GameState.fromBoardData("test", boardIC,
                    GamePhase.PLACEMENT, aiColor,
                    9 - wCount, 9 - bCount, wCount, bCount, false);

            // AI does NOT control intersections
            PlayerColor[] boardNoIC = new PlayerColor[24];
            boardNoIC[0] = aiColor;   // NOT intersection
            boardNoIC[2] = aiColor;   // NOT intersection
            boardNoIC[4] = aiColor;   // NOT intersection
            boardNoIC[10] = opponent;
            boardNoIC[14] = opponent;
            boardNoIC[20] = opponent;
            GameState stateNoIC = GameState.fromBoardData("test", boardNoIC,
                    GamePhase.PLACEMENT, aiColor,
                    9 - wCount, 9 - bCount, wCount, bCount, false);

            int scoreIC = ai.evaluatePosition(stateIC, aiColor);
            int scoreNoIC = ai.evaluatePosition(stateNoIC, aiColor);
            assertNotEquals(scoreIC, scoreNoIC,
                    "intersectionControl factor: controlling intersections must change score in PLACEMENT");
        }
    }
}
