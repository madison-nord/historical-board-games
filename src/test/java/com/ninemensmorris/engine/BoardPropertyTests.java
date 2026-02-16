package com.ninemensmorris.engine;

import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Property-based tests for the Board class using jqwik.
 * These tests validate universal properties that should hold across all valid board states.
 */
class BoardPropertyTests {

    /**
     * Property 8: Movement Validation - Adjacency Relationships
     * Validates: Requirements 1.8
     * 
     * Tests that all adjacency relationships are bidirectional, no position is adjacent to itself,
     * and the adjacency map covers all 24 positions.
     */
    @Property(tries = 100)
    @Label("Property 8: Movement Validation - Adjacency relationships are bidirectional and complete")
    void testAdjacencyRelationshipsAreBidirectionalAndComplete(@ForAll @IntRange(min = 0, max = 23) int position) {
        Board board = new Board();
        
        // Test that adjacency map covers all 24 positions
        List<Integer> adjacentPositions = board.getAdjacentPositions(position);
        assertNotNull(adjacentPositions, "Adjacency list should not be null for position " + position);
        
        // Test that no position is adjacent to itself
        assertFalse(adjacentPositions.contains(position), 
            "Position " + position + " should not be adjacent to itself");
        
        // Test that all adjacency relationships are bidirectional
        for (Integer adjacentPos : adjacentPositions) {
            assertTrue(adjacentPos >= 0 && adjacentPos < 24, 
                "Adjacent position " + adjacentPos + " should be valid (0-23)");
            
            List<Integer> reverseAdjacent = board.getAdjacentPositions(adjacentPos);
            assertTrue(reverseAdjacent.contains(position), 
                "If position " + position + " is adjacent to " + adjacentPos + 
                ", then " + adjacentPos + " should be adjacent to " + position);
        }
        
        // Test that adjacent positions are within valid range
        for (Integer adjacentPos : adjacentPositions) {
            assertTrue(adjacentPos >= 0 && adjacentPos < 24, 
                "Adjacent position should be in valid range 0-23, got: " + adjacentPos);
        }
    }
    
    /**
     * Property test for board position validity.
     * Tests that all position indices from 0-23 are valid and accessible.
     */
    @Property(tries = 100)
    @Label("All board positions are accessible and valid")
    void testAllBoardPositionsAreValid(@ForAll @IntRange(min = 0, max = 23) int position) {
        Board board = new Board();
        
        // Should be able to get any position without exception
        assertDoesNotThrow(() -> board.getPosition(position), 
            "Should be able to access position " + position);
        
        // Should be able to check if position is empty without exception
        assertDoesNotThrow(() -> board.isPositionEmpty(position), 
            "Should be able to check if position " + position + " is empty");
        
        // Should be able to get adjacent positions without exception
        assertDoesNotThrow(() -> board.getAdjacentPositions(position), 
            "Should be able to get adjacent positions for " + position);
        
        // New board should have all positions empty
        assertTrue(board.isPositionEmpty(position), 
            "New board should have position " + position + " empty");
    }
    
    /**
     * Property test for invalid position indices.
     * Tests that accessing positions outside the valid range throws appropriate exceptions.
     */
    @Property(tries = 50)
    @Label("Invalid position indices throw appropriate exceptions")
    void testInvalidPositionIndicesThrowExceptions(@ForAll int invalidPosition) {
        Assume.that(invalidPosition < 0 || invalidPosition >= 24);
        
        Board board = new Board();
        
        // Should throw IllegalArgumentException for invalid positions
        assertThrows(IllegalArgumentException.class, 
            () -> board.getPosition(invalidPosition),
            "Should throw exception for invalid position " + invalidPosition);
        
        assertThrows(IllegalArgumentException.class, 
            () -> board.isPositionEmpty(invalidPosition),
            "Should throw exception when checking invalid position " + invalidPosition);
        
        assertThrows(IllegalArgumentException.class, 
            () -> board.getAdjacentPositions(invalidPosition),
            "Should throw exception when getting adjacents for invalid position " + invalidPosition);
    }
    
    /**
     * Property test for board cloning.
     * Tests that cloned boards are independent and equal to the original.
     */
    @Property(tries = 100)
    @Label("Board cloning creates independent equal copies")
    void testBoardCloningCreatesIndependentCopies(@ForAll @IntRange(min = 0, max = 23) int position) {
        Board originalBoard = new Board();
        Board clonedBoard = originalBoard.clone();
        
        // Cloned board should be equal to original
        assertEquals(originalBoard, clonedBoard, "Cloned board should equal original");
        
        // But should be different objects
        assertNotSame(originalBoard, clonedBoard, "Cloned board should be different object");
        
        // Both should have same adjacency relationships
        assertEquals(originalBoard.getAdjacentPositions(position), 
                    clonedBoard.getAdjacentPositions(position),
                    "Cloned board should have same adjacency for position " + position);
        
        // Both should have same empty state initially
        assertEquals(originalBoard.isPositionEmpty(position), 
                    clonedBoard.isPositionEmpty(position),
                    "Cloned board should have same empty state for position " + position);
    }
    
    /**
     * Property test for adjacency consistency.
     * Tests that the number of adjacencies is reasonable and consistent.
     */
    @Property(tries = 100)
    @Label("Adjacency counts are reasonable and consistent")
    void testAdjacencyCountsAreReasonable(@ForAll @IntRange(min = 0, max = 23) int position) {
        Board board = new Board();
        List<Integer> adjacentPositions = board.getAdjacentPositions(position);
        
        // Each position should have at least 1 and at most 4 adjacent positions
        // (based on Nine Men's Morris board geometry)
        assertTrue(adjacentPositions.size() >= 1, 
            "Position " + position + " should have at least 1 adjacent position");
        assertTrue(adjacentPositions.size() <= 4, 
            "Position " + position + " should have at most 4 adjacent positions");
        
        // No duplicate adjacent positions
        long uniqueCount = adjacentPositions.stream().distinct().count();
        assertEquals(adjacentPositions.size(), uniqueCount, 
            "Position " + position + " should not have duplicate adjacent positions");
    }
}