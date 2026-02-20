package com.ninemensmorris.engine;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.model.Position;

/**
 * Unit tests for the Board class.
 * Tests specific examples, edge cases, and board initialization.
 */
@DisplayName("Board")
class BoardTest {

    private Board board;

    @BeforeEach
    void setUp() {
        board = new Board();
    }

    @Nested
    @DisplayName("Initialization")
    class Initialization {

        @Test
        @DisplayName("should create board with 24 empty positions")
        void shouldCreateBoardWith24EmptyPositions() {
            // Test that new board has 24 empty positions
            for (int i = 0; i < 24; i++) {
                assertTrue(board.isPositionEmpty(i), 
                    "Position " + i + " should be empty on new board");
                
                Position position = board.getPosition(i);
                assertNotNull(position, "Position " + i + " should not be null");
                assertTrue(position.isEmpty(), "Position " + i + " should be empty");
                assertEquals(i, position.getIndex(), "Position should have correct index");
            }
        }

        @Test
        @DisplayName("should have correct mill patterns")
        void shouldHaveCorrectMillPatterns() {
            // STANDARD Nine Men's Morris: 16 mills (6 horizontal + 6 vertical edges + 4 radial)
            int[][] expectedMillPatterns = {
                // Horizontal mills (6)
                {0, 1, 2}, {6, 5, 4},      // Outer
                {8, 9, 10}, {14, 13, 12},  // Middle
                {16, 17, 18}, {22, 21, 20}, // Inner
                
                // Vertical mills - edges (6)
                {0, 7, 6}, {8, 15, 14}, {16, 23, 22}, // Left edges
                {2, 3, 4}, {10, 11, 12}, {18, 19, 20}, // Right edges
                
                // Radial mills (4)
                {1, 9, 17}, {3, 11, 19}, {5, 13, 21}, {7, 15, 23}
            };

            int[][] actualMillPatterns = Board.getMillPatterns();
            
            // Test that MILL_PATTERNS contains all 16 mills
            assertEquals(16, actualMillPatterns.length, "Should have exactly 16 mill patterns");
            
            // Test each expected pattern exists
            for (int[] expectedPattern : expectedMillPatterns) {
                boolean found = false;
                for (int[] actualPattern : actualMillPatterns) {
                    if (Arrays.equals(expectedPattern, actualPattern)) {
                        found = true;
                        break;
                    }
                }
                assertTrue(found, "Mill pattern " + Arrays.toString(expectedPattern) + " should exist");
            }
        }

        @Test
        @DisplayName("should have correct adjacency map")
        void shouldHaveCorrectAdjacencyMap() {
            // Test specific adjacency relationships based on STANDARD Nine Men's Morris layout
            // Outer square (0-7): 8 positions clockwise from top-left
            
            // Corner positions of outer square
            assertEquals(Arrays.asList(1, 7), board.getAdjacentPositions(0)); // Top-left
            assertEquals(Arrays.asList(1, 3), board.getAdjacentPositions(2)); // Top-right
            assertEquals(Arrays.asList(3, 5), board.getAdjacentPositions(4)); // Bottom-right
            assertEquals(Arrays.asList(5, 7), board.getAdjacentPositions(6)); // Bottom-left
            
            // Midpoint positions of outer square (connect to adjacent square)
            assertEquals(Arrays.asList(0, 2, 9), board.getAdjacentPositions(1)); // Top midpoint
            assertEquals(Arrays.asList(2, 4, 11), board.getAdjacentPositions(3)); // Right midpoint
            assertEquals(Arrays.asList(4, 6, 13), board.getAdjacentPositions(5)); // Bottom midpoint
            assertEquals(Arrays.asList(6, 0, 15), board.getAdjacentPositions(7)); // Left midpoint
            
            // Middle square (8-15): 8 positions clockwise from top-left
            assertEquals(Arrays.asList(9, 15), board.getAdjacentPositions(8)); // Top-left corner
            assertEquals(Arrays.asList(8, 10, 1, 17), board.getAdjacentPositions(9)); // Top midpoint
            assertEquals(Arrays.asList(9, 11), board.getAdjacentPositions(10)); // Top-right corner
            assertEquals(Arrays.asList(10, 12, 3, 19), board.getAdjacentPositions(11)); // Right midpoint
            assertEquals(Arrays.asList(11, 13), board.getAdjacentPositions(12)); // Bottom-right corner
            assertEquals(Arrays.asList(12, 14, 5, 21), board.getAdjacentPositions(13)); // Bottom midpoint
            assertEquals(Arrays.asList(13, 15), board.getAdjacentPositions(14)); // Bottom-left corner
            assertEquals(Arrays.asList(14, 8, 7, 23), board.getAdjacentPositions(15)); // Left midpoint
            
            // Inner square (16-23): 8 positions clockwise from top-left
            assertEquals(Arrays.asList(17, 23), board.getAdjacentPositions(16)); // Top-left corner
            assertEquals(Arrays.asList(16, 18, 9), board.getAdjacentPositions(17)); // Top midpoint
            assertEquals(Arrays.asList(17, 19), board.getAdjacentPositions(18)); // Top-right corner
            assertEquals(Arrays.asList(18, 20, 11), board.getAdjacentPositions(19)); // Right midpoint
            assertEquals(Arrays.asList(19, 21), board.getAdjacentPositions(20)); // Bottom-right corner
            assertEquals(Arrays.asList(20, 22, 13), board.getAdjacentPositions(21)); // Bottom midpoint
            assertEquals(Arrays.asList(21, 23), board.getAdjacentPositions(22)); // Bottom-left corner
            assertEquals(Arrays.asList(22, 16, 15), board.getAdjacentPositions(23)); // Left midpoint
        }
    }

