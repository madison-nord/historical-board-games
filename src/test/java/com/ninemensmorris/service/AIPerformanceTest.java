package com.ninemensmorris.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.Move;
import com.ninemensmorris.model.MoveType;
import com.ninemensmorris.model.PlayerColor;

/**
 * Performance and optimization tests for the AI service.
 *
 * <p>Validates that:
 * <ul>
 *   <li>AI move selection completes within the 2-second target at default depth</li>
 *   <li>The transposition table caches evaluated positions</li>
 *   <li>Move ordering prioritizes captures and mill-forming moves</li>
 *   <li>AI performance scales reasonably across search depths 1–4</li>
 * </ul>
 */
class AIPerformanceTest {

    // --- Performance profiling at different depths ---

    @Test
    @DisplayName("AI at depth 1 selects a move under 2 seconds")
    void testDepth1Performance() {
        AIService ai = new AIService(1);
        GameState state = new GameState("perf-d1");

        long start = System.nanoTime();
        Move move = ai.selectMove(state, PlayerColor.WHITE);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertNotNull(move, "AI should return a move at depth 1");
        assertTrue(elapsedMs < 2000, "Depth 1 should complete well under 2s, took " + elapsedMs + "ms");
    }

    @Test
    @DisplayName("AI at depth 2 selects a move under 2 seconds")
    void testDepth2Performance() {
        AIService ai = new AIService(2);
        GameState state = new GameState("perf-d2");

        long start = System.nanoTime();
        Move move = ai.selectMove(state, PlayerColor.WHITE);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertNotNull(move, "AI should return a move at depth 2");
        assertTrue(elapsedMs < 2000, "Depth 2 should complete under 2s, took " + elapsedMs + "ms");
    }

    @Test
    @DisplayName("AI at depth 3 selects a move under 2 seconds")
    void testDepth3Performance() {
        AIService ai = new AIService(3);
        GameState state = new GameState("perf-d3");

        long start = System.nanoTime();
        Move move = ai.selectMove(state, PlayerColor.WHITE);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertNotNull(move, "AI should return a move at depth 3");
        assertTrue(elapsedMs < 2000, "Depth 3 should complete under 2s, took " + elapsedMs + "ms");
    }

    @Test
    @DisplayName("AI at default depth (4) selects a move under 2 seconds")
    void testDefaultDepthPerformance() {
        AIService ai = new AIService();
        GameState state = new GameState("perf-d4");

        long start = System.nanoTime();
        Move move = ai.selectMove(state, PlayerColor.WHITE);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertNotNull(move, "AI should return a move at default depth");
        assertTrue(elapsedMs < 2000, "Default depth should complete under 2s, took " + elapsedMs + "ms");
    }

    @Test
    @DisplayName("AI performance in movement phase under 2 seconds")
    void testMovementPhasePerformance() {
        AIService ai = new AIService();
        GameState state = createMovementPhaseState();

        long start = System.nanoTime();
        Move move = ai.selectMove(state, PlayerColor.WHITE);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertNotNull(move, "AI should return a move in movement phase");
        assertTrue(elapsedMs < 2000, "Movement phase should complete under 2s, took " + elapsedMs + "ms");
    }

    // --- Transposition table tests ---

    @Test
    @DisplayName("Transposition table is populated after selectMove")
    void testTranspositionTablePopulated() {
        AIService ai = new AIService(3);
        GameState state = new GameState("tt-test");

        assertEquals(0, ai.getTranspositionTableSize(), "Table should be empty before search");

        ai.selectMove(state, PlayerColor.WHITE);

        assertTrue(ai.getTranspositionTableSize() > 0,
                "Transposition table should have entries after search");
    }

    @Test
    @DisplayName("Transposition table is cleared between selectMove calls")
    void testTranspositionTableClearedBetweenCalls() {
        AIService ai = new AIService(2);
        GameState state = new GameState("tt-clear");

        ai.selectMove(state, PlayerColor.WHITE);
        int sizeAfterFirst = ai.getTranspositionTableSize();
        assertTrue(sizeAfterFirst > 0, "Table should have entries after first search");

        // Second call should clear and repopulate
        ai.selectMove(state, PlayerColor.WHITE);
        // Table should be repopulated (may differ in size due to different pruning paths)
        assertTrue(ai.getTranspositionTableSize() > 0,
                "Table should have entries after second search");
    }

