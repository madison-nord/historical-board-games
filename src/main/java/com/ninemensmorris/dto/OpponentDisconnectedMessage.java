package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for notifying a player that their opponent has disconnected.
 * 
 * Sent from server to the remaining client when the opponent disconnects.
 */
public class OpponentDisconnectedMessage {
    
    private String gameId;
    private PlayerColor disconnectedPlayerColor;
    private int reconnectTimeoutSeconds;
    
    public OpponentDisconnectedMessage() {
    }
    
    public OpponentDisconnectedMessage(String gameId, PlayerColor disconnectedPlayerColor, int reconnectTimeoutSeconds) {
        this.gameId = gameId;
        this.disconnectedPlayerColor = disconnectedPlayerColor;
        this.reconnectTimeoutSeconds = reconnectTimeoutSeconds;
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public PlayerColor getDisconnectedPlayerColor() {
        return disconnectedPlayerColor;
    }
    
    public void setDisconnectedPlayerColor(PlayerColor disconnectedPlayerColor) {
        this.disconnectedPlayerColor = disconnectedPlayerColor;
    }
    
    public int getReconnectTimeoutSeconds() {
        return reconnectTimeoutSeconds;
    }
    
    public void setReconnectTimeoutSeconds(int reconnectTimeoutSeconds) {
        this.reconnectTimeoutSeconds = reconnectTimeoutSeconds;
    }
}
