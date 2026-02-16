package com.ninemensmorris.model;

/**
 * Represents the different types of moves that can be made in Nine Men's Morris.
 */
public enum MoveType {
    /**
     * Place a new piece on the board during the placement phase.
     */
    PLACE,
    
    /**
     * Move an existing piece from one position to another.
     * Can be either adjacent movement or flying movement depending on game phase.
     */
    MOVE,
    
    /**
     * Remove an opponent's piece after forming a mill.
     * This is a special action that occurs after a mill is formed.
     */
    REMOVE;
    
    /**
     * @return a human-readable description of this move type
     */
    public String getDescription() {
        return switch (this) {
            case PLACE -> "Place a piece";
            case MOVE -> "Move a piece";
            case REMOVE -> "Remove opponent's piece";
        };
    }
    
    @Override
    public String toString() {
        return name().toLowerCase();
    }
}