package com.ninemensmorris.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ninemensmorris.model.PlayerColor;

/**
 * Unit tests for WebSocket message DTOs.
 * 
 * Tests verify that all message DTOs:
 * - Can be serialized to JSON
 * - Can be deserialized from JSON
 * - Preserve all field values during round-trip
 * - Have proper getters and setters
 */
public class WebSocketMessageDTOTest {
    
    private ObjectMapper objectMapper;
    
    @BeforeEach
    @SuppressWarnings("unused") // Used by JUnit framework
    void setUp() {
        objectMapper = new ObjectMapper();
    }
    
    @Test
    @DisplayName("PlacePieceMessage serialization and deserialization")
    void testPlacePieceMessage() throws Exception {
        // Arrange
        PlacePieceMessage message = new PlacePieceMessage();
        message.setGameId("game-123");
        message.setPlayerId("player-1");
        message.setPosition(5);
        message.setPlayerColor(PlayerColor.WHITE);
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        PlacePieceMessage deserialized = objectMapper.readValue(json, PlacePieceMessage.class);
        
        // Assert
        assertEquals("game-123", deserialized.getGameId());
        assertEquals("player-1", deserialized.getPlayerId());
        assertEquals(5, deserialized.getPosition());
        assertEquals(PlayerColor.WHITE, deserialized.getPlayerColor());
    }
    
    @Test
    @DisplayName("PlacePieceMessage constructor with parameters")
    void testPlacePieceMessageConstructor() {
        // Act
        PlacePieceMessage message = new PlacePieceMessage("game-123", "player-1", 5, PlayerColor.WHITE);
        
        // Assert
        assertEquals("game-123", message.getGameId());
        assertEquals("player-1", message.getPlayerId());
        assertEquals(5, message.getPosition());
        assertEquals(PlayerColor.WHITE, message.getPlayerColor());
    }
    
    @Test
    @DisplayName("MovePieceMessage serialization and deserialization")
    void testMovePieceMessage() throws Exception {
        // Arrange
        MovePieceMessage message = new MovePieceMessage();
        message.setGameId("game-456");
        message.setPlayerId("player-2");
        message.setFromPosition(3);
        message.setToPosition(7);
        message.setPlayerColor(PlayerColor.BLACK);
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        MovePieceMessage deserialized = objectMapper.readValue(json, MovePieceMessage.class);
        
        // Assert
        assertEquals("game-456", deserialized.getGameId());
        assertEquals("player-2", deserialized.getPlayerId());
        assertEquals(3, deserialized.getFromPosition());
        assertEquals(7, deserialized.getToPosition());
        assertEquals(PlayerColor.BLACK, deserialized.getPlayerColor());
    }
    
    @Test
    @DisplayName("MovePieceMessage constructor with parameters")
    void testMovePieceMessageConstructor() {
        // Act
        MovePieceMessage message = new MovePieceMessage("game-456", "player-2", 3, 7, PlayerColor.BLACK);
        
        // Assert
        assertEquals("game-456", message.getGameId());
        assertEquals("player-2", message.getPlayerId());
        assertEquals(3, message.getFromPosition());
        assertEquals(7, message.getToPosition());
        assertEquals(PlayerColor.BLACK, message.getPlayerColor());
    }
    
    @Test
    @DisplayName("RemovePieceMessage serialization and deserialization")
    void testRemovePieceMessage() throws Exception {
        // Arrange
        RemovePieceMessage message = new RemovePieceMessage();
        message.setGameId("game-789");
        message.setPlayerId("player-3");
        message.setPosition(12);
        message.setPlayerColor(PlayerColor.WHITE);
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        RemovePieceMessage deserialized = objectMapper.readValue(json, RemovePieceMessage.class);
        
        // Assert
        assertEquals("game-789", deserialized.getGameId());
        assertEquals("player-3", deserialized.getPlayerId());
        assertEquals(12, deserialized.getPosition());
        assertEquals(PlayerColor.WHITE, deserialized.getPlayerColor());
    }
    
    @Test
    @DisplayName("RemovePieceMessage constructor with parameters")
    void testRemovePieceMessageConstructor() {
        // Act
        RemovePieceMessage message = new RemovePieceMessage("game-789", "player-3", 12, PlayerColor.WHITE);
        
        // Assert
        assertEquals("game-789", message.getGameId());
        assertEquals("player-3", message.getPlayerId());
        assertEquals(12, message.getPosition());
        assertEquals(PlayerColor.WHITE, message.getPlayerColor());
    }
    
