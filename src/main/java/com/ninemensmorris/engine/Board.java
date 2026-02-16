package com.ninemensmorris.engine;

import com.ninemensmorris.model.Position;
import com.ninemensmorris.model.PlayerColor;

import java.util.*;

/**
 * Represents the Nine Men's Morris game board with 24 positions arranged in three concentric squares.
 * 
 * The board positions are numbered 0-23 following the standard Nine Men's Morris layout:
 * - Positions 0-8: Outer square
 * - Positions 9-17: Middle square  
 * - Positions 18-23: Inner square
 * 
 * This class manages position states, adjacency relationships, and mill pattern detection.
 */
public class Board {
    
    /**
     * Array of 24 positions representing the Nine Men's Morris board.
     * Positions are numbered 0-23 in the standard layout.
     */
    private final Position[] positions;
    
    /**
     * Adjacency map defining which positions are connected to each other.
     * Used for validating movement in the MOVEMENT phase.
     */
    private final Map<Integer, List<Integer>> adjacencyMap;
    
    /**
     * All possible mill configurations on the Nine Men's Morris board.
     * A mill is formed when three pieces of the same color are in a straight line.
     * There are 16 possible mills total.
     */
    private static final int[][] MILL_PATTERNS = {
        // Outer square horizontal lines
        {0, 1, 2}, {3, 4, 5}, {6, 7, 8},
        // Middle square horizontal lines
        {9, 10, 11}, {12, 13, 14}, {15, 16, 17},
        // Inner square horizontal lines
        {18, 19, 20}, {21, 22, 23},
        // Vertical lines connecting all three squares
        {0, 9, 21}, {3, 10, 18}, {6, 11, 15},
        {1, 4, 7}, {16, 19, 22},
        {8, 12, 17}, {5, 13, 20}, {2, 14, 23}
    };
    
    /**
     * Creates a new Nine Men's Morris board with all positions empty.
     * Initializes the 24 positions and sets up the adjacency relationships.
     */
    public Board() {
        this.positions = new Position[24];
        for (int i = 0; i < 24; i++) {
            this.positions[i] = new Position(i);
        }
        this.adjacencyMap = initializeAdjacencyMap();
    }
    
    /**
     * Copy constructor for creating a deep copy of the board.
     * 
     * @param other the board to copy
     */
    private Board(Board other) {
        this.positions = new Position[24];
        for (int i = 0; i < 24; i++) {
            this.positions[i] = new Position(i);
            if (!other.positions[i].isEmpty()) {
                this.positions[i].setOccupant(other.positions[i].getOccupant());
            }
        }
        this.adjacencyMap = other.adjacencyMap; // Immutable, can share reference
    }
    
    /**
     * Initializes the adjacency map based on the Nine Men's Morris board layout.
     * Each position is connected to its adjacent positions according to the game rules.
     * 
     * @return the initialized adjacency map
     */
    private Map<Integer, List<Integer>> initializeAdjacencyMap() {
        Map<Integer, List<Integer>> map = new HashMap<>();
        
        // Outer square (positions 0-8)
        map.put(0, Arrays.asList(1, 9));
        map.put(1, Arrays.asList(0, 2, 4));
        map.put(2, Arrays.asList(1, 14));
        map.put(3, Arrays.asList(4, 10));
        map.put(4, Arrays.asList(1, 3, 5, 7));
        map.put(5, Arrays.asList(4, 13));
        map.put(6, Arrays.asList(7, 11));
        map.put(7, Arrays.asList(4, 6, 8));
        map.put(8, Arrays.asList(7, 12));
        
        // Middle square (positions 9-17)
        map.put(9, Arrays.asList(0, 10, 21));
        map.put(10, Arrays.asList(3, 9, 11, 18));
        map.put(11, Arrays.asList(6, 10, 15));
        map.put(12, Arrays.asList(8, 13, 17));
        map.put(13, Arrays.asList(5, 12, 14, 20));
        map.put(14, Arrays.asList(2, 13, 23));
        map.put(15, Arrays.asList(11, 16));
        map.put(16, Arrays.asList(15, 17, 19));
        map.put(17, Arrays.asList(12, 16));
        
        // Inner square (positions 18-23)
        map.put(18, Arrays.asList(10, 19));
        map.put(19, Arrays.asList(16, 18, 20, 22));
        map.put(20, Arrays.asList(13, 19));
        map.put(21, Arrays.asList(9, 22));
        map.put(22, Arrays.asList(19, 21, 23));
        map.put(23, Arrays.asList(14, 22));
        
        return Collections.unmodifiableMap(map);
    }
    
