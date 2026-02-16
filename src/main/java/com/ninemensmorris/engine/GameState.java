package com.ninemensmorris.engine;

import com.ninemensmorris.model.*;

import java.util.*;

/**
 * Represents the complete state of a Nine Men's Morris game.
 * 
 * This class manages the game board, current phase, player turns, piece counts,
 * and move history. It provides methods to apply moves, check game end conditions,
 * and determine the winner.
 * 
 * The GameState is immutable for most operations - applying a move returns a new
 * GameState instance rather than modifying the existing one.
 */
public class GameState {
    
    private final String gameId;
    private final Board board;
    private final GamePhase phase;
    private final PlayerColor currentPlayer;
    private final int whitePiecesRemaining;  // Pieces not yet placed
    private final int blackPiecesRemaining;
    private final int whitePiecesOnBoard;    // Pieces currently on board
    private final int blackPiecesOnBoard;
    private final boolean millFormed;        // Flag indicating removal phase
    private final GameStatus status;
    private final PlayerColor winner;
    private final List<Move> moveHistory;
    
    /**
     * Creates a new game state with the specified game ID.
     * Initializes the game in the PLACEMENT phase with WHITE as the first player.
     * 
     * @param gameId unique identifier for this game
     */
    public GameState(String gameId) {
        this.gameId = gameId;
        this.board = new Board();
        this.phase = GamePhase.PLACEMENT;
        this.currentPlayer = PlayerColor.WHITE;
        this.whitePiecesRemaining = 9;
        this.blackPiecesRemaining = 9;
        this.whitePiecesOnBoard = 0;
        this.blackPiecesOnBoard = 0;
        this.millFormed = false;
        this.status = GameStatus.IN_PROGRESS;
        this.winner = null;
        this.moveHistory = new ArrayList<>();
    }
    
    /**
     * Private constructor for creating new game states during move application.
     * 
     * @param gameId the game identifier
     * @param board the board state
     * @param phase the current game phase
     * @param currentPlayer the player whose turn it is
     * @param whitePiecesRemaining white pieces not yet placed
     * @param blackPiecesRemaining black pieces not yet placed
     * @param whitePiecesOnBoard white pieces currently on board
     * @param blackPiecesOnBoard black pieces currently on board
     * @param millFormed whether a mill was just formed
     * @param status the game status
     * @param winner the winner (if game is complete)
     * @param moveHistory the history of moves
     */
    private GameState(String gameId, Board board, GamePhase phase, PlayerColor currentPlayer,
                     int whitePiecesRemaining, int blackPiecesRemaining,
                     int whitePiecesOnBoard, int blackPiecesOnBoard,
                     boolean millFormed, GameStatus status, PlayerColor winner,
                     List<Move> moveHistory) {
        this.gameId = gameId;
        this.board = board;
        this.phase = phase;
        this.currentPlayer = currentPlayer;
        this.whitePiecesRemaining = whitePiecesRemaining;
        this.blackPiecesRemaining = blackPiecesRemaining;
        this.whitePiecesOnBoard = whitePiecesOnBoard;
        this.blackPiecesOnBoard = blackPiecesOnBoard;
        this.millFormed = millFormed;
        this.status = status;
        this.winner = winner;
        this.moveHistory = new ArrayList<>(moveHistory);
    }
    
