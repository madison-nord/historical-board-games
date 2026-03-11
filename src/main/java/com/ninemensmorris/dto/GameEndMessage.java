package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for notifying players that a game has ended.
 * 
 * Sent from server to both clients when the game concludes.
 */
public class GameEndMessage {
    
    private String gameId;
    private PlayerColor winner;
    private String reason;
    
    public GameEndMessage() {
    }
    
    public GameEndMessage(String gameId, PlayerColor winner, String reason) {
        this.gameId = gameId;
        this.winner = winner;
        this.reason = reason;
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public PlayerColor getWinner() {
        return winner;
    }
    
    public void setWinner(PlayerColor winner) {
        this.winner = winner;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
}