    @Nested
    @DisplayName("Position Access")
    class PositionAccess {

        @Test
        @DisplayName("should return correct position for valid indices")
        void shouldReturnCorrectPositionForValidIndices() {
            for (int i = 0; i < 24; i++) {
                Position position = board.getPosition(i);
                assertNotNull(position);
                assertEquals(i, position.getIndex());
            }
        }

        @Test
        @DisplayName("should throw exception for invalid indices")
        void shouldThrowExceptionForInvalidIndices() {
            assertThrows(IllegalArgumentException.class, () -> board.getPosition(-1));
            assertThrows(IllegalArgumentException.class, () -> board.getPosition(24));
            assertThrows(IllegalArgumentException.class, () -> board.getPosition(100));
        }

        @Test
        @DisplayName("should correctly check if positions are empty")
        void shouldCorrectlyCheckIfPositionsAreEmpty() {
            // All positions should be empty initially
            for (int i = 0; i < 24; i++) {
                assertTrue(board.isPositionEmpty(i));
            }
            
            // Place a piece and check
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            assertFalse(board.isPositionEmpty(0));
            assertTrue(board.isPositionEmpty(1)); // Other positions still empty
        }
    }

    @Nested
    @DisplayName("Mill Detection")
    class MillDetection {

        @Test
        @DisplayName("should detect no mills on empty board")
        void shouldDetectNoMillsOnEmptyBoard() {
            List<int[]> whiteMills = board.getMillsForPlayer(PlayerColor.WHITE);
            List<int[]> blackMills = board.getMillsForPlayer(PlayerColor.BLACK);
            
            assertTrue(whiteMills.isEmpty(), "Empty board should have no white mills");
            assertTrue(blackMills.isEmpty(), "Empty board should have no black mills");
        }

        @Test
        @DisplayName("should detect mill when three pieces form a line")
        void shouldDetectMillWhenThreePiecesFormLine() {
            // Create a mill with white pieces at positions 0, 1, 2
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            board.getPosition(1).setOccupant(PlayerColor.WHITE);
            board.getPosition(2).setOccupant(PlayerColor.WHITE);
            
            List<int[]> whiteMills = board.getMillsForPlayer(PlayerColor.WHITE);
            assertEquals(1, whiteMills.size(), "Should detect exactly one white mill");
            
            int[] mill = whiteMills.get(0);
            Arrays.sort(mill); // Sort for comparison
            assertArrayEquals(new int[]{0, 1, 2}, mill, "Should detect mill at positions 0, 1, 2");
        }

        @Test
        @DisplayName("should detect if position is part of mill")
        void shouldDetectIfPositionIsPartOfMill() {
            // Create a mill with white pieces at positions 0, 1, 2
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            board.getPosition(1).setOccupant(PlayerColor.WHITE);
            board.getPosition(2).setOccupant(PlayerColor.WHITE);
            
            assertTrue(board.isPartOfMill(0, PlayerColor.WHITE), "Position 0 should be part of mill");
            assertTrue(board.isPartOfMill(1, PlayerColor.WHITE), "Position 1 should be part of mill");
            assertTrue(board.isPartOfMill(2, PlayerColor.WHITE), "Position 2 should be part of mill");
            
            assertFalse(board.isPartOfMill(3, PlayerColor.WHITE), "Position 3 should not be part of mill");
            assertFalse(board.isPartOfMill(0, PlayerColor.BLACK), "Position 0 should not be part of black mill");
        }

