package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for notifying players that a game has started.
 * 
 * Sent from server to both clients when matchmaking finds a match.
 */
public class GameStartMessage {
    
    private String gameId;
    private String player1Id;
    private String player2Id;
    private PlayerColor player1Color;
    private PlayerColor player2Color;
    
    public GameStartMessage() {
    }
    
    public GameStartMessage(String gameId, String player1Id, String player2Id, 
                           PlayerColor player1Color, PlayerColor player2Color) {
        this.gameId = gameId;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.player1Color = player1Color;
        this.player2Color = player2Color;
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public String getPlayer1Id() {
        return player1Id;
    }
    
    public void setPlayer1Id(String player1Id) {
        this.player1Id = player1Id;
    }
    
    public String getPlayer2Id() {
        return player2Id;
    }
    
    public void setPlayer2Id(String player2Id) {
        this.player2Id = player2Id;
    }
    
    public PlayerColor getPlayer1Color() {
        return player1Color;
    }
    
    public void setPlayer1Color(PlayerColor player1Color) {
        this.player1Color = player1Color;
    }
    
    public PlayerColor getPlayer2Color() {
        return player2Color;
    }
    
    public void setPlayer2Color(PlayerColor player2Color) {
        this.player2Color = player2Color;
    }
}
