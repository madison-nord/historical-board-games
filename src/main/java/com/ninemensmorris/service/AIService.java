package com.ninemensmorris.service;

import com.ninemensmorris.engine.Board;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.engine.RuleEngine;
import com.ninemensmorris.model.*;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * AI service for Nine Men's Morris that provides board position evaluation
 * and strategic decision-making capabilities.
 * 
 * This service implements a comprehensive evaluation function that considers:
 * - Piece count differences
 * - Mill formations
 * - Potential mills (2 pieces in a row)
 * - Mobility (number of legal moves)
 * - Blocked opponent pieces
 * 
 * The evaluation is designed to provide strategic AI gameplay that offers
 * a challenging experience for human players.
 */
@Service
public class AIService {
    
    private final RuleEngine ruleEngine;
    
    // Evaluation weights for different strategic factors
    private static final int PIECE_COUNT_WEIGHT = 100;
    private static final int MILL_WEIGHT = 50;
    private static final int POTENTIAL_MILL_WEIGHT = 10;
    private static final int MOBILITY_WEIGHT = 5;
    private static final int BLOCKED_PIECE_WEIGHT = 3;
    
    public AIService() {
        this.ruleEngine = new RuleEngine();
    }
    
    /**
     * Evaluates a board position from the perspective of the specified AI color.
     * 
     * @param state the current game state to evaluate
     * @param aiColor the color of the AI player
     * @return a score where positive values favor the AI, negative values favor the opponent
     * @throws IllegalArgumentException if state or aiColor is null
     */
    public int evaluatePosition(GameState state, PlayerColor aiColor) {
        if (state == null) {
            throw new IllegalArgumentException("Game state cannot be null");
        }
        if (aiColor == null) {
            throw new IllegalArgumentException("AI color cannot be null");
        }
        
        // Check for terminal positions first
        if (state.isGameOver()) {
            PlayerColor winner = state.getWinner();
            if (winner == aiColor) {
                return 10000; // AI wins
            } else if (winner == aiColor.opposite()) {
                return -10000; // AI loses
            } else {
                return 0; // Draw (shouldn't happen in Nine Men's Morris)
            }
        }
        
        PlayerColor opponent = aiColor.opposite();
        Board board = state.getBoard();
        
        int score = 0;
        
        // 1. Piece count difference
        score += evaluatePieceCount(state, aiColor, opponent);
        
        // 2. Mill formations
        score += evaluateMills(board, aiColor, opponent);
        
        // 3. Potential mills (2 pieces in a row)
        score += evaluatePotentialMills(board, aiColor, opponent);
        
        // 4. Mobility (number of legal moves)
        score += evaluateMobility(state, aiColor, opponent);
        
        // 5. Blocked opponent pieces
        score += evaluateBlockedPieces(state, board, aiColor, opponent);
        
        return score;
    }
    
    /**
     * Evaluates the piece count advantage.
     * More pieces on board is generally better, especially in the endgame.
     */
    private int evaluatePieceCount(GameState state, PlayerColor aiColor, PlayerColor opponent) {
        int aiPieces = state.getPiecesOnBoard(aiColor);
        int opponentPieces = state.getPiecesOnBoard(opponent);
        
        return (aiPieces - opponentPieces) * PIECE_COUNT_WEIGHT;
    }
    
    /**
     * Evaluates mill formations.
     * Mills are valuable as they allow piece removal and control key positions.
     */
    private int evaluateMills(Board board, PlayerColor aiColor, PlayerColor opponent) {
        int aiMills = countMills(board, aiColor);
        int opponentMills = countMills(board, opponent);
        
        return (aiMills - opponentMills) * MILL_WEIGHT;
    }
    
    /**
     * Counts the number of mills for a given player.
     */
    private int countMills(Board board, PlayerColor color) {
        int millCount = 0;
        
        // Check all mill patterns
        int[][] millPatterns = {
            {0, 1, 2}, {3, 4, 5}, {6, 7, 8},      // Outer square horizontal
            {9, 10, 11}, {12, 13, 14}, {15, 16, 17}, // Middle square horizontal
            {18, 19, 20}, {21, 22, 23},           // Inner square horizontal
            {0, 9, 21}, {3, 10, 18}, {6, 11, 15}, // Vertical lines left
            {1, 4, 7}, {16, 19, 22},              // Vertical lines center
            {8, 12, 17}, {5, 13, 20}, {2, 14, 23} // Vertical lines right
        };
        
        for (int[] pattern : millPatterns) {
            if (isMillFormed(board, pattern, color)) {
                millCount++;
            }
        }
        
        return millCount;
    }
    
