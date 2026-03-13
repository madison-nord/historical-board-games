package com.ninemensmorris.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Captor;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.ChatMessage;
import com.ninemensmorris.dto.ChatMessageBroadcast;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

/**
 * Property-based tests for ChatWebSocketController.
 * 
 * These tests validate correctness properties for WebSocket chat message delivery.
 */
public class ChatWebSocketControllerPropertyTest {
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @Captor
    private ArgumentCaptor<ChatMessageBroadcast> broadcastCaptor;
    
    private ChatWebSocketController controller;
    
    /**
     * Property 15: Chat Message Delivery
     * 
     * For any chat message sent by a player in an online game, the opponent should
     * receive a message with the same content and sender information.
     * 
     * Validates: Requirements 6.2, 6.3
     */
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Property(tries = 100)
    void property15_chatMessageDelivery_opponentReceivesSameContent(
            @ForAll("validChatMessages") String content) {
        
        // Arrange
        MockitoAnnotations.openMocks(this);
        controller = new ChatWebSocketController(messagingTemplate);
        
        String gameId = "game-test-123";
        String playerId = "player-1";
        
        ChatMessage message = new ChatMessage();
        message.setGameId(gameId);
        message.setPlayerId(playerId);
        message.setContent(content);
        
        // Act
        controller.handleChatMessage(message);
        
        // Assert - verify broadcast was called
        verify(messagingTemplate, times(1)).convertAndSend(
            eq("/topic/game/" + gameId + "/chat"),
            any(ChatMessageBroadcast.class)
        );
        
        // Capture the broadcast message
        verify(messagingTemplate).convertAndSend(
            eq("/topic/game/" + gameId + "/chat"),
            broadcastCaptor.capture()
        );
        
        ChatMessageBroadcast broadcast = broadcastCaptor.getValue();
        
        // Verify the broadcast contains the correct content
        assertNotNull(broadcast, "Broadcast message should not be null");
        assertEquals(gameId, broadcast.getGameId(), "Game ID should match");
        assertNotNull(broadcast.getSenderColor(), "Sender color should not be null");
        
        // Content should match (trimmed if original had whitespace)
        String expectedContent = content.trim();
        if (expectedContent.length() > 200) {
            expectedContent = expectedContent.substring(0, 200);
        }
        assertEquals(expectedContent, broadcast.getContent(), "Content should match (trimmed and length-limited)");
        assertNotNull(broadcast.getTimestamp(), "Timestamp should not be null");
    }
    
    /**
     * Provides valid chat message content for property testing.
     * Generates non-empty strings of reasonable length.
     * Filters out strings that would be empty after trimming.
     */
    @SuppressWarnings("unused") // Used by jqwik framework
    @Provide
    Arbitrary<String> validChatMessages() {
        return Arbitraries.strings()
            .alpha()
            .numeric()
            .withChars(' ', '!', '?', '.', ',')
            .ofMinLength(1)
            .ofMaxLength(300)
            .filter(s -> !s.trim().isEmpty()); // Filter out whitespace-only strings
    }
}
