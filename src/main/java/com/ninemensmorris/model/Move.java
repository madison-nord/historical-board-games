package com.ninemensmorris.model;

import java.util.Objects;

/**
 * Represents a move in Nine Men's Morris.
 * A move can be placing a piece, moving a piece, or removing an opponent's piece.
 */
public class Move {
    private final MoveType type;
    private final int from;      // -1 for placement moves
    private final int to;
    private final PlayerColor player;
    private int removed;         // -1 if no piece was removed
    
    /**
     * Creates a placement move (placing a new piece on the board).
     * 
     * @param to the position where the piece is placed
     * @param player the player making the move
     */
    public Move(MoveType type, int to, PlayerColor player) {
        if (type != MoveType.PLACE) {
            throw new IllegalArgumentException("This constructor is only for PLACE moves");
        }
        this.type = type;
        this.from = -1;
        this.to = to;
        this.player = player;
        this.removed = -1;
    }
    
    /**
     * Creates a movement move (moving a piece from one position to another).
     * 
     * @param type the type of move (should be MOVE)
     * @param from the source position
     * @param to the destination position
     * @param player the player making the move
     */
    public Move(MoveType type, int from, int to, PlayerColor player) {
        if (type == MoveType.PLACE) {
            throw new IllegalArgumentException("Use the other constructor for PLACE moves");
        }
        this.type = type;
        this.from = from;
        this.to = to;
        this.player = player;
        this.removed = -1;
    }
    
    /**
     * @return the type of this move
     */
    public MoveType getType() {
        return type;
    }
    
    /**
     * @return the source position, or -1 for placement moves
     */
    public int getFrom() {
        return from;
    }
    
    /**
     * @return the destination position
     */
    public int getTo() {
        return to;
    }
    
    /**
     * @return the player making this move
     */
    public PlayerColor getPlayer() {
        return player;
    }
    
    /**
     * @return the position of the removed piece, or -1 if no piece was removed
     */
    public int getRemoved() {
        return removed;
    }
    
    /**
     * Sets the position of a piece that was removed as a result of this move.
     * This is used when a mill is formed and an opponent's piece is removed.
     * 
     * @param position the position of the removed piece
     */
    public void setRemoved(int position) {
        this.removed = position;
    }
    
    /**
     * @return true if this move is a placement move
     */
    public boolean isPlacement() {
        return type == MoveType.PLACE;
    }
    
    /**
     * @return true if this move is a movement move
     */
    public boolean isMovement() {
        return type == MoveType.MOVE;
    }
    
    /**
     * @return true if this move is a removal move
     */
    public boolean isRemoval() {
        return type == MoveType.REMOVE;
    }
    
    /**
     * @return true if this move resulted in removing an opponent's piece
     */
    public boolean hasRemoval() {
        return removed != -1;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Move move = (Move) obj;
        return from == move.from &&
               to == move.to &&
               removed == move.removed &&
               type == move.type &&
               player == move.player;
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(type, from, to, player, removed);
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(player).append(" ");
        
        switch (type) {
            case PLACE -> sb.append("places at ").append(to);
            case MOVE -> sb.append("moves from ").append(from).append(" to ").append(to);
            case REMOVE -> sb.append("removes from ").append(to);
        }
        
        if (hasRemoval()) {
            sb.append(" (removes ").append(removed).append(")");
        }
        
        return sb.toString();
    }
}