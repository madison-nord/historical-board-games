package com.ninemensmorris.controller;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.ninemensmorris.dto.JoinMatchmakingMessage;
import com.ninemensmorris.service.MatchmakingService;

/**
 * Unit tests for MatchmakingWebSocketController.
 * 
 * Tests cover matchmaking queue join/leave operations to ensure
 * the matchmaking system works correctly in online multiplayer.
 */
public class MatchmakingWebSocketControllerTest {

    @Mock
    private MatchmakingService matchmakingService;

    private MatchmakingWebSocketController controller;

    @SuppressWarnings({"unused", "null"}) // Used by JUnit framework, mock objects are non-null in test context
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        controller = new MatchmakingWebSocketController(matchmakingService);
    }

    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Handle join matchmaking request")
    void testHandleJoinMatchmaking() {
        // Arrange
        JoinMatchmakingMessage message = new JoinMatchmakingMessage();
        message.setPlayerId("player-1");
        message.setSessionId("session-abc");

        // Act
        controller.handleJoinMatchmaking(message);

        // Assert
        verify(matchmakingService, times(1)).joinQueue("player-1", "session-abc");
    }

    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Handle leave matchmaking request")
    void testHandleLeaveMatchmaking() {
        // Arrange
        JoinMatchmakingMessage message = new JoinMatchmakingMessage();
        message.setPlayerId("player-1");
        message.setSessionId("session-abc");

        // Act
        controller.handleLeaveMatchmaking(message);

        // Assert
        verify(matchmakingService, times(1)).leaveQueue("player-1");
    }

    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Join and leave matchmaking in sequence")
    void testJoinThenLeaveMatchmaking() {
        // Arrange
        JoinMatchmakingMessage message = new JoinMatchmakingMessage();
        message.setPlayerId("player-1");
        message.setSessionId("session-abc");

        // Act
        controller.handleJoinMatchmaking(message);
        controller.handleLeaveMatchmaking(message);

        // Assert
        verify(matchmakingService, times(1)).joinQueue("player-1", "session-abc");
        verify(matchmakingService, times(1)).leaveQueue("player-1");
    }
}
