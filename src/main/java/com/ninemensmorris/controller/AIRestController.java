package com.ninemensmorris.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ninemensmorris.dto.AIMoveRequest;
import com.ninemensmorris.dto.AIMoveResponse;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.Move;
import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.service.AIService;

/**
 * REST controller that exposes the minimax AI for single-player games.
 * Single-player games run entirely on the frontend and are not registered
 * in the backend's activeGames map, so they cannot use GameService.getAIMove().
 * This endpoint accepts the full game state and returns the AI's chosen move.
 */
@RestController
@RequestMapping("/api/game")
public class AIRestController {

    private static final Logger logger = LoggerFactory.getLogger(AIRestController.class);

    private final AIService aiService;

    public AIRestController(AIService aiService) {
        this.aiService = aiService;
    }

    /**
     * Computes the best AI move for the given game state using minimax with
     * alpha-beta pruning.
     *
     * @param request the current game state from the frontend
     * @return the AI's chosen move, or 204 No Content if no legal moves exist
     */
    @PostMapping("/ai-move")
    public ResponseEntity<AIMoveResponse> getAIMove(@RequestBody AIMoveRequest request) {
        try {
            PlayerColor aiColor = request.toCurrentPlayer();
            GameState gameState = GameState.fromBoardData(
                request.getGameId(),
                request.toBoardColors(),
                request.toGamePhase(),
                aiColor,
                request.getWhitePiecesRemaining(),
                request.getBlackPiecesRemaining(),
                request.getWhitePiecesOnBoard(),
                request.getBlackPiecesOnBoard(),
                request.isMillFormed()
            );

            Move move = aiService.selectMove(gameState, aiColor);

            if (move == null) {
                logger.warn("AI found no legal moves for game {}", request.getGameId());
                return ResponseEntity.noContent().build();
            }

            AIMoveResponse response = new AIMoveResponse(
                move.getType().name(),
                move.getFrom(),
                move.getTo(),
                move.getPlayer().name(),
                move.getRemoved()
            );

            logger.debug("AI move for game {}: {}", request.getGameId(), move);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error computing AI move: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