    @Test
    @DisplayName("ChatMessage serialization and deserialization")
    void testChatMessage() throws Exception {
        // Arrange
        ChatMessage message = new ChatMessage();
        message.setGameId("game-abc");
        message.setPlayerId("player-4");
        message.setContent("Hello, opponent!");
        message.setTimestamp(System.currentTimeMillis());
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        ChatMessage deserialized = objectMapper.readValue(json, ChatMessage.class);
        
        // Assert
        assertEquals("game-abc", deserialized.getGameId());
        assertEquals("player-4", deserialized.getPlayerId());
        assertEquals("Hello, opponent!", deserialized.getContent());
        assertNotNull(deserialized.getTimestamp());
    }
    
    @Test
    @DisplayName("ChatMessage constructor with parameters")
    void testChatMessageConstructor() {
        // Arrange
        Long timestamp = System.currentTimeMillis();
        
        // Act
        ChatMessage message = new ChatMessage("game-abc", "player-4", "Hello, opponent!", timestamp);
        
        // Assert
        assertEquals("game-abc", message.getGameId());
        assertEquals("player-4", message.getPlayerId());
        assertEquals("Hello, opponent!", message.getContent());
        assertEquals(timestamp, message.getTimestamp());
    }
    
    @Test
    @DisplayName("JoinMatchmakingMessage serialization and deserialization")
    void testJoinMatchmakingMessage() throws Exception {
        // Arrange
        JoinMatchmakingMessage message = new JoinMatchmakingMessage();
        message.setPlayerId("player-5");
        message.setSessionId("session-xyz");
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        JoinMatchmakingMessage deserialized = objectMapper.readValue(json, JoinMatchmakingMessage.class);
        
        // Assert
        assertEquals("player-5", deserialized.getPlayerId());
        assertEquals("session-xyz", deserialized.getSessionId());
    }
    
    @Test
    @DisplayName("JoinMatchmakingMessage constructor with parameters")
    void testJoinMatchmakingMessageConstructor() {
        // Act
        JoinMatchmakingMessage message = new JoinMatchmakingMessage("player-5", "session-xyz");
        
        // Assert
        assertEquals("player-5", message.getPlayerId());
        assertEquals("session-xyz", message.getSessionId());
    }
    
    @Test
    @DisplayName("GameStateUpdate serialization and deserialization")
    void testGameStateUpdate() throws Exception {
        // Arrange
        GameStateUpdate message = new GameStateUpdate();
        message.setGameId("game-def");
        message.setCurrentPlayer(PlayerColor.BLACK);
        message.setPhase("MOVEMENT");
        message.setWhitePiecesRemaining(7);
        message.setBlackPiecesRemaining(8);
        message.setMillFormed(true);
        message.setGameOver(false);
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        GameStateUpdate deserialized = objectMapper.readValue(json, GameStateUpdate.class);
        
        // Assert
        assertEquals("game-def", deserialized.getGameId());
        assertEquals(PlayerColor.BLACK, deserialized.getCurrentPlayer());
        assertEquals("MOVEMENT", deserialized.getPhase());
        assertEquals(7, deserialized.getWhitePiecesRemaining());
        assertEquals(8, deserialized.getBlackPiecesRemaining());
        assertTrue(deserialized.isMillFormed());
        assertFalse(deserialized.isGameOver());
    }
    
    @Test
    @DisplayName("GameStartMessage serialization and deserialization")
    void testGameStartMessage() throws Exception {
        // Arrange
        GameStartMessage message = new GameStartMessage();
        message.setGameId("game-ghi");
        message.setPlayer1Id("player-6");
        message.setPlayer2Id("player-7");
        message.setPlayer1Color(PlayerColor.WHITE);
        message.setPlayer2Color(PlayerColor.BLACK);
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        GameStartMessage deserialized = objectMapper.readValue(json, GameStartMessage.class);
        
        // Assert
        assertEquals("game-ghi", deserialized.getGameId());
        assertEquals("player-6", deserialized.getPlayer1Id());
        assertEquals("player-7", deserialized.getPlayer2Id());
        assertEquals(PlayerColor.WHITE, deserialized.getPlayer1Color());
        assertEquals(PlayerColor.BLACK, deserialized.getPlayer2Color());
    }
    
