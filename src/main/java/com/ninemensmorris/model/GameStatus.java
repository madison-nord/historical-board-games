package com.ninemensmorris.model;

/**
 * Represents the current status of a game session.
 */
public enum GameStatus {
    /**
     * Game has been created but is waiting for players to join.
     * Used primarily for online multiplayer games.
     */
    WAITING,
    
    /**
     * Game is currently active and players are making moves.
     */
    IN_PROGRESS,
    
    /**
     * Game has finished with a winner or draw.
     */
    COMPLETED;
    
    /**
     * @return a human-readable description of this status
     */
    public String getDescription() {
        return switch (this) {
            case WAITING -> "Waiting for players";
            case IN_PROGRESS -> "Game in progress";
            case COMPLETED -> "Game completed";
        };
    }
    
    @Override
    public String toString() {
        return name().toLowerCase().replace('_', ' ');
    }
}