package com.ninemensmorris.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.ninemensmorris.engine.Board;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.engine.RuleEngine;
import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.Move;
import com.ninemensmorris.model.MoveType;
import com.ninemensmorris.model.PlayerColor;

/**
 * AI service for Nine Men's Morris that provides board position evaluation
 * and strategic decision-making capabilities using minimax with alpha-beta pruning.
 * 
 * <p>This service implements:
 * <ul>
 *   <li>Comprehensive board evaluation considering multiple strategic factors</li>
 *   <li>Minimax algorithm with alpha-beta pruning for optimal move selection</li>
 *   <li>Transposition table for caching evaluated positions</li>
 *   <li>Move ordering for improved alpha-beta cutoff efficiency</li>
 *   <li>Configurable search depth for performance tuning</li>
 * </ul>
 *
 * <p>The evaluation considers piece count differences, mill formations,
 * potential mills, mobility, and blocked opponent pieces.
 */
@Service
public class AIService {
    
    private final RuleEngine ruleEngine;
    
    /** Default search depth for minimax algorithm. */
    private static final int DEFAULT_DEPTH = 4;

    /** Maximum entries in the transposition table before eviction. */
    private static final int MAX_TRANSPOSITION_TABLE_SIZE = 100_000;

    private final int searchDepth;
    
    // Evaluation weights for different strategic factors
    private static final int PIECE_COUNT_WEIGHT = 100;
    private static final int MILL_WEIGHT = 50;
    private static final int POTENTIAL_MILL_WEIGHT = 10;
    private static final int MOBILITY_WEIGHT = 5;
    private static final int BLOCKED_PIECE_WEIGHT = 3;

    /**
     * Transposition table entry storing a cached evaluation result.
     *
     * @param score the evaluated score
     * @param depth the search depth at which this score was computed
     * @param flag the node type: EXACT, LOWER_BOUND, or UPPER_BOUND
     */
    private record TranspositionEntry(int score, int depth, NodeFlag flag) {}

    /** Node type flags for transposition table entries. */
    private enum NodeFlag { EXACT, LOWER_BOUND, UPPER_BOUND }

    /**
     * Cache of previously evaluated board positions keyed by a compact board hash.
     * Uses ConcurrentHashMap for thread safety across concurrent AI requests.
     */
    private final Map<Long, TranspositionEntry> transpositionTable = new ConcurrentHashMap<>();
    
    /** Creates an AIService with the default search depth. */
    public AIService() {
        this.ruleEngine = new RuleEngine();
        this.searchDepth = DEFAULT_DEPTH;
    }
    
    /**
     * Creates an AIService with a custom search depth.
     *
     * @param depth the maximum search depth for minimax
     */
    public AIService(int depth) {
        this.ruleEngine = new RuleEngine();
        this.searchDepth = depth;
    }
    
    /**
     * Selects the best move for the AI using minimax algorithm with alpha-beta pruning.
     * Clears the transposition table before each search to avoid stale entries.
     * 
     * @param state the current game state
     * @param aiColor the color of the AI player
     * @return the best move for the AI, or null if no legal moves available
     * @throws IllegalArgumentException if state or aiColor is null
     */
    public Move selectMove(GameState state, PlayerColor aiColor) {
        if (state == null) {
            throw new IllegalArgumentException("Game state cannot be null");
        }
        if (aiColor == null) {
            throw new IllegalArgumentException("AI color cannot be null");
        }
        
        // Clear transposition table for a fresh search
        transpositionTable.clear();
        
        List<Move> legalMoves = ruleEngine.generateLegalMoves(state, aiColor);
        if (legalMoves.isEmpty()) {
            return null; // No legal moves available
        }
        
        // Order moves so the most promising are evaluated first
        List<Move> orderedMoves = orderMoves(legalMoves, state);
        
        Move bestMove = null;
        int bestScore = Integer.MIN_VALUE;
        int alpha = Integer.MIN_VALUE;
        int beta = Integer.MAX_VALUE;
        
        // Evaluate each possible move using minimax
        for (Move move : orderedMoves) {
            GameState newState = state.applyMove(move);
            int score = minimax(newState, searchDepth - 1, alpha, beta, false, aiColor);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            
            alpha = Math.max(alpha, score);
            if (beta <= alpha) {
                break; // Alpha-beta pruning
            }
        }
        
        return bestMove;
    }

    /**
     * Orders moves so that the most promising candidates are evaluated first.
     * Better move ordering leads to more alpha-beta cutoffs and faster search.
     *
     * <p>Priority (highest first):
     * <ol>
     *   <li>Removal moves (capturing opponent pieces)</li>
     *   <li>Moves that form a mill</li>
     *   <li>All other moves</li>
     * </ol>
     *
     * @param moves the unordered list of legal moves
     * @param state the current game state
     * @return a new list with moves sorted by estimated quality (best first)
     */
    private List<Move> orderMoves(List<Move> moves, GameState state) {
        List<Move> ordered = new ArrayList<>(moves);
        Board board = state.getBoard();

        ordered.sort(Comparator.comparingInt((Move m) -> {
            // Removal moves are highest priority — they capture opponent pieces
            if (m.getType() == MoveType.REMOVE) {
                return 0;
            }
            // Moves that form a mill are next priority
            if (m.getType() == MoveType.PLACE || m.getType() == MoveType.MOVE) {
                // Simulate placing the piece to check for mill formation
                Board testBoard = board.clone();
                if (m.getType() == MoveType.MOVE) {
                    testBoard.getPosition(m.getFrom()).clear();
                }
                testBoard.getPosition(m.getTo()).setOccupant(m.getPlayer());
                if (testBoard.isPartOfMill(m.getTo(), m.getPlayer())) {
                    return 1;
                }
            }
            return 2;
        }));

        return ordered;
    }

