package com.ninemensmorris.dto;

import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.PlayerColor;

/**
 * Request DTO for the AI move endpoint.
 * Maps the frontend game state JSON to a format the backend can reconstruct.
 */
public class AIMoveRequest {

    private String gameId;
    private String phase;
    private String currentPlayer;
    private String[] board;
    private int whitePiecesRemaining;
    private int blackPiecesRemaining;
    private int whitePiecesOnBoard;
    private int blackPiecesOnBoard;
    private boolean millFormed;

    public AIMoveRequest() {
    }

    public String getGameId() {
        return gameId;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }

    public String getPhase() {
        return phase;
    }

    public void setPhase(String phase) {
        this.phase = phase;
    }

    public String getCurrentPlayer() {
        return currentPlayer;
    }

    public void setCurrentPlayer(String currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    public String[] getBoard() {
        return board;
    }

    public void setBoard(String[] board) {
        this.board = board;
    }

    public int getWhitePiecesRemaining() {
        return whitePiecesRemaining;
    }

    public void setWhitePiecesRemaining(int whitePiecesRemaining) {
        this.whitePiecesRemaining = whitePiecesRemaining;
    }

    public int getBlackPiecesRemaining() {
        return blackPiecesRemaining;
    }

    public void setBlackPiecesRemaining(int blackPiecesRemaining) {
        this.blackPiecesRemaining = blackPiecesRemaining;
    }

    public int getWhitePiecesOnBoard() {
        return whitePiecesOnBoard;
    }

    public void setWhitePiecesOnBoard(int whitePiecesOnBoard) {
        this.whitePiecesOnBoard = whitePiecesOnBoard;
    }

    public int getBlackPiecesOnBoard() {
        return blackPiecesOnBoard;
    }

    public void setBlackPiecesOnBoard(int blackPiecesOnBoard) {
        this.blackPiecesOnBoard = blackPiecesOnBoard;
    }

    public boolean isMillFormed() {
        return millFormed;
    }

    public void setMillFormed(boolean millFormed) {
        this.millFormed = millFormed;
    }

    /**
     * Converts the phase string to the backend GamePhase enum.
     *
     * @return the GamePhase enum value
     */
    public GamePhase toGamePhase() {
        return GamePhase.valueOf(phase);
    }

    /**
     * Converts the currentPlayer string to the backend PlayerColor enum.
     *
     * @return the PlayerColor enum value
     */
    public PlayerColor toCurrentPlayer() {
        return PlayerColor.valueOf(currentPlayer);
    }

    /**
     * Converts the board string array to PlayerColor array.
     * Frontend sends null for empty positions and "WHITE"/"BLACK" for occupied.
     *
     * @return array of PlayerColor (null for empty positions)
     */
    public PlayerColor[] toBoardColors() {
        PlayerColor[] colors = new PlayerColor[24];
        if (board != null) {
            for (int i = 0; i < Math.min(board.length, 24); i++) {
                if (board[i] != null && !board[i].isEmpty() && !"null".equals(board[i])) {
                    colors[i] = PlayerColor.valueOf(board[i]);
                }
            }
        }
        return colors;
    }
}