    /**
     * Applies a move to this game state and returns a new game state.
     * This method does not validate the move - validation should be done
     * by the RuleEngine before calling this method.
     * 
     * @param move the move to apply
     * @return a new GameState with the move applied
     * @throws IllegalArgumentException if the move is null
     */
    public GameState applyMove(Move move) {
        if (move == null) {
            throw new IllegalArgumentException("Move cannot be null");
        }
        
        Board newBoard = board.clone();
        List<Move> newMoveHistory = new ArrayList<>(moveHistory);
        newMoveHistory.add(move);
        
        int newWhitePiecesRemaining = whitePiecesRemaining;
        int newBlackPiecesRemaining = blackPiecesRemaining;
        int newWhitePiecesOnBoard = whitePiecesOnBoard;
        int newBlackPiecesOnBoard = blackPiecesOnBoard;
        
        // Apply the move to the board
        switch (move.getType()) {
            case PLACE -> {
                newBoard.getPosition(move.getTo()).setOccupant(move.getPlayer());
                if (move.getPlayer() == PlayerColor.WHITE) {
                    newWhitePiecesRemaining--;
                    newWhitePiecesOnBoard++;
                } else {
                    newBlackPiecesRemaining--;
                    newBlackPiecesOnBoard++;
                }
            }
            case MOVE -> {
                newBoard.getPosition(move.getFrom()).clear();
                newBoard.getPosition(move.getTo()).setOccupant(move.getPlayer());
            }
            case REMOVE -> {
                PlayerColor removedColor = newBoard.getPosition(move.getTo()).getOccupant();
                newBoard.getPosition(move.getTo()).clear();
                if (removedColor == PlayerColor.WHITE) {
                    newWhitePiecesOnBoard--;
                } else {
                    newBlackPiecesOnBoard--;
                }
            }
        }
        
        // Handle piece removal if a mill was formed
        if (move.hasRemoval()) {
            PlayerColor removedColor = newBoard.getPosition(move.getRemoved()).getOccupant();
            newBoard.getPosition(move.getRemoved()).clear();
            if (removedColor == PlayerColor.WHITE) {
                newWhitePiecesOnBoard--;
            } else {
                newBlackPiecesOnBoard--;
            }
        }
        
        // Determine if a mill was formed by this move
        boolean newMillFormed = false;
        if (move.getType() == MoveType.PLACE || move.getType() == MoveType.MOVE) {
            newMillFormed = newBoard.isPartOfMill(move.getTo(), move.getPlayer());
        }
        
        // Determine the next player
        PlayerColor nextPlayer = currentPlayer;
        if (!newMillFormed || move.getType() == MoveType.REMOVE) {
            nextPlayer = currentPlayer.opposite();
        }
        
        // Determine the new phase
        GamePhase newPhase = determinePhase(newWhitePiecesRemaining, newBlackPiecesRemaining,
                                          newWhitePiecesOnBoard, newBlackPiecesOnBoard);
        
        // Check if the game is over
        GameStatus newStatus = status;
        PlayerColor newWinner = winner;
        
        if (isGameOver(newBoard, newPhase, nextPlayer, newWhitePiecesOnBoard, newBlackPiecesOnBoard)) {
            newStatus = GameStatus.COMPLETED;
            newWinner = determineWinner(nextPlayer, newWhitePiecesOnBoard, newBlackPiecesOnBoard);
        }
        
        return new GameState(gameId, newBoard, newPhase, nextPlayer,
                           newWhitePiecesRemaining, newBlackPiecesRemaining,
                           newWhitePiecesOnBoard, newBlackPiecesOnBoard,
                           newMillFormed, newStatus, newWinner, newMoveHistory);
    }
    
    /**
     * Determines the current game phase based on piece counts.
     * 
     * @param whitePiecesRemaining white pieces not yet placed
     * @param blackPiecesRemaining black pieces not yet placed
     * @param whitePiecesOnBoard white pieces on board
     * @param blackPiecesOnBoard black pieces on board
     * @return the appropriate game phase
     */
    private GamePhase determinePhase(int whitePiecesRemaining, int blackPiecesRemaining,
                                   int whitePiecesOnBoard, int blackPiecesOnBoard) {
        // Still placing pieces
        if (whitePiecesRemaining > 0 || blackPiecesRemaining > 0) {
            return GamePhase.PLACEMENT;
        }
        
        // Flying phase if either player has exactly 3 pieces
        if (whitePiecesOnBoard == 3 || blackPiecesOnBoard == 3) {
            return GamePhase.FLYING;
        }
        
        // Otherwise, movement phase
        return GamePhase.MOVEMENT;
    }
    
    /**
     * Checks if the game is over.
     * 
     * @param board the current board state
     * @param phase the current game phase
     * @param currentPlayer the current player
     * @param whitePiecesOnBoard white pieces on board
     * @param blackPiecesOnBoard black pieces on board
     * @return true if the game is over
     */
    private boolean isGameOver(Board board, GamePhase phase, PlayerColor currentPlayer,
                              int whitePiecesOnBoard, int blackPiecesOnBoard) {
        // Game is over if a player has fewer than 3 pieces (after placement phase)
        if (phase != GamePhase.PLACEMENT) {
            if (whitePiecesOnBoard < 3 || blackPiecesOnBoard < 3) {
                return true;
            }
        }
        
        // Game is over if the current player has no legal moves
        // This is a simplified check - full implementation would be in RuleEngine
        return false;
    }
    