    /**
     * Computes a compact Zobrist-style hash for a board position combined with
     * the current player. Used as the key for the transposition table.
     *
     * <p>The hash encodes each position's occupant (empty=0, WHITE=1, BLACK=2)
     * into a base-3 representation, then mixes in the current player.
     *
     * @param state the game state to hash
     * @return a long hash value representing the board + current player
     */
    private long computeBoardHash(GameState state) {
        long hash = 0;
        Board board = state.getBoard();
        for (int i = 0; i < 24; i++) {
            hash *= 3;
            if (!board.isPositionEmpty(i)) {
                hash += board.getPosition(i).getOccupant() == PlayerColor.WHITE ? 1 : 2;
            }
        }
        // Mix in current player and mill-formed flag
        hash = hash * 5 + (state.getCurrentPlayer() == PlayerColor.WHITE ? 1 : 2);
        hash = hash * 3 + (state.isMillFormed() ? 1 : 0);
        return hash;
    }
    
    /**
     * Minimax algorithm with alpha-beta pruning and transposition table lookup.
     * 
     * @param state the current game state
     * @param depth the remaining search depth
     * @param alpha the alpha value for pruning
     * @param beta the beta value for pruning
     * @param maximizing true if this is a maximizing node (AI's turn)
     * @param aiColor the color of the AI player
     * @return the evaluated score of this position
     */
    private int minimax(GameState state, int depth, int alpha, int beta, 
                       boolean maximizing, PlayerColor aiColor) {
        
        // Base case: terminal node or depth limit reached
        if (depth == 0 || state.isGameOver()) {
            return evaluatePosition(state, aiColor);
        }

        // Transposition table lookup
        long boardHash = computeBoardHash(state);
        TranspositionEntry cached = transpositionTable.get(boardHash);
        if (cached != null && cached.depth() >= depth) {
            switch (cached.flag()) {
                case EXACT -> { return cached.score(); }
                case LOWER_BOUND -> alpha = Math.max(alpha, cached.score());
                case UPPER_BOUND -> beta = Math.min(beta, cached.score());
            }
            if (alpha >= beta) {
                return cached.score();
            }
        }
        
        PlayerColor currentPlayer = maximizing ? aiColor : aiColor.opposite();
        List<Move> legalMoves = ruleEngine.generateLegalMoves(state, currentPlayer);
        
        // If no legal moves, this is effectively a terminal position
        if (legalMoves.isEmpty()) {
            return evaluatePosition(state, aiColor);
        }

        // Order moves for better pruning at internal nodes
        List<Move> orderedMoves = orderMoves(legalMoves, state);

        int originalAlpha = alpha;
        int bestScore;
        
        if (maximizing) {
            bestScore = Integer.MIN_VALUE;
            
            for (Move move : orderedMoves) {
                GameState newState = state.applyMove(move);
                int eval = minimax(newState, depth - 1, alpha, beta, false, aiColor);
                bestScore = Math.max(bestScore, eval);
                alpha = Math.max(alpha, eval);
                
                if (beta <= alpha) {
                    break; // Beta cutoff
                }
            }
        } else {
            bestScore = Integer.MAX_VALUE;
            
            for (Move move : orderedMoves) {
                GameState newState = state.applyMove(move);
                int eval = minimax(newState, depth - 1, alpha, beta, true, aiColor);
                bestScore = Math.min(bestScore, eval);
                beta = Math.min(beta, eval);
                
                if (beta <= alpha) {
                    break; // Alpha cutoff
                }
            }
        }

        // Store result in transposition table
        NodeFlag flag;
        if (bestScore <= originalAlpha) {
            flag = NodeFlag.UPPER_BOUND;
        } else if (bestScore >= beta) {
            flag = NodeFlag.LOWER_BOUND;
        } else {
            flag = NodeFlag.EXACT;
        }

        // Evict if table is too large to prevent unbounded memory growth
        if (transpositionTable.size() < MAX_TRANSPOSITION_TABLE_SIZE) {
            transpositionTable.put(boardHash, new TranspositionEntry(bestScore, depth, flag));
        }

        return bestScore;
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

    /**
     * Returns the current number of entries in the transposition table.
     * Useful for monitoring cache utilization and testing.
     *
     * @return the number of cached position evaluations
     */
    public int getTranspositionTableSize() {
        return transpositionTable.size();
    }

    /**
     * Clears all entries from the transposition table.
     * Called automatically at the start of each {@link #selectMove} invocation.
     */
    public void clearTranspositionTable() {
        transpositionTable.clear();
    }

    /**
     * Returns the configured search depth for this AI instance.
     *
     * @return the maximum minimax search depth
     */
    public int getSearchDepth() {
        return searchDepth;
    }
}