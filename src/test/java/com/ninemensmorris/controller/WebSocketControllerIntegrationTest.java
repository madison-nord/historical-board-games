package com.ninemensmorris.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Captor;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.ChatMessage;
import com.ninemensmorris.dto.ChatMessageBroadcast;
import com.ninemensmorris.dto.GameStateUpdate;
import com.ninemensmorris.dto.JoinMatchmakingMessage;
import com.ninemensmorris.dto.PlacePieceMessage;
import com.ninemensmorris.engine.Board;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.service.GameService;
import com.ninemensmorris.service.MatchmakingService;

/**
 * Integration tests for WebSocket controllers.
 * 
 * Tests cover complete flows across multiple controllers to ensure
 * the WebSocket system works correctly end-to-end.
 */
public class WebSocketControllerIntegrationTest {
    
    @Mock
    private GameService gameService;
    
    @Mock
    private MatchmakingService matchmakingService;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @Captor
    private ArgumentCaptor<ChatMessageBroadcast> chatBroadcastCaptor;
    
    private GameWebSocketController gameController;
    private ChatWebSocketController chatController;
    private MatchmakingWebSocketController matchmakingController;
    
    @SuppressWarnings({"unused", "null"}) // Used by JUnit framework, mock objects are non-null in test context
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        gameController = new GameWebSocketController(gameService, messagingTemplate);
        chatController = new ChatWebSocketController(messagingTemplate, gameService);
        matchmakingController = new MatchmakingWebSocketController(matchmakingService);
        
        // Mock player mappings for user-based broadcasting
        when(gameService.getPlayerMapping("game-integration-test")).thenReturn("player-1:player-2");
        when(gameService.getPlayerMapping("game-chat-test")).thenReturn("player-1:player-2");
        when(gameService.getPlayerMapping("game-combined-test")).thenReturn("player-1:player-2");
        