    /**
     * Determines the winner based on the current state.
     * 
     * @param currentPlayer the player whose turn it would be
     * @param whitePiecesOnBoard white pieces on board
     * @param blackPiecesOnBoard black pieces on board
     * @return the winning player
     */
    private PlayerColor determineWinner(PlayerColor currentPlayer, int whitePiecesOnBoard, int blackPiecesOnBoard) {
        if (whitePiecesOnBoard < 3) {
            return PlayerColor.BLACK;
        }
        if (blackPiecesOnBoard < 3) {
            return PlayerColor.WHITE;
        }
        
        // If no legal moves, the opponent wins
        return currentPlayer.opposite();
    }
    
    /**
     * Checks if the game is over.
     * 
     * @return true if the game is completed
     */
    public boolean isGameOver() {
        return status == GameStatus.COMPLETED;
    }
    
    /**
     * Gets the winner of the game.
     * 
     * @return the winning player, or null if the game is not over
     */
    public PlayerColor getWinner() {
        return winner;
    }
    
    /**
     * Creates a deep copy of this game state.
     * 
     * @return a new GameState instance with the same state
     */
    @Override
    public GameState clone() {
        return new GameState(gameId, board.clone(), phase, currentPlayer,
                           whitePiecesRemaining, blackPiecesRemaining,
                           whitePiecesOnBoard, blackPiecesOnBoard,
                           millFormed, status, winner, moveHistory);
    }
    
    // Getters
    
    public String getGameId() {
        return gameId;
    }
    
    public Board getBoard() {
        return board;
    }
    
    public GamePhase getPhase() {
        return phase;
    }
    
    public PlayerColor getCurrentPlayer() {
        return currentPlayer;
    }
    
    public int getWhitePiecesRemaining() {
        return whitePiecesRemaining;
    }
    
    public int getBlackPiecesRemaining() {
        return blackPiecesRemaining;
    }
    
    public int getWhitePiecesOnBoard() {
        return whitePiecesOnBoard;
    }
    
    public int getBlackPiecesOnBoard() {
        return blackPiecesOnBoard;
    }
    
    public boolean isMillFormed() {
        return millFormed;
    }
    
    public GameStatus getStatus() {
        return status;
    }
    
    public List<Move> getMoveHistory() {
        return Collections.unmodifiableList(moveHistory);
    }
    
    /**
     * Gets the number of pieces remaining for the specified player.
     * 
     * @param player the player color
     * @return the number of pieces remaining to be placed
     */
    public int getPiecesRemaining(PlayerColor player) {
        return player == PlayerColor.WHITE ? whitePiecesRemaining : blackPiecesRemaining;
    }
    
    /**
     * Gets the number of pieces on board for the specified player.
     * 
     * @param player the player color
     * @return the number of pieces currently on the board
     */
    public int getPiecesOnBoard(PlayerColor player) {
        return player == PlayerColor.WHITE ? whitePiecesOnBoard : blackPiecesOnBoard;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        GameState gameState = (GameState) obj;
        return whitePiecesRemaining == gameState.whitePiecesRemaining &&
               blackPiecesRemaining == gameState.blackPiecesRemaining &&
               whitePiecesOnBoard == gameState.whitePiecesOnBoard &&
               blackPiecesOnBoard == gameState.blackPiecesOnBoard &&
               millFormed == gameState.millFormed &&
               Objects.equals(gameId, gameState.gameId) &&
               Objects.equals(board, gameState.board) &&
               phase == gameState.phase &&
               currentPlayer == gameState.currentPlayer &&
               status == gameState.status &&
               winner == gameState.winner &&
               Objects.equals(moveHistory, gameState.moveHistory);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(gameId, board, phase, currentPlayer,
                          whitePiecesRemaining, blackPiecesRemaining,
                          whitePiecesOnBoard, blackPiecesOnBoard,
                          millFormed, status, winner, moveHistory);
    }
    
    @Override
    public String toString() {
        return String.format(
            "GameState{id='%s', phase=%s, currentPlayer=%s, " +
            "white=%d/%d, black=%d/%d, millFormed=%s, status=%s, winner=%s}",
            gameId, phase, currentPlayer,
            whitePiecesOnBoard, whitePiecesRemaining,
            blackPiecesOnBoard, blackPiecesRemaining,
            millFormed, status, winner
        );
    }
}