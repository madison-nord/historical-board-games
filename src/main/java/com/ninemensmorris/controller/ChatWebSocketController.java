package com.ninemensmorris.controller;

import org.springframework.lang.NonNull;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.ninemensmorris.dto.ChatMessage;
import com.ninemensmorris.dto.ChatMessageBroadcast;
import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.service.GameService;

/**
 * WebSocket controller for handling chat messages in online multiplayer.
 * 
 * This controller handles:
 * - Chat message validation (empty messages, length limits)
 * - Broadcasting chat messages to both players
 * 
 * Note: Content filtering is not implemented. For production use, consider
 * integrating a comprehensive profanity filtering library or service.
 */
@Controller
public class ChatWebSocketController {
    
    private static final int MAX_MESSAGE_LENGTH = 200;
    
    private final SimpMessagingTemplate messagingTemplate;
    private final GameService gameService;
    
    /**
     * Creates a new ChatWebSocketController.
     * 
     * @param messagingTemplate the messaging template for broadcasting messages
     * @param gameService the game service for retrieving player information
     */
    public ChatWebSocketController(@NonNull SimpMessagingTemplate messagingTemplate,
                                   @NonNull GameService gameService) {
        this.messagingTemplate = messagingTemplate;
        this.gameService = gameService;
    }
    
    /**
     * Handles chat messages from clients.
     * 
     * Validates and broadcasts the message to both players in the game.
     * Empty messages are rejected. Messages are truncated to MAX_MESSAGE_LENGTH.
     * 
     * @param message the chat message containing game ID, player ID, and content
     */
    @MessageMapping("/chat/send")
    public void handleChatMessage(@NonNull ChatMessage message) {
        // Trim and sanitize content
        String content = message.getContent().trim();
        
        // Reject empty messages
        if (content.isEmpty()) {
            return;
        }
        
        // Limit message length
        if (content.length() > MAX_MESSAGE_LENGTH) {
            content = content.substring(0, MAX_MESSAGE_LENGTH);
        }
        
        // Create broadcast message
        ChatMessageBroadcast broadcast = new ChatMessageBroadcast();
        broadcast.setGameId(message.getGameId());
        
        // Get actual player color from game service
        PlayerColor senderColor = gameService.getPlayerColor(message.getGameId(), message.getPlayerId());
        broadcast.setSenderColor(senderColor);
        
        broadcast.setContent(content);
        broadcast.setTimestamp(System.currentTimeMillis());
        
        // Broadcast to the game-specific chat topic
        messagingTemplate.convertAndSend(
            "/topic/game/" + message.getGameId() + "/chat",
            broadcast
        );
    }
}
