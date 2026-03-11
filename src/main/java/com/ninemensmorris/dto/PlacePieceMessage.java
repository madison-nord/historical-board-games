package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for placing a piece on the board.
 * 
 * Sent from client to server when a player places a piece during the placement phase.
 */
public class PlacePieceMessage {
    
    private String gameId;
    private String playerId;
    private int position;
    private PlayerColor playerColor;
    
    public PlacePieceMessage() {
    }
    
    public PlacePieceMessage(String gameId, String playerId, int position, PlayerColor playerColor) {
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
