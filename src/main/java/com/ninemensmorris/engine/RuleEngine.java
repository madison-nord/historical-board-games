package com.ninemensmorris.engine;

import com.ninemensmorris.model.*;

import java.util.*;

/**
 * Enforces the rules of Nine Men's Morris and validates moves.
 * 
 * This class provides comprehensive move validation for all game phases,
 * mill detection, piece removal validation, and legal move generation.
 * It serves as the authoritative source for game rule enforcement.
 */
public class RuleEngine {
    
    /**
     * Validates whether a move is legal in the given game state.
     * 
     * @param state the current game state
     * @param move the move to validate
     * @return true if the move is legal, false otherwise
     * @throws IllegalArgumentException if state or move is null
     */
    public boolean isValidMove(GameState state, Move move) {
        if (state == null) {
            throw new IllegalArgumentException("Game state cannot be null");
        }
        if (move == null) {
            throw new IllegalArgumentException("Move cannot be null");
        }
        
        // Check if it's the correct player's turn
        if (move.getPlayer() != state.getCurrentPlayer()) {
            return false;
        }
        
        // Check if game is still in progress
        if (state.isGameOver()) {
            return false;
        }
        
        Board board = state.getBoard();
        
        switch (move.getType()) {
            case PLACE -> {
                return isValidPlacement(state, move);
            }
            case MOVE -> {
                return isValidMovement(state, move);
            }
            case REMOVE -> {
                return isValidRemoval(state, move);
            }
            default -> {
                return false;
            }
        }
    }
    
    /**
     * Validates a placement move.
     * 
     * @param state the current game state
     * @param move the placement move to validate
     * @return true if the placement is valid
     */
    private boolean isValidPlacement(GameState state, Move move) {
        // Can only place during PLACEMENT phase
        if (state.getPhase() != GamePhase.PLACEMENT) {
            return false;
        }
        
        // Player must have pieces remaining to place
        if (state.getPiecesRemaining(move.getPlayer()) <= 0) {
            return false;
        }
        
        // Target position must be empty
        if (!state.getBoard().isPositionEmpty(move.getTo())) {
            return false;
        }
        
        // Position must be valid (0-23)
        return move.getTo() >= 0 && move.getTo() < 24;
    }
    
    /**
     * Validates a movement move.
     * 
     * @param state the current game state
     * @param move the movement move to validate
     * @return true if the movement is valid
     */
    private boolean isValidMovement(GameState state, Move move) {
        // Can only move during MOVEMENT or FLYING phase
        if (state.getPhase() == GamePhase.PLACEMENT) {
            return false;
        }
        
        Board board = state.getBoard();
        
        // Source position must contain player's piece
        if (board.isPositionEmpty(move.getFrom()) || 
            board.getPosition(move.getFrom()).getOccupant() != move.getPlayer()) {
            return false;
        }
        
        // Target position must be empty
        if (!board.isPositionEmpty(move.getTo())) {
            return false;
        }
        
        // Position indices must be valid
        if (move.getFrom() < 0 || move.getFrom() >= 24 || 
            move.getTo() < 0 || move.getTo() >= 24) {
            return false;
        }
        
        // Check movement constraints based on phase
        if (state.getPhase() == GamePhase.MOVEMENT) {
            // In movement phase, can only move to adjacent positions
            List<Integer> adjacentPositions = board.getAdjacentPositions(move.getFrom());
            return adjacentPositions.contains(move.getTo());
        } else if (state.getPhase() == GamePhase.FLYING) {
            // In flying phase, player with 3 pieces can move anywhere
            int piecesOnBoard = state.getPiecesOnBoard(move.getPlayer());
            return piecesOnBoard == 3;
        }
        
        return false;
    }
    
    /**
     * Validates a piece removal move.
     * 
     * @param state the current game state
     * @param move the removal move to validate
     * @return true if the removal is valid
     */
    private boolean isValidRemoval(GameState state, Move move) {
        // Can only remove pieces if a mill was just formed
        if (!state.isMillFormed()) {
            return false;
        }
        
        Board board = state.getBoard();
        PlayerColor opponent = move.getPlayer().opposite();
        
        // Target position must contain opponent's piece
        if (board.isPositionEmpty(move.getTo()) || 
            board.getPosition(move.getTo()).getOccupant() != opponent) {
            return false;
        }
        
        // Check if piece can be removed
        return canRemovePiece(state, move.getTo());
    }
    
    /**
     * Checks if a piece at the given position can be removed.
     * Pieces in mills cannot be removed unless all opponent pieces are in mills.
     * 
     * @param state the current game state
     * @param position the position of the piece to potentially remove
     * @return true if the piece can be removed
     */
    public boolean canRemovePiece(GameState state, int position) {
        if (position < 0 || position >= 24) {
            throw new IllegalArgumentException("Position must be between 0 and 23, got: " + position);
        }
        
        Board board = state.getBoard();
        
        // Position must not be empty
        if (board.isPositionEmpty(position)) {
            return false;
        }
        
        PlayerColor pieceColor = board.getPosition(position).getOccupant();
        
        // If the piece is not part of a mill, it can be removed
        if (!board.isPartOfMill(position, pieceColor)) {
            return true;
        }
        
        // If the piece is part of a mill, check if all opponent pieces are in mills
        return allPiecesInMills(board, pieceColor);
    }
    