    /**
     * Checks if a mill pattern is formed by the specified color.
     */
    private boolean isMillFormed(Board board, int[] positions, PlayerColor color) {
        for (int pos : positions) {
            if (board.isPositionEmpty(pos) || 
                board.getPosition(pos).getOccupant() != color) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Evaluates potential mills (2 pieces in a row with empty third position).
     * These represent immediate threats or opportunities.
     */
    private int evaluatePotentialMills(Board board, PlayerColor aiColor, PlayerColor opponent) {
        int aiPotentialMills = countPotentialMills(board, aiColor);
        int opponentPotentialMills = countPotentialMills(board, opponent);
        
        return (aiPotentialMills - opponentPotentialMills) * POTENTIAL_MILL_WEIGHT;
    }
    
    /**
     * Counts potential mills for a given player.
     */
    private int countPotentialMills(Board board, PlayerColor color) {
        int potentialCount = 0;
        
        int[][] millPatterns = {
            {0, 1, 2}, {3, 4, 5}, {6, 7, 8},      // Outer square horizontal
            {9, 10, 11}, {12, 13, 14}, {15, 16, 17}, // Middle square horizontal
            {18, 19, 20}, {21, 22, 23},           // Inner square horizontal
            {0, 9, 21}, {3, 10, 18}, {6, 11, 15}, // Vertical lines left
            {1, 4, 7}, {16, 19, 22},              // Vertical lines center
            {8, 12, 17}, {5, 13, 20}, {2, 14, 23} // Vertical lines right
        };
        
        for (int[] pattern : millPatterns) {
            if (isPotentialMill(board, pattern, color)) {
                potentialCount++;
            }
        }
        
        return potentialCount;
    }
    
    /**
     * Checks if a pattern represents a potential mill (2 pieces + 1 empty).
     */
    private boolean isPotentialMill(Board board, int[] positions, PlayerColor color) {
        int colorCount = 0;
        int emptyCount = 0;
        
        for (int pos : positions) {
            if (board.isPositionEmpty(pos)) {
                emptyCount++;
            } else if (board.getPosition(pos).getOccupant() == color) {
                colorCount++;
            } else {
                // Opponent piece blocks this potential mill
                return false;
            }
        }
        
        return colorCount == 2 && emptyCount == 1;
    }
    
    /**
     * Evaluates mobility - the number of legal moves available.
     * More mobility generally indicates better position control.
     */
    private int evaluateMobility(GameState state, PlayerColor aiColor, PlayerColor opponent) {
        int aiMobility = countMobility(state, aiColor);
        int opponentMobility = countMobility(state, opponent);
        
        return (aiMobility - opponentMobility) * MOBILITY_WEIGHT;
    }
    
    /**
     * Counts the number of legal moves for a player.
     */
    private int countMobility(GameState state, PlayerColor color) {
        List<Move> legalMoves = ruleEngine.generateLegalMoves(state, color);
        return legalMoves.size();
    }
    
    /**
     * Evaluates blocked opponent pieces.
     * Pieces that cannot move are strategically disadvantaged.
     */
    private int evaluateBlockedPieces(GameState state, Board board, PlayerColor aiColor, PlayerColor opponent) {
        // Only relevant in movement and flying phases
        if (state.getPhase() == GamePhase.PLACEMENT) {
            return 0;
        }
        
        int blockedOpponentPieces = countBlockedPieces(board, opponent);
        int blockedAIPieces = countBlockedPieces(board, aiColor);
        
        return (blockedOpponentPieces - blockedAIPieces) * BLOCKED_PIECE_WEIGHT;
    }
    
    /**
     * Counts pieces that have no legal moves available.
     */
    private int countBlockedPieces(Board board, PlayerColor color) {
        int blockedCount = 0;
        
        for (int i = 0; i < 24; i++) {
            if (!board.isPositionEmpty(i) && 
                board.getPosition(i).getOccupant() == color) {
                
                // Check if this piece can move to any adjacent position
                List<Integer> adjacentPositions = board.getAdjacentPositions(i);
                boolean canMove = false;
                
                for (int adjacent : adjacentPositions) {
                    if (board.isPositionEmpty(adjacent)) {
                        canMove = true;
                        break;
                    }
                }
                
                if (!canMove) {
                    blockedCount++;
                }
            }
        }
        
        return blockedCount;
    }
}