package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for moving a piece on the board.
 * 
 * Sent from client to server when a player moves a piece during movement or flying phase.
 */
public class MovePieceMessage {
    
    private String gameId;
    private String playerId;
    private int fromPosition;
    private int toPosition;
    private PlayerColor playerColor;
    
    public MovePieceMessage() {
    }
    
    public MovePieceMessage(String gameId, String playerId, int fromPosition, int toPosition, PlayerColor playerColor) {
        this.gameId = gameId;
        this.playerId = playerId;
        this.fromPosition = fromPosition;
        this.toPosition = toPosition;
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
    
    public int getFromPosition() {
        return fromPosition;
    }
    
    public void setFromPosition(int fromPosition) {
        this.fromPosition = fromPosition;
    }
    
    public int getToPosition() {
        return toPosition;
    }
    
    public void setToPosition(int toPosition) {
        this.toPosition = toPosition;
    }
    
    public PlayerColor getPlayerColor() {
        return playerColor;
    }
    
    public void setPlayerColor(PlayerColor playerColor) {
        this.playerColor = playerColor;
    }
}