    /**
     * Checks if all pieces of the given color are part of mills.
     * 
     * @param board the game board
     * @param color the player color to check
     * @return true if all pieces of this color are in mills
     */
    private boolean allPiecesInMills(Board board, PlayerColor color) {
        for (int i = 0; i < 24; i++) {
            if (!board.isPositionEmpty(i) && 
                board.getPosition(i).getOccupant() == color &&
                !board.isPartOfMill(i, color)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Checks if a mill is formed by placing or moving a piece to the given position.
     * 
     * @param board the game board
     * @param position the position where a piece was placed or moved
     * @param color the color of the piece
     * @return true if a mill is formed
     */
    public boolean checkMillFormed(Board board, int position, PlayerColor color) {
        if (position < 0 || position >= 24) {
            throw new IllegalArgumentException("Position must be between 0 and 23, got: " + position);
        }
        
        return board.isPartOfMill(position, color);
    }
    
    /**
     * Determines the current game phase based on the game state.
     * 
     * @param state the current game state
     * @return the appropriate game phase
     */
    public GamePhase determinePhase(GameState state) {
        // Still placing pieces
        if (state.getWhitePiecesRemaining() > 0 || state.getBlackPiecesRemaining() > 0) {
            return GamePhase.PLACEMENT;
        }
        
        // Flying phase if either player has exactly 3 pieces
        if (state.getWhitePiecesOnBoard() == 3 || state.getBlackPiecesOnBoard() == 3) {
            return GamePhase.FLYING;
        }
        
        // Otherwise, movement phase
        return GamePhase.MOVEMENT;
    }
    
    /**
     * Checks if a player has any legal moves available.
     * 
     * @param state the current game state
     * @param player the player to check
     * @return true if the player has legal moves
     */
    public boolean hasLegalMoves(GameState state, PlayerColor player) {
        List<Move> legalMoves = generateLegalMoves(state, player);
        return !legalMoves.isEmpty();
    }
    
    /**
     * Generates all legal moves for the current player in the given game state.
     * 
     * @param state the current game state
     * @return a list of all legal moves
     */
    public List<Move> generateLegalMoves(GameState state) {
        return generateLegalMoves(state, state.getCurrentPlayer());
    }
    
    /**
     * Generates all legal moves for the specified player in the given game state.
     * 
     * @param state the current game state
     * @param player the player to generate moves for
     * @return a list of all legal moves for the player
     */
    public List<Move> generateLegalMoves(GameState state, PlayerColor player) {
        List<Move> legalMoves = new ArrayList<>();
        Board board = state.getBoard();
        
        // If a mill was formed, only removal moves are allowed
        if (state.isMillFormed() && state.getCurrentPlayer() == player) {
            PlayerColor opponent = player.opposite();
            for (int i = 0; i < 24; i++) {
                if (!board.isPositionEmpty(i) && 
                    board.getPosition(i).getOccupant() == opponent &&
                    canRemovePiece(state, i)) {
                    legalMoves.add(new Move(MoveType.REMOVE, -1, i, player));
                }
            }
            return legalMoves;
        }
        
        switch (state.getPhase()) {
            case PLACEMENT -> {
                // Generate placement moves
                if (state.getPiecesRemaining(player) > 0) {
                    for (int i = 0; i < 24; i++) {
                        if (board.isPositionEmpty(i)) {
                            legalMoves.add(new Move(MoveType.PLACE, i, player));
                        }
                    }
                }
            }
            case MOVEMENT -> {
                // Generate movement moves (adjacent positions only)
                for (int from = 0; from < 24; from++) {
                    if (!board.isPositionEmpty(from) && 
                        board.getPosition(from).getOccupant() == player) {
                        
                        List<Integer> adjacentPositions = board.getAdjacentPositions(from);
                        for (int to : adjacentPositions) {
                            if (board.isPositionEmpty(to)) {
                                legalMoves.add(new Move(MoveType.MOVE, from, to, player));
                            }
                        }
                    }
                }
            }
            case FLYING -> {
                // Generate flying moves (any empty position)
                if (state.getPiecesOnBoard(player) == 3) {
                    for (int from = 0; from < 24; from++) {
                        if (!board.isPositionEmpty(from) && 
                            board.getPosition(from).getOccupant() == player) {
                            
                            for (int to = 0; to < 24; to++) {
                                if (board.isPositionEmpty(to)) {
                                    legalMoves.add(new Move(MoveType.MOVE, from, to, player));
                                }
                            }
                        }
                    }
                } else {
                    // Player has more than 3 pieces, use movement rules
                    for (int from = 0; from < 24; from++) {
                        if (!board.isPositionEmpty(from) && 
                            board.getPosition(from).getOccupant() == player) {
                            
                            List<Integer> adjacentPositions = board.getAdjacentPositions(from);
                            for (int to : adjacentPositions) {
                                if (board.isPositionEmpty(to)) {
                                    legalMoves.add(new Move(MoveType.MOVE, from, to, player));
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return legalMoves;
    }
    
    /**
     * Applies a move to a game state and returns the new state.
     * This method assumes the move has already been validated.
     * 
     * @param state the current game state
     * @param move the move to apply
     * @return the new game state after applying the move
     */
    public GameState applyMove(GameState state, Move move) {
        // Delegate to GameState's applyMove method
        return state.applyMove(move);
    }
}