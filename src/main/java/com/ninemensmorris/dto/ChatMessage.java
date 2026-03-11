package com.ninemensmorris.dto;

/**
 * Message DTO for chat messages between players.
 * 
 * Sent from client to server when a player sends a chat message.
 */
public class ChatMessage {
    
    private String gameId;
    private String playerId;
    private String content;
    private Long timestamp;
    
    public ChatMessage() {
    }
    
    public ChatMessage(String gameId, String playerId, String content, Long timestamp) {
        this.gameId = gameId;
        this.playerId = playerId;
        this.content = content;
        this.timestamp = timestamp;
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public String getPlayerId() {
        return playerId;
    }
    
    public void setPlayerId(String playerId) {
        this.playerId = playerId;
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