    @Test
    @DisplayName("GameStartMessage constructor with parameters")
    void testGameStartMessageConstructor() {
        // Act
        GameStartMessage message = new GameStartMessage("game-ghi", "player-6", "player-7", 
                                                        PlayerColor.WHITE, PlayerColor.BLACK);
        
        // Assert
        assertEquals("game-ghi", message.getGameId());
        assertEquals("player-6", message.getPlayer1Id());
        assertEquals("player-7", message.getPlayer2Id());
        assertEquals(PlayerColor.WHITE, message.getPlayer1Color());
        assertEquals(PlayerColor.BLACK, message.getPlayer2Color());
    }
    
    @Test
    @DisplayName("GameEndMessage serialization and deserialization")
    void testGameEndMessage() throws Exception {
        // Arrange
        GameEndMessage message = new GameEndMessage();
        message.setGameId("game-jkl");
        message.setWinner(PlayerColor.WHITE);
        message.setReason("Opponent has fewer than 3 pieces");
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        GameEndMessage deserialized = objectMapper.readValue(json, GameEndMessage.class);
        
        // Assert
        assertEquals("game-jkl", deserialized.getGameId());
        assertEquals(PlayerColor.WHITE, deserialized.getWinner());
        assertEquals("Opponent has fewer than 3 pieces", deserialized.getReason());
    }
    
    @Test
    @DisplayName("GameEndMessage constructor with parameters")
    void testGameEndMessageConstructor() {
        // Act
        GameEndMessage message = new GameEndMessage("game-jkl", PlayerColor.WHITE, "Opponent has fewer than 3 pieces");
        
        // Assert
        assertEquals("game-jkl", message.getGameId());
        assertEquals(PlayerColor.WHITE, message.getWinner());
        assertEquals("Opponent has fewer than 3 pieces", message.getReason());
    }
    
    @Test
    @DisplayName("ChatMessageBroadcast serialization and deserialization")
    void testChatMessageBroadcast() throws Exception {
        // Arrange
        ChatMessageBroadcast message = new ChatMessageBroadcast();
        message.setGameId("game-mno");
        message.setSenderColor(PlayerColor.BLACK);
        message.setContent("Good game!");
        message.setTimestamp(System.currentTimeMillis());
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        ChatMessageBroadcast deserialized = objectMapper.readValue(json, ChatMessageBroadcast.class);
        
        // Assert
        assertEquals("game-mno", deserialized.getGameId());
        assertEquals(PlayerColor.BLACK, deserialized.getSenderColor());
        assertEquals("Good game!", deserialized.getContent());
        assertNotNull(deserialized.getTimestamp());
    }
    
    @Test
    @DisplayName("ChatMessageBroadcast constructor with parameters")
    void testChatMessageBroadcastConstructor() {
        // Arrange
        Long timestamp = System.currentTimeMillis();
        
        // Act
        ChatMessageBroadcast message = new ChatMessageBroadcast("game-mno", PlayerColor.BLACK, "Good game!", timestamp);
        
        // Assert
        assertEquals("game-mno", message.getGameId());
        assertEquals(PlayerColor.BLACK, message.getSenderColor());
        assertEquals("Good game!", message.getContent());
        assertEquals(timestamp, message.getTimestamp());
    }
    
    @Test
    @DisplayName("OpponentDisconnectedMessage serialization and deserialization")
    void testOpponentDisconnectedMessage() throws Exception {
        // Arrange
        OpponentDisconnectedMessage message = new OpponentDisconnectedMessage();
        message.setGameId("game-pqr");
        message.setDisconnectedPlayerColor(PlayerColor.WHITE);
        message.setReconnectTimeoutSeconds(60);
        
        // Act - Serialize
        String json = objectMapper.writeValueAsString(message);
        
        // Act - Deserialize
        OpponentDisconnectedMessage deserialized = objectMapper.readValue(json, OpponentDisconnectedMessage.class);
        
        // Assert
        assertEquals("game-pqr", deserialized.getGameId());
        assertEquals(PlayerColor.WHITE, deserialized.getDisconnectedPlayerColor());
        assertEquals(60, deserialized.getReconnectTimeoutSeconds());
    }
    
    @Test
    @DisplayName("OpponentDisconnectedMessage constructor with parameters")
    void testOpponentDisconnectedMessageConstructor() {
        // Act
        OpponentDisconnectedMessage message = new OpponentDisconnectedMessage("game-pqr", PlayerColor.WHITE, 60);
        
        // Assert
        assertEquals("game-pqr", message.getGameId());
        assertEquals(PlayerColor.WHITE, message.getDisconnectedPlayerColor());
        assertEquals(60, message.getReconnectTimeoutSeconds());
    }
}