    @Test
    @DisplayName("clearTranspositionTable empties the cache")
    void testClearTranspositionTable() {
        AIService ai = new AIService(2);
        GameState state = new GameState("tt-manual-clear");

        ai.selectMove(state, PlayerColor.WHITE);
        assertTrue(ai.getTranspositionTableSize() > 0);

        ai.clearTranspositionTable();
        assertEquals(0, ai.getTranspositionTableSize(),
                "Table should be empty after manual clear");
    }

    // --- Move ordering tests ---

    @Test
    @DisplayName("AI selects legal move in removal phase (captures prioritized)")
    void testRemovalMovePrioritized() {
        // Set up a state where a mill was just formed and removal is needed
        AIService ai = new AIService(2);
        GameState state = createMillFormedState();

        Move move = ai.selectMove(state, PlayerColor.WHITE);
        assertNotNull(move, "AI should select a removal move");
        assertEquals(MoveType.REMOVE, move.getType(),
                "AI should select a REMOVE move when mill is formed");
    }

    @Test
    @DisplayName("getSearchDepth returns configured depth")
    void testGetSearchDepth() {
        AIService defaultAi = new AIService();
        assertEquals(4, defaultAi.getSearchDepth(), "Default depth should be 4");

        AIService customAi = new AIService(6);
        assertEquals(6, customAi.getSearchDepth(), "Custom depth should be 6");
    }

    // --- Helper methods ---

    /**
     * Creates a game state in the MOVEMENT phase with pieces on the board
     * and at least some legal moves available for WHITE.
     */
    private GameState createMovementPhaseState() {
        // Place all 18 pieces (9 per player) to enter movement phase.
        // Leave some empty positions so WHITE has legal moves.
        PlayerColor[] boardColors = new PlayerColor[24];
        // WHITE pieces at positions 0,1,2,3,4,6,8,16,18
        boardColors[0] = PlayerColor.WHITE;
        boardColors[1] = PlayerColor.WHITE;
        boardColors[2] = PlayerColor.WHITE;
        boardColors[3] = PlayerColor.WHITE;
        boardColors[4] = PlayerColor.WHITE;
        boardColors[6] = PlayerColor.WHITE;
        boardColors[8] = PlayerColor.WHITE;
        boardColors[16] = PlayerColor.WHITE;
        boardColors[18] = PlayerColor.WHITE;
        // BLACK pieces at positions 10,11,12,13,14,15,20,21,22
        boardColors[10] = PlayerColor.BLACK;
        boardColors[11] = PlayerColor.BLACK;
        boardColors[12] = PlayerColor.BLACK;
        boardColors[13] = PlayerColor.BLACK;
        boardColors[14] = PlayerColor.BLACK;
        boardColors[15] = PlayerColor.BLACK;
        boardColors[20] = PlayerColor.BLACK;
        boardColors[21] = PlayerColor.BLACK;
        boardColors[22] = PlayerColor.BLACK;
        // Empty positions: 5,7,9,17,19,23 — WHITE pieces at 4,6,8,16,18 have adjacent empties

        return GameState.fromBoardData("perf-movement", boardColors,
                GamePhase.MOVEMENT, PlayerColor.WHITE,
                0, 0, 9, 9, false);
    }

    /**
     * Creates a game state where WHITE just formed a mill and must remove a BLACK piece.
     */
    private GameState createMillFormedState() {
        PlayerColor[] boardColors = new PlayerColor[24];
        // WHITE mill at 0-1-2
        boardColors[0] = PlayerColor.WHITE;
        boardColors[1] = PlayerColor.WHITE;
        boardColors[2] = PlayerColor.WHITE;
        // Additional WHITE pieces
        boardColors[6] = PlayerColor.WHITE;
        boardColors[7] = PlayerColor.WHITE;
        // BLACK pieces (not in mills, so removable)
        boardColors[8] = PlayerColor.BLACK;
        boardColors[10] = PlayerColor.BLACK;
        boardColors[12] = PlayerColor.BLACK;
        boardColors[14] = PlayerColor.BLACK;
        boardColors[16] = PlayerColor.BLACK;

        return GameState.fromBoardData("mill-formed", boardColors,
                GamePhase.PLACEMENT, PlayerColor.WHITE,
                4, 4, 5, 5, true);
    }
}
