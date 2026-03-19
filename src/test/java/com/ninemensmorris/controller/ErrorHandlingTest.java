package com.ninemensmorris.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.ChatMessage;
import com.ninemensmorris.dto.GameStateUpdate;
import com.ninemensmorris.dto.JoinMatchmakingMessage;
import com.ninemensmorris.dto.MovePieceMessage;
import com.ninemensmorris.dto.PlacePieceMessage;
import com.ninemensmorris.dto.RemovePieceMessage;
import com.ninemensmorris.model.GameMode;
import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.service.AIService;
import com.ninemensmorris.service.GameService;
import com.ninemensmorris.service.MatchmakingService;

/**
 * Error handling tests for WebSocket controllers and concurrent game access.
 * Validates that exceptions are caught and logged gracefully without propagating
 * to callers, and that concurrent access to game state is handled safely.
 *
 * Validates: Requirements 12.4
 */
public class ErrorHandlingTest {

    @Nested
    @DisplayName("GameWebSocketController error handling")
    class GameWebSocketControllerErrors {

        private GameWebSocketController controller;
        private GameService gameService;
        private SimpMessagingTemplate messagingTemplate;

        @BeforeEach
        @SuppressWarnings({"unused", "null"})
        void setUp() {
            gameService = mock(GameService.class);
            messagingTemplate = mock(SimpMessagingTemplate.class);
            controller = new GameWebSocketController(gameService, messagingTemplate);
        }

        @Test
        @DisplayName("placePiece catches RuntimeException without throwing")
        @SuppressWarnings("null")
        void testPlacePieceCatchesRuntimeException() {
            PlacePieceMessage message = new PlacePieceMessage();
            message.setGameId("game-1");
            message.setPlayerId("player-1");
            message.setPosition(0);
            message.setPlayerColor(PlayerColor.WHITE);

            when(gameService.placePiece("game-1", "player-1", 0))
                    .thenThrow(new RuntimeException("Unexpected error"));

            assertDoesNotThrow(() -> controller.handlePlacePiece(message));
            verify(messagingTemplate, never())
                    .convertAndSendToUser(anyString(), anyString(), any(GameStateUpdate.class));
        }

        @Test
        @DisplayName("movePiece catches IllegalArgumentException without throwing")
        @SuppressWarnings("null")
        void testMovePieceCatchesIllegalArgumentException() {
            MovePieceMessage message = new MovePieceMessage();
            message.setGameId("game-1");
            message.setPlayerId("player-1");
            message.setFromPosition(0);
            message.setToPosition(1);
            message.setPlayerColor(PlayerColor.WHITE);

            when(gameService.movePiece("game-1", "player-1", 0, 1))
                    .thenThrow(new IllegalArgumentException("Invalid move"));

            assertDoesNotThrow(() -> controller.handleMovePiece(message));
            verify(messagingTemplate, never())
                    .convertAndSendToUser(anyString(), anyString(), any(GameStateUpdate.class));
        }

        @Test
        @DisplayName("movePiece catches RuntimeException without throwing")
        @SuppressWarnings("null")
        void testMovePieceCatchesRuntimeException() {
            MovePieceMessage message = new MovePieceMessage();
            message.setGameId("game-1");
            message.setPlayerId("player-1");
            message.setFromPosition(0);
            message.setToPosition(1);
            message.setPlayerColor(PlayerColor.WHITE);

            when(gameService.movePiece("game-1", "player-1", 0, 1))
                    .thenThrow(new RuntimeException("Service unavailable"));

            assertDoesNotThrow(() -> controller.handleMovePiece(message));
        }

        @Test
        @DisplayName("removePiece catches IllegalArgumentException without throwing")
        @SuppressWarnings("null")
        void testRemovePieceCatchesIllegalArgumentException() {
            RemovePieceMessage message = new RemovePieceMessage();
            message.setGameId("game-1");
            message.setPlayerId("player-1");
            message.setPosition(5);
            message.setPlayerColor(PlayerColor.WHITE);

            when(gameService.removePiece("game-1", "player-1", 5))
                    .thenThrow(new IllegalArgumentException("Cannot remove piece"));

            assertDoesNotThrow(() -> controller.handleRemovePiece(message));
            verify(messagingTemplate, never())
                    .convertAndSendToUser(anyString(), anyString(), any(GameStateUpdate.class));
        }

        @Test
        @DisplayName("removePiece catches RuntimeException without throwing")
        @SuppressWarnings("null")
        void testRemovePieceCatchesRuntimeException() {
            RemovePieceMessage message = new RemovePieceMessage();
            message.setGameId("game-1");
            message.setPlayerId("player-1");
            message.setPosition(5);
            message.setPlayerColor(PlayerColor.WHITE);

            when(gameService.removePiece("game-1", "player-1", 5))
                    .thenThrow(new RuntimeException("Null pointer in engine"));

            assertDoesNotThrow(() -> controller.handleRemovePiece(message));
        }

        @Test
        @DisplayName("handleException returns error message string")
        void testHandleExceptionReturnsErrorMessage() {
            String result = controller.handleException(new RuntimeException("test error"));
            assertNotNull(result);
            assertTrue(result.contains("test error"));
        }
    }

    @Nested
    @DisplayName("ChatWebSocketController error handling")
    class ChatWebSocketControllerErrors {

        private ChatWebSocketController controller;
        private SimpMessagingTemplate messagingTemplate;
        private GameService gameService;

