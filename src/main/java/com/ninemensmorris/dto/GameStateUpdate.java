package com.ninemensmorris.dto;

import com.ninemensmorris.model.PlayerColor;

/**
 * Message DTO for broadcasting game state updates to both players.
 * 
 * Sent from server to clients when the game state changes.
 */
public class GameStateUpdate {
    
    private String gameId;
    private PlayerColor currentPlayer;
    private String phase;
    private int whitePiecesRemaining;
    private int blackPiecesRemaining;
    private boolean millFormed;
    private boolean gameOver;
    private PlayerColor winner;
    
    public GameStateUpdate() {
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public PlayerColor getCurrentPlayer() {
        return currentPlayer;
    }
    
    public void setCurrentPlayer(PlayerColor currentPlayer) {
        this.currentPlayer = currentPlayer;
    }
    
    public String getPhase() {
        return phase;
    }
    
    public void setPhase(String phase) {
        this.phase = phase;
    }
    
    public int getWhitePiecesRemaining() {
        return whitePiecesRemaining;
    }
    
    public void setWhitePiecesRemaining(int whitePiecesRemaining) {
        this.whitePiecesRemaining = whitePiecesRemaining;
    }
    
    public int getBlackPiecesRemaining() {
        return blackPiecesRemaining;
    }
    
    public void setBlackPiecesRemaining(int blackPiecesRemaining) {
        this.blackPiecesRemaining = blackPiecesRemaining;
    }
    
    public boolean isMillFormed() {
        return millFormed;
    }
    
    public void setMillFormed(boolean millFormed) {
        this.millFormed = millFormed;
    }
    
    public boolean isGameOver() {
        return gameOver;
    }
    
    public void setGameOver(boolean gameOver) {
        this.gameOver = gameOver;
    }
    
    public PlayerColor getWinner() {
        return winner;
    }
    
    public void setWinner(PlayerColor winner) {
        this.winner = winner;
    }
}
