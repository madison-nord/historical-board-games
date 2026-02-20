package com.ninemensmorris.engine;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.model.Position;

/**
 * Represents the Nine Men's Morris game board with 24 positions arranged in three concentric squares.
 * 
 * The board positions are numbered 0-23 following the STANDARD Nine Men's Morris layout:
 * - Positions 0-7: Outer square (8 positions: 4 corners + 4 midpoints)
 * - Positions 8-15: Middle square (8 positions: 4 corners + 4 midpoints)
 * - Positions 16-23: Inner square (8 positions: 4 corners + 4 midpoints)
 * 
 * Layout (clockwise from top-left):
 * Outer:  0---1---2
 *         |       |
 *         7       3
 *         |       |
 *         6---5---4
 * 
 * Middle: 8---9--10
 *         |       |
 *        15      11
 *         |       |
 *        14--13--12
 * 
 * Inner: 16--17--18
 *         |       |
 *        23      19
 *         |       |
 *        22--21--20
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
     * There are 16 possible mills total (6 horizontal + 6 vertical edges + 4 radial).
     */
    private static final int[][] MILL_PATTERNS = {
        // Horizontal mills (6 total)
        // Outer square
        {0, 1, 2},    // Top row
        {6, 5, 4},    // Bottom row
        // Middle square
        {8, 9, 10},   // Top row
        {14, 13, 12}, // Bottom row
        // Inner square
        {16, 17, 18}, // Top row
        {22, 21, 20}, // Bottom row
        
        // Vertical mills - edges (6 total)
        // Left edges
        {0, 7, 6},    // Outer left
        {8, 15, 14},  // Middle left
        {16, 23, 22}, // Inner left
        // Right edges
        {2, 3, 4},    // Outer right
        {10, 11, 12}, // Middle right
        {18, 19, 20}, // Inner right
        
        // Radial mills - connecting across squares (4 total)
        {1, 9, 17},   // Top center
        {3, 11, 19},  // Right center
        {5, 13, 21},  // Bottom center
        {7, 15, 23}   // Left center
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
     * Initializes the adjacency map based on the STANDARD Nine Men's Morris board layout.
     * Each position is connected to its adjacent positions according to the game rules.
     * 
     * Standard layout (8 positions per square, clockwise from top-left):
     * Outer:  0-1-2-3-4-5-6-7 (corners at 0,2,4,6; midpoints at 1,3,5,7)
     * Middle: 8-9-10-11-12-13-14-15
     * Inner:  16-17-18-19-20-21-22-23
     * 
     * @return the initialized adjacency map
     */
    private Map<Integer, List<Integer>> initializeAdjacencyMap() {
        Map<Integer, List<Integer>> map = new HashMap<>();
        
        // Outer square (positions 0-7) - clockwise from top-left
        map.put(0, Arrays.asList(1, 7));      // Top-left corner: right, left
        map.put(1, Arrays.asList(0, 2, 9));   // Top middle: left, right, inward
        map.put(2, Arrays.asList(1, 3));      // Top-right corner: left, down
        map.put(3, Arrays.asList(2, 4, 11));  // Right middle: up, down, inward
        map.put(4, Arrays.asList(3, 5));      // Bottom-right corner: up, left
        map.put(5, Arrays.asList(4, 6, 13));  // Bottom middle: right, left, inward
        map.put(6, Arrays.asList(5, 7));      // Bottom-left corner: right, up
        map.put(7, Arrays.asList(6, 0, 15));  // Left middle: down, up, inward
        
        // Middle square (positions 8-15) - clockwise from top-left
        map.put(8, Arrays.asList(9, 15));      // Top-left corner: right, left
        map.put(9, Arrays.asList(8, 10, 1, 17)); // Top middle: left, right, outward, inward
        map.put(10, Arrays.asList(9, 11));     // Top-right corner: left, down
        map.put(11, Arrays.asList(10, 12, 3, 19)); // Right middle: up, down, outward, inward
        map.put(12, Arrays.asList(11, 13));    // Bottom-right corner: up, left
        map.put(13, Arrays.asList(12, 14, 5, 21)); // Bottom middle: right, left, outward, inward
        map.put(14, Arrays.asList(13, 15));    // Bottom-left corner: right, up
        map.put(15, Arrays.asList(14, 8, 7, 23)); // Left middle: down, up, outward, inward
        
        // Inner square (positions 16-23) - clockwise from top-left
        map.put(16, Arrays.asList(17, 23));    // Top-left corner: right, left
        map.put(17, Arrays.asList(16, 18, 9)); // Top middle: left, right, outward
        map.put(18, Arrays.asList(17, 19));    // Top-right corner: left, down
        map.put(19, Arrays.asList(18, 20, 11)); // Right middle: up, down, outward
        map.put(20, Arrays.asList(19, 21));    // Bottom-right corner: up, left
        map.put(21, Arrays.asList(20, 22, 13)); // Bottom middle: right, left, outward
        map.put(22, Arrays.asList(21, 23));    // Bottom-left corner: right, up
        map.put(23, Arrays.asList(22, 16, 15)); // Left middle: down, up, outward
        
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