package com.ninemensmorris.model;

/**
 * Represents a single position on the Nine Men's Morris board.
 * Each position has an index (0-23) and can be empty or occupied by a player.
 */
public class Position {
    private final int index;
    private PlayerColor occupant;
    
    /**
     * Creates a new position with the given index.
     * The position starts empty (no occupant).
     * 
     * @param index the position index (0-23)
     */
    public Position(int index) {
        this.index = index;
        this.occupant = null;
    }
    
    /**
     * @return the position index (0-23)
     */
    public int getIndex() {
        return index;
    }
    
    /**
     * @return true if the position is empty (no occupant)
     */
    public boolean isEmpty() {
        return occupant == null;
    }
    
    /**
     * @return the color of the piece occupying this position, or null if empty
     */
    public PlayerColor getOccupant() {
        return occupant;
    }
    
    /**
     * Sets the occupant of this position.
     * 
     * @param color the color of the piece to place, or null to clear
     */
    public void setOccupant(PlayerColor color) {
        this.occupant = color;
    }
    
    /**
     * Clears this position, making it empty.
     */
    public void clear() {
        this.occupant = null;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Position position = (Position) obj;
        return index == position.index && occupant == position.occupant;
    }
    
    @Override
    public int hashCode() {
        return java.util.Objects.hash(index, occupant);
    }
    
    @Override
    public String toString() {
        return "Position{" +
                "index=" + index +
                ", occupant=" + occupant +
                '}';
    }
}