        @BeforeEach
        @SuppressWarnings({"unused", "null"})
        void setUp() {
            messagingTemplate = mock(SimpMessagingTemplate.class);
            gameService = mock(GameService.class);
            controller = new ChatWebSocketController(messagingTemplate, gameService);
        }

        @Test
        @DisplayName("Chat message handles getPlayerColor exception gracefully")
        @SuppressWarnings("null")
        void testChatMessageHandlesPlayerColorException() {
            ChatMessage message = new ChatMessage();
            message.setGameId("game-1");
            message.setPlayerId("player-1");
            message.setContent("Hello");

            when(gameService.getPlayerMapping("game-1")).thenReturn("player-1:player-2");
            when(gameService.getPlayerColor("game-1", "player-1"))
                    .thenThrow(new IllegalArgumentException("Game cleaned up"));

            assertDoesNotThrow(() -> controller.handleChatMessage(message));
        }

        @Test
        @DisplayName("Chat message handles null content gracefully")
        @SuppressWarnings("null")
        void testChatMessageHandlesNullContent() {
            ChatMessage message = new ChatMessage();
            message.setGameId("game-1");
            message.setPlayerId("player-1");
            message.setContent(null);

            // NullPointerException from content.trim() should be caught
            assertDoesNotThrow(() -> controller.handleChatMessage(message));
        }

        @Test
        @DisplayName("handleException returns error message string")
        void testHandleExceptionReturnsErrorMessage() {
            String result = controller.handleException(new RuntimeException("chat error"));
            assertNotNull(result);
            assertTrue(result.contains("chat error"));
        }
    }

    @Nested
    @DisplayName("MatchmakingWebSocketController error handling")
    class MatchmakingWebSocketControllerErrors {

        private MatchmakingWebSocketController controller;
        private MatchmakingService matchmakingService;

        @BeforeEach
        @SuppressWarnings({"unused", "null"})
        void setUp() {
            matchmakingService = mock(MatchmakingService.class);
            controller = new MatchmakingWebSocketController(matchmakingService);
        }

        @Test
        @DisplayName("joinMatchmaking catches exception without throwing")
        @SuppressWarnings("null")
        void testJoinMatchmakingCatchesException() {
            JoinMatchmakingMessage message = new JoinMatchmakingMessage();
            message.setPlayerId("player-1");
            message.setSessionId("session-1");

            doThrow(new RuntimeException("Queue full"))
                    .when(matchmakingService).joinQueue("player-1", "session-1");

            assertDoesNotThrow(() -> controller.handleJoinMatchmaking(message));
        }

        @Test
        @DisplayName("leaveMatchmaking catches exception without throwing")
        @SuppressWarnings("null")
        void testLeaveMatchmakingCatchesException() {
            JoinMatchmakingMessage message = new JoinMatchmakingMessage();
            message.setPlayerId("player-1");
            message.setSessionId("session-1");

            doThrow(new RuntimeException("Player not in queue"))
                    .when(matchmakingService).leaveQueue("player-1");

            assertDoesNotThrow(() -> controller.handleLeaveMatchmaking(message));
        }

        @Test
        @DisplayName("handleException returns error message string")
        void testHandleExceptionReturnsErrorMessage() {
            String result = controller.handleException(
                    new RuntimeException("matchmaking error"));
            assertNotNull(result);
            assertTrue(result.contains("matchmaking error"));
        }
    }

    @Nested
    @DisplayName("Concurrent game access")
    class ConcurrentGameAccess {

        private GameService gameService;

        @BeforeEach
        void setUp() {
            AIService aiService = mock(AIService.class);
            gameService = new GameService(aiService);
        }

        @Test
        @DisplayName("Concurrent game creation does not lose games")
        void testConcurrentGameCreation() throws InterruptedException {
            int threadCount = 10;
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(threadCount);
            AtomicInteger successCount = new AtomicInteger(0);

            ExecutorService executor = Executors.newFixedThreadPool(threadCount);

            for (int i = 0; i < threadCount; i++) {
                final int idx = i;
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        gameService.createGame(
                                GameMode.ONLINE_MULTIPLAYER,
                                "player-" + idx + "a",
                                "player-" + idx + "b");
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        // Count failures
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
            executor.shutdown();

            assertEquals(threadCount, successCount.get(),
                    "All concurrent game creations should succeed");
            assertEquals(threadCount, gameService.getActiveGameCount(),
                    "All games should be stored");
        }

        @Test
        @DisplayName("Concurrent cleanup does not cause ConcurrentModificationException")
        void testConcurrentCleanup() throws InterruptedException {
            // Create some games
            List<String> gameIds = new ArrayList<>();
            for (int i = 0; i < 5; i++) {
                var state = gameService.createGame(
                        GameMode.ONLINE_MULTIPLAYER,
                        "p" + i + "a",
                        "p" + i + "b");
                gameIds.add(state.getGameId());
            }

            int threadCount = 4;
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(threadCount);
            AtomicInteger errorCount = new AtomicInteger(0);

            ExecutorService executor = Executors.newFixedThreadPool(threadCount);

            for (int i = 0; i < threadCount; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        // Concurrent cleanup calls should not throw
                        gameService.cleanupCompletedGames();
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
            executor.shutdown();

            assertEquals(0, errorCount.get(),
                    "Concurrent cleanup should not throw exceptions");
        }
    }
}