    /**
     * Gets the position at the specified index.
     * 
     * @param index the position index (0-23)
     * @return the position at the specified index
     * @throws IllegalArgumentException if index is not between 0 and 23
     */
    public Position getPosition(int index) {
        if (index < 0 || index >= 24) {
            throw new IllegalArgumentException("Position index must be between 0 and 23, got: " + index);
        }
        return positions[index];
    }
    
    /**
     * Checks if the position at the specified index is empty.
     * 
     * @param index the position index (0-23)
     * @return true if the position is empty, false otherwise
     * @throws IllegalArgumentException if index is not between 0 and 23
     */
    public boolean isPositionEmpty(int index) {
        return getPosition(index).isEmpty();
    }
    
    /**
     * Gets the list of positions adjacent to the specified position.
     * Adjacent positions are those connected by lines on the board.
     * 
     * @param index the position index (0-23)
     * @return an unmodifiable list of adjacent position indices
     * @throws IllegalArgumentException if index is not between 0 and 23
     */
    public List<Integer> getAdjacentPositions(int index) {
        if (index < 0 || index >= 24) {
            throw new IllegalArgumentException("Position index must be between 0 and 23, got: " + index);
        }
        return adjacencyMap.get(index);
    }
    
    /**
     * Checks if a placement at the specified position is valid.
     * A placement is valid if the position is empty.
     * 
     * @param index the position index (0-23)
     * @return true if placement is valid, false otherwise
     * @throws IllegalArgumentException if index is not between 0 and 23
     */
    public boolean isValidPlacement(int index) {
        return isPositionEmpty(index);
    }
    
    /**
     * Gets all mill patterns that contain pieces of the specified color.
     * 
     * @param color the player color to check for mills
     * @return a list of mill patterns (each pattern is an array of 3 position indices)
     */
    public List<int[]> getMillsForPlayer(PlayerColor color) {
        List<int[]> mills = new ArrayList<>();
        
        for (int[] pattern : MILL_PATTERNS) {
            if (positions[pattern[0]].getOccupant() == color &&
                positions[pattern[1]].getOccupant() == color &&
                positions[pattern[2]].getOccupant() == color) {
                mills.add(pattern.clone());
            }
        }
        
        return mills;
    }
    
    /**
     * Checks if the piece at the specified position is part of a mill.
     * 
     * @param position the position index to check
     * @param color the color of the piece
     * @return true if the position is part of a mill, false otherwise
     * @throws IllegalArgumentException if position is not between 0 and 23
     */
    public boolean isPartOfMill(int position, PlayerColor color) {
        if (position < 0 || position >= 24) {
            throw new IllegalArgumentException("Position index must be between 0 and 23, got: " + position);
        }
        
        for (int[] pattern : MILL_PATTERNS) {
            // Check if this position is in the pattern
            boolean positionInPattern = false;
            for (int pos : pattern) {
                if (pos == position) {
                    positionInPattern = true;
                    break;
                }
            }
            
            if (positionInPattern) {
                // Check if all positions in this pattern have the same color
                if (positions[pattern[0]].getOccupant() == color &&
                    positions[pattern[1]].getOccupant() == color &&
                    positions[pattern[2]].getOccupant() == color) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Creates a deep copy of this board.
     * 
     * @return a new Board instance with the same state as this board
     */
    @Override
    public Board clone() {
        return new Board(this);
    }
    
    /**
     * Gets the mill patterns constant for testing purposes.
     * 
     * @return the mill patterns array
     */
    public static int[][] getMillPatterns() {
        return MILL_PATTERNS.clone();
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        Board board = (Board) obj;
        return Arrays.equals(positions, board.positions);
    }
    
    @Override
    public int hashCode() {
        return Arrays.hashCode(positions);
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Board state:\n");
        
        for (int i = 0; i < 24; i++) {
            Position pos = positions[i];
            sb.append(String.format("Position %2d: %s\n", i, 
                pos.isEmpty() ? "Empty" : pos.getOccupant().toString()));
        }
        
        return sb.toString();
    }
}