        @Test
        @DisplayName("should not detect mill with mixed colors")
        void shouldNotDetectMillWithMixedColors() {
            // Place mixed colors in potential mill positions
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            board.getPosition(1).setOccupant(PlayerColor.BLACK);
            board.getPosition(2).setOccupant(PlayerColor.WHITE);
            
            List<int[]> whiteMills = board.getMillsForPlayer(PlayerColor.WHITE);
            List<int[]> blackMills = board.getMillsForPlayer(PlayerColor.BLACK);
            
            assertTrue(whiteMills.isEmpty(), "Should not detect white mill with mixed colors");
            assertTrue(blackMills.isEmpty(), "Should not detect black mill with mixed colors");
        }
    }

    @Nested
    @DisplayName("Board Cloning")
    class BoardCloning {

        @Test
        @DisplayName("should create independent copy")
        void shouldCreateIndependentCopy() {
            // Modify original board
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            board.getPosition(5).setOccupant(PlayerColor.BLACK);
            
            Board clonedBoard = board.clone();
            
            // Should be equal but not same object
            assertEquals(board, clonedBoard);
            assertNotSame(board, clonedBoard);
            
            // Modifications to clone should not affect original
            clonedBoard.getPosition(10).setOccupant(PlayerColor.WHITE);
            
            assertTrue(board.isPositionEmpty(10), "Original board position 10 should remain empty");
            assertFalse(clonedBoard.isPositionEmpty(10), "Cloned board position 10 should be occupied");
        }

        @Test
        @DisplayName("should preserve all position states")
        void shouldPreserveAllPositionStates() {
            // Set up various positions
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            board.getPosition(5).setOccupant(PlayerColor.BLACK);
            board.getPosition(10).setOccupant(PlayerColor.WHITE);
            
            Board clonedBoard = board.clone();
            
            // Check all positions match
            for (int i = 0; i < 24; i++) {
                assertEquals(board.isPositionEmpty(i), clonedBoard.isPositionEmpty(i),
                    "Position " + i + " empty state should match");
                
                if (!board.isPositionEmpty(i)) {
                    assertEquals(board.getPosition(i).getOccupant(), 
                               clonedBoard.getPosition(i).getOccupant(),
                               "Position " + i + " occupant should match");
                }
            }
        }
    }

    @Nested
    @DisplayName("Validation")
    class Validation {

        @Test
        @DisplayName("should validate placement on empty positions")
        void shouldValidatePlacementOnEmptyPositions() {
            // All positions should be valid for placement initially
            for (int i = 0; i < 24; i++) {
                assertTrue(board.isValidPlacement(i), 
                    "Position " + i + " should be valid for placement when empty");
            }
            
            // After placing a piece, position should not be valid for placement
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            assertFalse(board.isValidPlacement(0), 
                "Position 0 should not be valid for placement when occupied");
        }

        @Test
        @DisplayName("should throw exception for invalid position in mill check")
        void shouldThrowExceptionForInvalidPositionInMillCheck() {
            assertThrows(IllegalArgumentException.class, 
                () -> board.isPartOfMill(-1, PlayerColor.WHITE));
            assertThrows(IllegalArgumentException.class, 
                () -> board.isPartOfMill(24, PlayerColor.WHITE));
        }
    }

    @Nested
    @DisplayName("String Representation")
    class StringRepresentation {

        @Test
        @DisplayName("should provide meaningful string representation")
        void shouldProvideMeaningfulStringRepresentation() {
            String boardString = board.toString();
            
            assertNotNull(boardString);
            assertTrue(boardString.contains("Board state:"), "Should contain board state header");
            assertTrue(boardString.contains("Position"), "Should contain position information");
            assertTrue(boardString.contains("Empty"), "Should show empty positions");
        }

        @Test
        @DisplayName("should show occupied positions in string representation")
        void shouldShowOccupiedPositionsInStringRepresentation() {
            board.getPosition(0).setOccupant(PlayerColor.WHITE);
            board.getPosition(5).setOccupant(PlayerColor.BLACK);
            
            String boardString = board.toString();
            
            assertTrue(boardString.contains("white"), "Should show white pieces");
            assertTrue(boardString.contains("black"), "Should show black pieces");
        }
    }
}