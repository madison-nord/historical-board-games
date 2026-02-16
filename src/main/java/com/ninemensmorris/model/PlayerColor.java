package com.ninemensmorris.model;

/**
 * Represents the two player colors in Nine Men's Morris.
 * WHITE always goes first according to traditional rules.
 */
public enum PlayerColor {
    WHITE,
    BLACK;
    
    /**
     * @return the opposite player color
     */
    public PlayerColor opposite() {
        return this == WHITE ? BLACK : WHITE;
    }
    
    /**
     * @return a human-readable string representation
     */
    @Override
    public String toString() {
        return name().toLowerCase();
    }
}