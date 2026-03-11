package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for removing an opponent's piece after forming a mill.
 * 
 * Sent from client to server when a player removes an opponent's piece.
 */
public class RemovePieceMessage {
    
    private String gameId;
    private String playerId;
    private int position;
    private PlayerColor playerColor;
    
    public RemovePieceMessage() {
    }
    
    public RemovePieceMessage(String gameId, String playerId, int position, PlayerColor playerColor) {
        this.gameId = gameId;
        this.playerId = playerId;
        this.position = position;
        this.playerColor = playerColor;
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
    
    public int getPosition() {
        return position;
    }
    
    public void setPosition(int position) {
        this.position = position;
    }
    
    public PlayerColor getPlayerColor() {
        return playerColor;
    }
    
    public void setPlayerColor(PlayerColor playerColor) {
        this.playerColor = playerColor;
    }
}
