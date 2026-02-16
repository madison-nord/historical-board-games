package com.ninemensmorris.model;

/**
 * Represents the three phases of a Nine Men's Morris game.
 * The game progresses through these phases based on the number of pieces
 * each player has remaining and on the board.
 */
public enum GamePhase {
    /**
     * Initial phase where players place their 9 pieces on the board.
     * Players alternate placing one piece at a time on empty positions.
     */
    PLACEMENT,
    
    /**
     * Phase where players move their pieces to adjacent empty positions.
     * Occurs when all pieces have been placed and both players have more than 3 pieces.
     */
    MOVEMENT,
    
    /**
     * Phase where a player with exactly 3 pieces can move to any empty position.
     * Not restricted to adjacent positions like in the movement phase.
     */
    FLYING;
    
    /**
     * @return a human-readable description of this phase
     */
    public String getDescription() {
        return switch (this) {
            case PLACEMENT -> "Place your pieces on the board";
            case MOVEMENT -> "Move your pieces to adjacent positions";
            case FLYING -> "Move your pieces to any empty position";
        };
    }
    
    @Override
    public String toString() {
        return name().toLowerCase();
    }
}