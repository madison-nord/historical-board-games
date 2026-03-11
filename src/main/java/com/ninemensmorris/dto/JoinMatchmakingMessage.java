package com.ninemensmorris.dto;

/**
 * Message DTO for joining the matchmaking queue.
 * 
 * Sent from client to server when a player wants to find an online opponent.
 */
public class JoinMatchmakingMessage {
    
    private String playerId;
    private String sessionId;
    
    public JoinMatchmakingMessage() {
    }
    
    public JoinMatchmakingMessage(String playerId, String sessionId) {
        this.playerId = playerId;
        this.sessionId = sessionId;
    }
    
    public String getPlayerId() {
        return playerId;
    }
    
    public void setPlayerId(String playerId) {
        this.playerId = playerId;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
