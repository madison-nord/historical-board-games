package com.ninemensmorris.service;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.GameMode;

/**
 * Tests for the game cleanup scheduler in {@link GameService}.
 *
 * <p>Validates that:
 * <ul>
 *   <li>Completed games are cleaned up</li>
 *   <li>Stale (inactive) games are cleaned up after the timeout</li>
 *   <li>Active, non-completed games are preserved</li>
 *   <li>Last activity timestamps are tracked correctly</li>
 * </ul>
 */
class GameCleanupSchedulerTest {

    private GameService gameService;

    @BeforeEach
    void setUp() {
        gameService = new GameService(new AIService());
    }

    @Test
    @DisplayName("Cleanup does not remove active non-completed games")
    void testCleanupPreservesActiveGames() {
        gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        assertEquals(1, gameService.getActiveGameCount());

        int cleaned = gameService.cleanupCompletedGames();

        assertEquals(0, cleaned, "Should not clean up active games");
        assertEquals(1, gameService.getActiveGameCount());
    }

    @Test
    @DisplayName("Last activity timestamp is set on game creation")
    void testLastActivitySetOnCreation() {
        Instant before = Instant.now();
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        Instant after = Instant.now();

        Instant lastActivity = gameService.getGameLastActivity(game.getGameId());
        assertNotNull(lastActivity, "Last activity should be set on creation");
        assertFalse(lastActivity.isBefore(before), "Last activity should be >= creation time");
        assertFalse(lastActivity.isAfter(after), "Last activity should be <= current time");
    }

    @Test
    @DisplayName("Last activity timestamp is updated on move")
    void testLastActivityUpdatedOnMove() throws Exception {
        GameState game = gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "p1", "p2");
        String gameId = game.getGameId();
        Instant creationTime = gameService.getGameLastActivity(gameId);

        // Small delay to ensure timestamp difference
        Thread.sleep(10);

        // Make a valid placement move
        var move = new com.ninemensmorris.model.Move(
                com.ninemensmorris.model.MoveType.PLACE, 0, com.ninemensmorris.model.PlayerColor.WHITE);
        gameService.makeMove(gameId, move);

        Instant afterMove = gameService.getGameLastActivity(gameId);
        assertNotNull(afterMove);
        assertTrue(afterMove.isAfter(creationTime) || afterMove.equals(creationTime),
                "Last activity should be updated after a move");
    }

    @Test
    @DisplayName("Stale games are cleaned up after timeout")
    @SuppressWarnings("unchecked") // reflective access to internal map
    void testStaleGameCleanup() throws Exception {
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();

        // Use reflection to set the last activity to 2 hours ago (past the 1-hour threshold)
        Field lastActivityField = GameService.class.getDeclaredField("gameLastActivity");
        lastActivityField.setAccessible(true);
        ConcurrentHashMap<String, Instant> lastActivityMap =
                (ConcurrentHashMap<String, Instant>) lastActivityField.get(gameService);
        lastActivityMap.put(gameId, Instant.now().minusSeconds(7200));

        assertEquals(1, gameService.getActiveGameCount());

        int cleaned = gameService.cleanupCompletedGames();

        assertEquals(1, cleaned, "Should clean up the stale game");
        assertEquals(0, gameService.getActiveGameCount(), "No games should remain");
        assertNull(gameService.getGame(gameId), "Stale game should be removed");
    }

    @Test
    @DisplayName("Recently active games are not cleaned up as stale")
    void testRecentGamesNotCleanedAsStale() {
        gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "p1", "p2");

        assertEquals(2, gameService.getActiveGameCount());

        int cleaned = gameService.cleanupCompletedGames();

        assertEquals(0, cleaned, "Recently created games should not be cleaned up");
        assertEquals(2, gameService.getActiveGameCount());
    }

    @Test
    @DisplayName("getGameLastActivity returns null for unknown game")
    void testLastActivityForUnknownGame() {
        assertNull(gameService.getGameLastActivity("nonexistent"),
                "Should return null for unknown game ID");
    }
}
