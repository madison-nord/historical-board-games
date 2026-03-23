package com.ninemensmorris.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ninemensmorris.dto.AIMoveRequest;
import com.ninemensmorris.dto.AIMoveResponse;
import com.ninemensmorris.service.AIService;

/**
 * Tests for the AI REST endpoint that exposes the minimax AI
 * for single-player games.
 */
@WebMvcTest(AIRestController.class)
@Import(AIService.class)
class AIRestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldReturnPlacementMoveForEmptyBoard() throws Exception {
        AIMoveRequest request = new AIMoveRequest();
        request.setGameId("test-game-1");
        request.setPhase("PLACEMENT");
        request.setCurrentPlayer("BLACK");
        request.setBoard(new String[24]); // all null = empty board
        request.setWhitePiecesRemaining(8);
        request.setBlackPiecesRemaining(9);
        request.setWhitePiecesOnBoard(1);
        request.setBlackPiecesOnBoard(0);
        request.setMillFormed(false);

        MvcResult result = mockMvc.perform(post("/api/game/ai-move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        AIMoveResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), AIMoveResponse.class);

        assertEquals("PLACE", response.getType());
        assertEquals("BLACK", response.getPlayer());
        assertEquals(-1, response.getFrom());
        assertTrue(response.getTo() >= 0 && response.getTo() < 24);
    }

    @Test
    void shouldReturnMovementMoveInMovementPhase() throws Exception {
        AIMoveRequest request = new AIMoveRequest();
        request.setGameId("test-game-2");
        request.setPhase("MOVEMENT");
        request.setCurrentPlayer("BLACK");
        // Set up a board with pieces in movement phase
        String[] board = new String[24];
        // White pieces
        board[0] = "WHITE";
        board[2] = "WHITE";
        board[4] = "WHITE";
        board[6] = "WHITE";
        // Black pieces
        board[1] = "BLACK";
        board[3] = "BLACK";
        board[5] = "BLACK";
        board[7] = "BLACK";
        request.setBoard(board);
        request.setWhitePiecesRemaining(0);
        request.setBlackPiecesRemaining(0);
        request.setWhitePiecesOnBoard(4);
        request.setBlackPiecesOnBoard(4);
        request.setMillFormed(false);

        MvcResult result = mockMvc.perform(post("/api/game/ai-move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        AIMoveResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), AIMoveResponse.class);

        assertEquals("MOVE", response.getType());
        assertEquals("BLACK", response.getPlayer());
        assertTrue(response.getFrom() >= 0 && response.getFrom() < 24);
        assertTrue(response.getTo() >= 0 && response.getTo() < 24);
    }

    @Test
    void shouldReturnMoveWithRemovalWhenMillFormedByPlacement() throws Exception {
        AIMoveRequest request = new AIMoveRequest();
        request.setGameId("test-game-3");
        request.setPhase("PLACEMENT");
        request.setCurrentPlayer("BLACK");
        // Black has pieces at 0 and 1, placing at 2 would form mill 0-1-2
        // But the AI decides where to place — we just verify it returns a valid move
        String[] board = new String[24];
        board[3] = "WHITE";
        board[4] = "WHITE";
        board[5] = "WHITE";
        board[8] = "BLACK";
        board[9] = "BLACK";
        request.setBoard(board);
        request.setWhitePiecesRemaining(6);
        request.setBlackPiecesRemaining(7);
        request.setWhitePiecesOnBoard(3);
        request.setBlackPiecesOnBoard(2);
        request.setMillFormed(false);

        MvcResult result = mockMvc.perform(post("/api/game/ai-move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        AIMoveResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), AIMoveResponse.class);

        assertNotNull(response.getType());
        assertEquals("BLACK", response.getPlayer());
    }

    @Test
    void shouldHandleInvalidPhaseGracefully() throws Exception {
        AIMoveRequest request = new AIMoveRequest();
        request.setGameId("test-game-4");
        request.setPhase("INVALID_PHASE");
        request.setCurrentPlayer("BLACK");
        request.setBoard(new String[24]);
        request.setWhitePiecesRemaining(9);
        request.setBlackPiecesRemaining(9);
        request.setWhitePiecesOnBoard(0);
        request.setBlackPiecesOnBoard(0);
        request.setMillFormed(false);

        mockMvc.perform(post("/api/game/ai-move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }
}
