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
    
    /**
     * Phase-specific weight configuration for the evaluation function.
     * Each game phase uses different weights to reflect strategic priorities.
     *
     * @param pieceCount weight for piece count advantage
     * @param mill weight for completed mill formations
     * @param potentialMill weight for potential mills (2 of 3 positions filled)
     * @param opponentPotentialMill weight for penalizing unblocked opponent potential mills
     * @param doubleMill weight for double mill configurations
     * @param mobility weight for legal move count advantage
     * @param blockedPiece weight for blocked opponent pieces
     * @param intersection weight for intersection position control
     */
    record PhaseWeights(
        int pieceCount,
        int mill,
        int potentialMill,
        int opponentPotentialMill,
        int doubleMill,
        int mobility,
        int blockedPiece,
        int intersection
    ) {}

    /** Evaluation weights for the placement phase. */
    private static final PhaseWeights PLACEMENT_WEIGHTS = new PhaseWeights(
        100,  // pieceCount
        200,  // mill (2x piece count — at least 1.5x per Req 2.1)
        80,   // potentialMill (40% of mill — at least 30% per Req 2.2)
        80,   // opponentPotentialMill (equal to own — per Req 5.3)
        500,  // doubleMill (2.5x mill — at least 2x per Req 2.4)
        3,    // mobility (low in placement — pieces go anywhere)
        0,    // blockedPiece (irrelevant during placement)
        15    // intersection (per Req 6.1)
    );

    /** Evaluation weights for the movement phase. */
    private static final PhaseWeights MOVEMENT_WEIGHTS = new PhaseWeights(
        100,  // pieceCount
        200,  // mill
        100,  // potentialMill (ratio 2.0:1 with mill — per Req 2.8)
        100,  // opponentPotentialMill (>= potentialMill — per Req 5.3)
        500,  // doubleMill
        12,   // mobility (higher than placement — per Req 3.3)
        8,    // blockedPiece (higher than placement — per Req 3.3)
        0     // intersection (not relevant post-placement)
    );

    /** Evaluation weights for the flying phase. */
    private static final PhaseWeights FLYING_WEIGHTS = new PhaseWeights(
        100,  // pieceCount
        300,  // mill (increased — per Req 3.5)
        120,  // potentialMill (ratio 2.5:1 with mill — per Req 2.8)
        120,  // opponentPotentialMill (>= potentialMill — per Req 5.3)
        600,  // doubleMill
        2,    // mobility (reduced — per Req 3.4: flying player can go anywhere)
        0,    // blockedPiece (irrelevant when flying)
        0     // intersection
    );

    /** Time budget in milliseconds for the minimax search. */
    static final long TIME_BUDGET_MS = 2000;

    /** Board positions with 3 or more adjacencies, strategically valuable during placement. */
    static final int[] INTERSECTION_POSITIONS = {1, 3, 5, 7, 9, 11, 13, 15};

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

    /** Score penalty applied to moves that reverse the AI's most recent move, discouraging oscillation. */
    private static final int REPETITION_PENALTY = 40;

    /** Tracks the AI's most recent move to detect and penalize back-and-forth oscillation. */
    private Move lastAIMove;

    /** Maximum number of killer moves stored per depth level. */
    private static final int MAX_KILLER_MOVES = 2;

    /**
     * Killer move table indexed by depth, storing up to {@value #MAX_KILLER_MOVES} moves per level.
     * Killer moves are moves that caused beta cutoffs at a given depth and are tried early
     * in sibling nodes to improve alpha-beta pruning efficiency.
     */
    private final Move[][] killerMoves;
    
    /** Creates an AIService with the default search depth. */
    public AIService() {
        this.ruleEngine = new RuleEngine();
        this.searchDepth = DEFAULT_DEPTH;
        this.killerMoves = new Move[DEFAULT_DEPTH + 1][MAX_KILLER_MOVES];
    }
    
    /**
     * Creates an AIService with a custom search depth.
     *
     * @param depth the maximum search depth for minimax
     */
    public AIService(int depth) {
        this.ruleEngine = new RuleEngine();
        this.searchDepth = depth;
        this.killerMoves = new Move[depth + 1][MAX_KILLER_MOVES];
    }
    
    /**
     * Selects the best move for the AI using iterative deepening minimax with alpha-beta pruning.
     * 
     * <p>Iterative deepening searches from depth 1 up to {@code searchDepth}, keeping the best
     * move from the last fully completed iteration. This guarantees at least a depth-1 complete
     * search result is always available, even if deeper searches exceed the time budget.
     * After each complete iteration the principal variation (PV) move is placed first in the
     * move ordering for the next iteration, improving alpha-beta pruning efficiency.
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
        
        List<Move> legalMoves = ruleEngine.generateLegalMoves(state, aiColor);
        if (legalMoves.isEmpty()) {
            return null; // No legal moves available
        }
        
        // Compute deadline for time-budgeted search
        long deadline = System.nanoTime() + TIME_BUDGET_MS * 1_000_000L;
        
        // Reset killer moves for this search
        for (Move[] slot : killerMoves) {
            slot[0] = null;
            slot[1] = null;
        }
        
        // Order moves so the most promising are evaluated first
        List<Move> orderedMoves = orderMoves(legalMoves, state);
        
        // Fallback: first legal move (guarantees we always return something)
        Move bestMove = orderedMoves.get(0);
        
        // Iterative deepening: search from depth 1 up to searchDepth
        for (int depth = 1; depth <= searchDepth; depth++) {
            if (System.nanoTime() > deadline) {
                break; // Time's up — return best move from last complete iteration
            }
            
            Move iterationBestMove = null;
            int iterationBestScore = Integer.MIN_VALUE;
            boolean iterationComplete = true;
            
            for (Move move : orderedMoves) {
                if (System.nanoTime() > deadline) {
                    iterationComplete = false;
                    break; // Abandon this iteration
                }
                
                GameState newState = state.applyMove(move);
                // After a mill-forming move, the current player stays the same (to remove).
                // The minimax 'maximizing' flag must reflect whose turn it actually is.
                boolean nextMaximizing = newState.getCurrentPlayer() == aiColor;
                int score = minimax(newState, depth - 1, Integer.MIN_VALUE, Integer.MAX_VALUE,
                        nextMaximizing, aiColor, deadline);
                
                // Apply repetition penalty for MOVE-type moves that reverse the last AI move
                score += penalizeRepetition(move, lastAIMove);
                
                if (score > iterationBestScore) {
                    iterationBestScore = score;
                    iterationBestMove = move;
                }
            }
            
            if (iterationComplete && iterationBestMove != null) {
                bestMove = iterationBestMove;
                // Re-order moves: put PV move first for next iteration
                orderedMoves = reorderWithPVFirst(orderedMoves, bestMove);
            }
        }
        
        // Track the selected move for repetition penalty on next call
        lastAIMove = bestMove;
        
        return bestMove;
    }
    
    /**
     * Re-orders the move list so that the principal variation (PV) move appears first.
     * This improves alpha-beta pruning in subsequent deeper iterations by evaluating
     * the most promising move first.
     *
     * @param moves the current ordered move list
     * @param pvMove the best move from the last complete iteration
     * @return a new list with pvMove first, followed by the remaining moves in original order
     */
    private List<Move> reorderWithPVFirst(List<Move> moves, Move pvMove) {
        List<Move> reordered = new ArrayList<>(moves.size());
        reordered.add(pvMove);
        for (Move m : moves) {
            if (!m.equals(pvMove)) {
                reordered.add(m);
            }
        }
        return reordered;
    }

    /**
     * Computes a repetition penalty for a move that reverses the AI's most recent move.
     * Only applies to MOVE-type moves (not PLACE or REMOVE) to discourage back-and-forth oscillation.
     *
     * @param move the candidate move being evaluated
     * @param lastMove the AI's most recent move, or null if no previous move
     * @return a negative penalty (−{@value #REPETITION_PENALTY}) if the move reverses lastMove, otherwise 0
     */
    private int penalizeRepetition(Move move, Move lastMove) {
        if (lastMove == null) {
            return 0;
        }
        if (move.getType() != MoveType.MOVE) {
            return 0;
        }
        if (move.getFrom() == lastMove.getTo() && move.getTo() == lastMove.getFrom()) {
            return -REPETITION_PENALTY;
        }
        return 0;
    }

    /**
     * Stores a move as a killer move at the given depth.
     * Killer moves are moves that caused beta cutoffs and are tried early in sibling nodes.
     * Uses a two-slot replacement scheme: if the move is already in slot 0, nothing changes;
     * otherwise slot 1 gets the old slot 0 value and slot 0 gets the new move.
     *
     * @param move the move that caused a beta cutoff
     * @param depth the search depth at which the cutoff occurred
     */
    private void storeKillerMove(Move move, int depth) {
        if (depth < 0 || depth >= killerMoves.length) {
            return;
        }
        if (move.equals(killerMoves[depth][0])) {
            return; // Already the primary killer move
        }
        killerMoves[depth][1] = killerMoves[depth][0];
        killerMoves[depth][0] = move;
    }

    /**
     * Checks whether a move is a killer move at the given depth.
     *
     * @param move the move to check
     * @param depth the search depth to check against
     * @return true if the move matches either killer move slot at this depth
     */
    private boolean isKillerMove(Move move, int depth) {
        if (depth < 0 || depth >= killerMoves.length) {
            return false;
        }
        return move.equals(killerMoves[depth][0]) || move.equals(killerMoves[depth][1]);
    }

    /**
     * Orders moves so that the most promising candidates are evaluated first.
     * Better move ordering leads to more alpha-beta cutoffs and faster search.
     *
     * <p>Priority (highest first):
     * <ol>
     *   <li>Removal moves (capturing opponent pieces)</li>
     *   <li>Moves that form a mill</li>
     *   <li>Moves that create a potential mill (2 of 3 positions filled, 1 empty, no opponent blocking)</li>
     *   <li>Killer moves (moves that caused beta cutoffs at this depth)</li>
     *   <li>All other moves</li>
     * </ol>
     *
     * @param moves the unordered list of legal moves
     * @param state the current game state
     * @return a new list with moves sorted by estimated quality (best first)
     */
    private List<Move> orderMoves(List<Move> moves, GameState state) {
        return orderMoves(moves, state, -1);
    }

    /**
     * Orders moves with killer move awareness at a specific depth.
     *
     * @param moves the unordered list of legal moves
     * @param state the current game state
     * @param depth the current search depth (for killer move lookup), or -1 to skip killer moves
     * @return a new list with moves sorted by estimated quality (best first)
     */
    private List<Move> orderMoves(List<Move> moves, GameState state, int depth) {
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
                // Moves that create a potential mill are next
                if (createsPotentialMill(m, state)) {
                    return 2;
                }
            }
            // Killer moves are tried after potential-mill moves
            if (depth >= 0 && isKillerMove(m, depth)) {
                return 3;
            }
            return 4;
        }));

        return ordered;
    }

    /**
     * Checks whether a move creates a potential mill at the destination position.
     * A potential mill exists when, after the move, a mill pattern containing the
     * destination has exactly 2 positions occupied by the moving player and 1 empty
     * position (with no opponent piece blocking).
     *
     * @param move the move to evaluate
     * @param state the current game state (before the move)
     * @return true if the move creates at least one potential mill
     */
    private boolean createsPotentialMill(Move move, GameState state) {
        Board board = state.getBoard();
        // Simulate the move on a cloned board
        Board testBoard = board.clone();
        if (move.getType() == MoveType.MOVE) {
            testBoard.getPosition(move.getFrom()).clear();
        }
        testBoard.getPosition(move.getTo()).setOccupant(move.getPlayer());

        // Check all mill patterns containing the destination position
        for (int[] pattern : Board.getMillPatterns()) {
            boolean destinationInPattern = false;
            for (int pos : pattern) {
                if (pos == move.getTo()) {
                    destinationInPattern = true;
                    break;
                }
            }
            if (!destinationInPattern) {
                continue;
            }
            // Check if this pattern is a potential mill (2 player pieces + 1 empty)
            if (isPotentialMill(testBoard, pattern, move.getPlayer())) {
                return true;
            }
        }
        return false;
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
        hash = hash * 7 + state.getPhase().ordinal();
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
     * @param deadline the absolute nanoTime deadline; if exceeded, return current evaluation
     * @return the evaluated score of this position
     */
    private int minimax(GameState state, int depth, int alpha, int beta, 
                       boolean maximizing, PlayerColor aiColor, long deadline) {
        
        // Check deadline at each node; if exceeded, return current evaluation immediately
        if (System.nanoTime() > deadline) {
            return evaluatePosition(state, aiColor);
        }
        
        // Base case: terminal node or depth limit reached
        // Quiescence extension: when a mill was just formed and a removal is pending,
        // extend the search by 1 ply so the capture is resolved before evaluating.
        // Without this, mill-completing moves appear weaker than they are because the
        // static evaluation sees the mill but not the piece removal that follows.
        if (state.isGameOver()) {
            return evaluatePosition(state, aiColor);
        }
        if (depth == 0) {
            if (state.isMillFormed()) {
                depth = 1; // Extend to resolve the pending removal
            } else {
                return evaluatePosition(state, aiColor);
            }
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
        List<Move> orderedMoves = orderMoves(legalMoves, state, depth);

        int originalAlpha = alpha;
        int bestScore;
        
        if (maximizing) {
            bestScore = Integer.MIN_VALUE;
            
            for (Move move : orderedMoves) {
                GameState newState = state.applyMove(move);
                // Determine maximizing based on whose turn it actually is after the move
                // (mill-forming moves keep the same player; removals switch)
                boolean nextMaximizing = newState.getCurrentPlayer() == aiColor;
                int eval = minimax(newState, depth - 1, alpha, beta, nextMaximizing, aiColor, deadline);
                bestScore = Math.max(bestScore, eval);
                alpha = Math.max(alpha, eval);
                
                if (beta <= alpha) {
                    storeKillerMove(move, depth); // Beta cutoff — remember this move
                    break;
                }
            }
        } else {
            bestScore = Integer.MAX_VALUE;
            
            for (Move move : orderedMoves) {
                GameState newState = state.applyMove(move);
                // Determine maximizing based on whose turn it actually is after the move
                boolean nextMaximizing = newState.getCurrentPlayer() == aiColor;
                int eval = minimax(newState, depth - 1, alpha, beta, nextMaximizing, aiColor, deadline);
                bestScore = Math.min(bestScore, eval);
                beta = Math.min(beta, eval);
                
                if (beta <= alpha) {
                    storeKillerMove(move, depth); // Alpha cutoff — remember this move
                    break;
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
        PhaseWeights weights = getPhaseWeights(state.getPhase());
        
        int score = 0;
        
        // 1. Piece count difference
        score += evaluatePieceCount(state, aiColor, opponent, weights.pieceCount());
        
        // 2. Mill formations
        score += evaluateMills(board, aiColor, opponent, weights.mill());
        
        // 3. Potential mills (2 pieces in a row)
        score += evaluatePotentialMills(board, aiColor, opponent, weights.potentialMill());
        
        // 4. Opponent mill blocking penalty
        score += evaluateOpponentBlocking(board, aiColor, opponent, weights.opponentPotentialMill());
        
        // 5. Double mill configurations
        score += evaluateDoubleMills(board, aiColor, opponent, weights.doubleMill());
        
        // 6. Mobility (number of legal moves)
        score += evaluateMobility(state, aiColor, opponent, weights.mobility());
        
        // 7. Blocked opponent pieces
        score += evaluateBlockedPieces(state, board, aiColor, opponent, weights.blockedPiece());
        
        // 8. Intersection control (placement phase only)
        if (state.getPhase() == GamePhase.PLACEMENT) {
            score += evaluateIntersectionControl(board, aiColor, opponent, weights.intersection());
        }
        
        return score;
    }
    
    /**
     * Evaluates the piece count advantage.
     * More pieces on board is generally better, especially in the endgame.
     *
     * @param state the current game state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param weight the phase-specific weight for piece count
     * @return the weighted piece count score (positive favors AI)
     */
    private int evaluatePieceCount(GameState state, PlayerColor aiColor, PlayerColor opponent, int weight) {
        int aiPieces = state.getPiecesOnBoard(aiColor);
        int opponentPieces = state.getPiecesOnBoard(opponent);
        
        return (aiPieces - opponentPieces) * weight;
    }
    
    /**
     * Evaluates mill formations.
     * Mills are valuable as they allow piece removal and control key positions.
     *
     * @param board the current board state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param weight the phase-specific weight for mill formations
     * @return the weighted mill score (positive favors AI)
     */
    private int evaluateMills(Board board, PlayerColor aiColor, PlayerColor opponent, int weight) {
        int aiMills = countMills(board, aiColor);
        int opponentMills = countMills(board, opponent);
        
        return (aiMills - opponentMills) * weight;
    }
    
    /**
     * Counts the number of mills for a given player.
     * Delegates to {@link Board#getMillPatterns()} as the single source of truth.
     */
    int countMills(Board board, PlayerColor color) {
        int millCount = 0;
        
        for (int[] pattern : Board.getMillPatterns()) {
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
     *
     * @param board the current board state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param weight the phase-specific weight for potential mills
     * @return the weighted potential mill score (positive favors AI)
     */
    private int evaluatePotentialMills(Board board, PlayerColor aiColor, PlayerColor opponent, int weight) {
        int aiPotentialMills = countPotentialMills(board, aiColor);
        int opponentPotentialMills = countPotentialMills(board, opponent);
        
        return (aiPotentialMills - opponentPotentialMills) * weight;
    }
    
    /**
     * Counts potential mills for a given player.
     * Delegates to {@link Board#getMillPatterns()} as the single source of truth.
     */
    int countPotentialMills(Board board, PlayerColor color) {
        int potentialCount = 0;
        
        for (int[] pattern : Board.getMillPatterns()) {
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
     *
     * @param state the current game state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param weight the phase-specific weight for mobility
     * @return the weighted mobility score (positive favors AI)
     */
    private int evaluateMobility(GameState state, PlayerColor aiColor, PlayerColor opponent, int weight) {
        int aiMobility = countMobility(state, aiColor);
        int opponentMobility = countMobility(state, opponent);
        
        return (aiMobility - opponentMobility) * weight;
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
     *
     * @param state the current game state
     * @param board the current board state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param weight the phase-specific weight for blocked pieces
     * @return the weighted blocked piece score (positive favors AI)
     */
    private int evaluateBlockedPieces(GameState state, Board board, PlayerColor aiColor, PlayerColor opponent, int weight) {
        // Only relevant in movement and flying phases
        if (state.getPhase() == GamePhase.PLACEMENT) {
            return 0;
        }
        
        int blockedOpponentPieces = countBlockedPieces(board, opponent);
        int blockedAIPieces = countBlockedPieces(board, aiColor);
        
        return (blockedOpponentPieces - blockedAIPieces) * weight;
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
     * Counts double mill configurations for a player.
     * A double mill exists when a piece is part of a completed mill AND is adjacent
     * to an empty position that, if the piece moved there, would complete a second mill.
     *
     * @param board the current board state
     * @param color the player color to check
     * @return the number of double mill configurations detected
     */
    int countDoubleMills(Board board, PlayerColor color) {
        int doubleMills = 0;

        for (int p = 0; p < 24; p++) {
            // Position must be occupied by the player
            if (board.isPositionEmpty(p) || board.getPosition(p).getOccupant() != color) {
                continue;
            }
            // Position must be part of a completed mill
            if (!board.isPartOfMill(p, color)) {
                continue;
            }
            // Check each adjacent empty position
            for (int a : board.getAdjacentPositions(p)) {
                if (!board.isPositionEmpty(a)) {
                    continue;
                }
                // Simulate moving the piece from p to a
                Board simulated = board.clone();
                simulated.getPosition(p).clear();
                simulated.getPosition(a).setOccupant(color);
                // Check if the piece at position a is now part of a mill
                if (simulated.isPartOfMill(a, color)) {
                    doubleMills++;
                }
            }
        }

        return doubleMills;
    }

    /**
     * Evaluates the double mill advantage for the AI player.
     * Computes {@code (aiDoubleMills - opponentDoubleMills) * doubleMillWeight}.
     *
     * @param board the current board state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param doubleMillWeight the weight to apply to the double mill difference
     * @return the weighted double mill score (positive favors AI)
     */
    int evaluateDoubleMills(Board board, PlayerColor aiColor, PlayerColor opponent, int doubleMillWeight) {
        int aiDoubleMills = countDoubleMills(board, aiColor);
        int opponentDoubleMills = countDoubleMills(board, opponent);
        return (aiDoubleMills - opponentDoubleMills) * doubleMillWeight;
    }

    /**
     * Evaluates the penalty for unblocked opponent potential mills.
     * Uses the symmetric {@code (ai - opponent)} pattern so that
     * {@code evaluatePosition(state, WHITE) == -evaluatePosition(state, BLACK)}.
     * Combined with {@link #evaluatePotentialMills}, this gives opponent potential
     * mills an effective weight of {@code potentialMill + opponentPotentialMill}.
     *
     * @param board the current board state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param opponentPotentialMillWeight the weight to apply per potential mill difference
     * @return the weighted opponent blocking score (positive favors AI)
     */
    int evaluateOpponentBlocking(Board board, PlayerColor aiColor, PlayerColor opponent, int opponentPotentialMillWeight) {
        int aiPotentialMills = countPotentialMills(board, aiColor);
        int opponentPotentialMills = countPotentialMills(board, opponent);
        return (aiPotentialMills - opponentPotentialMills) * opponentPotentialMillWeight;
    }

    /**
     * Evaluates intersection control during the placement phase.
     * Counts AI pieces on intersection positions minus opponent pieces on intersection
     * positions, multiplied by the intersection weight.
     *
     * @param board the current board state
     * @param aiColor the AI player's color
     * @param opponent the opponent's color
     * @param intersectionWeight the weight to apply per intersection position advantage
     * @return the weighted intersection control score (positive favors AI)
     */
    int evaluateIntersectionControl(Board board, PlayerColor aiColor, PlayerColor opponent, int intersectionWeight) {
        int aiIntersections = 0;
        int opponentIntersections = 0;

        for (int pos : INTERSECTION_POSITIONS) {
            if (!board.isPositionEmpty(pos)) {
                PlayerColor occupant = board.getPosition(pos).getOccupant();
                if (occupant == aiColor) {
                    aiIntersections++;
                } else if (occupant == opponent) {
                    opponentIntersections++;
                }
            }
        }

        return (aiIntersections - opponentIntersections) * intersectionWeight;
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

    /**
     * Returns the appropriate phase-specific weights for the given game phase.
     *
     * @param phase the current game phase
     * @return the PhaseWeights for the specified phase
     */
    static PhaseWeights getPhaseWeights(GamePhase phase) {
        return switch (phase) {
            case PLACEMENT -> PLACEMENT_WEIGHTS;
            case MOVEMENT -> MOVEMENT_WEIGHTS;
            case FLYING -> FLYING_WEIGHTS;
        };
    }
}