        // Mock getPlayerColor for chat tests
        when(gameService.getPlayerColor(anyString(), eq("player-1"))).thenReturn(PlayerColor.WHITE);
        when(gameService.getPlayerColor(anyString(), eq("player-2"))).thenReturn(PlayerColor.BLACK);
    }
    
    /** Creates a mock GameState with a real Board for broadcastGameState serialization */
    @SuppressWarnings("null")
    private GameState createMockGameState() {
        GameState mockState = mock(GameState.class);
        when(mockState.getCurrentPlayer()).thenReturn(PlayerColor.BLACK);
        when(mockState.getPhase()).thenReturn(GamePhase.PLACEMENT);
        when(mockState.isGameOver()).thenReturn(false);
        when(mockState.isMillFormed()).thenReturn(false);
        when(mockState.getWhitePiecesRemaining()).thenReturn(8);
        when(mockState.getBlackPiecesRemaining()).thenReturn(9);
        when(mockState.getWhitePiecesOnBoard()).thenReturn(1);
        when(mockState.getBlackPiecesOnBoard()).thenReturn(0);
        when(mockState.getWinner()).thenReturn(null);
        when(mockState.getBoard()).thenReturn(new Board());
        return mockState;
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Integration: Complete game flow over WebSocket")
    void testCompleteGameFlowOverWebSocket() {
        // Arrange
        String gameId = "game-integration-test";
        String player1Id = "player-1";
        
        GameState mockState = createMockGameState();
        
        when(gameService.placePiece(eq(gameId), eq(player1Id), eq(0)))
            .thenReturn(mockState);
        
        PlacePieceMessage message = new PlacePieceMessage();
        message.setGameId(gameId);
        message.setPlayerId(player1Id);
        message.setPosition(0);
        
        // Act
        gameController.handlePlacePiece(message);
        
        // Assert - should send to both players via user queues
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-1"),
            eq("/queue/game-state"),
            any(GameStateUpdate.class)
        );
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-2"),
            eq("/queue/game-state"),
            any(GameStateUpdate.class)
        );
        
        ArgumentCaptor<GameStateUpdate> captor = ArgumentCaptor.forClass(GameStateUpdate.class);
        verify(messagingTemplate).convertAndSendToUser(
            eq("player-1"),
            eq("/queue/game-state"),
            captor.capture()
        );
        
        GameStateUpdate update = captor.getValue();
        assertNotNull(update);
        assertEquals(gameId, update.getGameId());
        assertEquals(mockState.getCurrentPlayer(), update.getCurrentPlayer());
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Integration: Chat message routing")
    void testChatMessageRouting() {
        // Arrange
        String gameId = "game-chat-test";
        String playerId = "player-1";
        String content = "Good game!";
        
        ChatMessage message = new ChatMessage();
        message.setGameId(gameId);
        message.setPlayerId(playerId);
        message.setContent(content);
        
        // Act
        chatController.handleChatMessage(message);
        
        // Assert - should send to both players via user queues
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-1"),
            eq("/queue/chat"),
            any(ChatMessageBroadcast.class)
        );
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-2"),
            eq("/queue/chat"),
            any(ChatMessageBroadcast.class)
        );
        
        verify(messagingTemplate).convertAndSendToUser(
            eq("player-1"),
            eq("/queue/chat"),
            chatBroadcastCaptor.capture()
        );
        
        ChatMessageBroadcast broadcast = chatBroadcastCaptor.getValue();
        assertNotNull(broadcast);
        assertEquals(gameId, broadcast.getGameId());
        assertEquals(content, broadcast.getContent());
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Integration: Matchmaking flow")
    void testMatchmakingFlow() {
        // Arrange
        String player1Id = "player-1";
        String player2Id = "player-2";
        String session1Id = "session-1";
        String session2Id = "session-2";
        
        JoinMatchmakingMessage message1 = new JoinMatchmakingMessage();
        message1.setPlayerId(player1Id);
        message1.setSessionId(session1Id);
        
        JoinMatchmakingMessage message2 = new JoinMatchmakingMessage();
        message2.setPlayerId(player2Id);
        message2.setSessionId(session2Id);
        
        // Act
        matchmakingController.handleJoinMatchmaking(message1);
        matchmakingController.handleJoinMatchmaking(message2);
        
        // Assert
        verify(matchmakingService, times(1)).joinQueue(player1Id, session1Id);
        verify(matchmakingService, times(1)).joinQueue(player2Id, session2Id);
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Integration: Disconnect handling")
    void testDisconnectHandling() {
        // Arrange
        String playerId = "player-disconnect";
        String sessionId = "session-disconnect";
        
        JoinMatchmakingMessage joinMessage = new JoinMatchmakingMessage();
        joinMessage.setPlayerId(playerId);
        joinMessage.setSessionId(sessionId);
        
        JoinMatchmakingMessage leaveMessage = new JoinMatchmakingMessage();
        leaveMessage.setPlayerId(playerId);
        leaveMessage.setSessionId(sessionId);
        
        // Act - player joins then disconnects (leaves queue)
        matchmakingController.handleJoinMatchmaking(joinMessage);
        matchmakingController.handleLeaveMatchmaking(leaveMessage);
        
        // Assert
        verify(matchmakingService, times(1)).joinQueue(playerId, sessionId);
        verify(matchmakingService, times(1)).leaveQueue(playerId);
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Integration: Game and chat in same session")
    void testGameAndChatInSameSession() {
        // Arrange
        String gameId = "game-combined-test";
        String playerId = "player-1";
        
        GameState mockState = createMockGameState();
        
        when(gameService.placePiece(eq(gameId), eq(playerId), eq(0)))
            .thenReturn(mockState);
        
        PlacePieceMessage gameMessage = new PlacePieceMessage();
        gameMessage.setGameId(gameId);
        gameMessage.setPlayerId(playerId);
        gameMessage.setPosition(0);
        
        // Chat message
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setGameId(gameId);
        chatMessage.setPlayerId(playerId);
        chatMessage.setContent("Nice move!");
        
        // Act
        gameController.handlePlacePiece(gameMessage);
        chatController.handleChatMessage(chatMessage);
        
        // Assert - game state sent to both players via user queues
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-1"),
            eq("/queue/game-state"),
            any(GameStateUpdate.class)
        );
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-2"),
            eq("/queue/game-state"),
            any(GameStateUpdate.class)
        );
        
        // Assert - chat sent to both players via user queues
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-1"),
            eq("/queue/chat"),
            any(ChatMessageBroadcast.class)
        );
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("player-2"),
            eq("/queue/chat"),
            any(ChatMessageBroadcast.class)
        );
    }
}
