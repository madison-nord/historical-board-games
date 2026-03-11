package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for broadcasting chat messages to both players.
 * 
 * Sent from server to both clients when a chat message is received.
 */
public class ChatMessageBroadcast {
    
    private String gameId;
    private PlayerColor senderColor;
    private String content;
    private Long timestamp;
    
    public ChatMessageBroadcast() {
    }
    
    public ChatMessageBroadcast(String gameId, PlayerColor senderColor, String content, Long timestamp) {
        this.gameId = gameId;
        this.senderColor = senderColor;
        this.content = content;
        this.timestamp = timestamp;
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public PlayerColor getSenderColor() {
        return senderColor;
    }
    
    public void setSenderColor(PlayerColor senderColor) {
        this.senderColor = senderColor;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public Long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
