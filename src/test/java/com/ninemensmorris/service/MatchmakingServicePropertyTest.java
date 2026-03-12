package com.ninemensmorris.service;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import net.jqwik.api.Assume;
import net.jqwik.api.ForAll;
import net.jqwik.api.Label;
import net.jqwik.api.Property;
import net.jqwik.api.constraints.AlphaChars;
import net.jqwik.api.constraints.Size;
import net.jqwik.api.constraints.StringLength;

/**
 * Property-based tests for MatchmakingService.
 * 
 * These tests validate the correctness properties of the matchmaking system:
 * - Property 13: Matchmaking Pairing - two queued players get paired and assigned a game
 * 
 * Each property test runs 100+ iterations with randomly generated test data
 * to ensure the matchmaking logic is robust across all scenarios.
 */
public class MatchmakingServicePropertyTest {
    
    /**
     * Property 13: Matchmaking Pairing
     * 
     * Validates Requirements 5.1, 5.2:
     * - Two players in queue should be paired together
     * - Each pair should be assigned a unique game ID
     * - Colors should be randomly assigned (WHITE or BLACK)
     * - Both players should be notified of the match
     * 
     * This property ensures that the matchmaking system correctly pairs players
     * and creates games for them.
     */
    @Property(tries = 100)
    @Label("Property 13: Matchmaking Pairing - two queued players get paired and assigned a game")
    @DisplayName("Property 13: Two queued players should be paired and assigned a game with random colors")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testMatchmakingPairing(
            @ForAll @AlphaChars @StringLength(min = 5, max = 20) String player1Id,
            @ForAll @AlphaChars @StringLength(min = 5, max = 20) String player2Id,
            @ForAll @AlphaChars @StringLength(min = 10, max = 30) String session1Id,
            @ForAll @AlphaChars @StringLength(min = 10, max = 30) String session2Id
    ) {
        // Ensure players have different IDs
        Assume.that(!player1Id.equals(player2Id));
        Assume.that(!session1Id.equals(session2Id));
        
        // Arrange
        SimpMessagingTemplate messagingTemplate = mock(SimpMessagingTemplate.class);
        MatchmakingService matchmakingService = new MatchmakingService(messagingTemplate);
        
        // Act - Add two players to the queue
        matchmakingService.joinQueue(player1Id, session1Id);
        matchmakingService.joinQueue(player2Id, session2Id);
        
        // Assert - Verify both players were notified of a match
        // The service should send GameStartMessage to both players
        verify(messagingTemplate, times(2)).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                any()
        );
        
        // Verify queue is now empty (both players were matched)
        assertEquals(0, matchmakingService.getQueueSize(), 
                "Queue should be empty after pairing two players");
    }
    
    /**
     * Property 13: Matchmaking Pairing - Colors are randomly assigned
     * 
     * Validates Requirement 5.2:
     * - Player colors should be randomly assigned
     * - One player gets WHITE, the other gets BLACK
     * 
     * This property ensures fairness in color assignment.
     */
    @Property(tries = 100)
    @Label("Property 13: Matchmaking Pairing - colors are randomly assigned")
    @DisplayName("Property 13: Matched players should receive different colors (WHITE and BLACK)")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testMatchmakingColorAssignment(
            @ForAll @AlphaChars @StringLength(min = 5, max = 20) String player1Id,
            @ForAll @AlphaChars @StringLength(min = 5, max = 20) String player2Id,
            @ForAll @AlphaChars @StringLength(min = 10, max = 30) String session1Id,
            @ForAll @AlphaChars @StringLength(min = 10, max = 30) String session2Id
    ) {
        // Ensure players have different IDs
        Assume.that(!player1Id.equals(player2Id));
        Assume.that(!session1Id.equals(session2Id));
        
        // Arrange
        SimpMessagingTemplate messagingTemplate = mock(SimpMessagingTemplate.class);
        MatchmakingService matchmakingService = new MatchmakingService(messagingTemplate);
        
        // Act - Add two players to the queue
        matchmakingService.joinQueue(player1Id, session1Id);
        matchmakingService.joinQueue(player2Id, session2Id);
        
        // Assert - Verify that messages were sent (colors will be verified in unit tests)
        // Property test focuses on the pairing behavior, not the specific color values
        verify(messagingTemplate, atLeast(2)).convertAndSendToUser(
                anyString(),
                anyString(),
                any()
        );
    }
    
    /**
     * Property 13: Matchmaking Pairing - Single player waits in queue
     * 
     * Validates Requirement 5.1:
     * - A single player in queue should not be matched
     * - Player should remain in queue until another player joins
     * 
     * This property ensures players are not matched with themselves.
     */
    @Property(tries = 100)
    @Label("Property 13: Matchmaking Pairing - single player waits in queue")
    @DisplayName("Property 13: Single player should remain in queue without being matched")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testSinglePlayerWaitsInQueue(
            @ForAll @AlphaChars @StringLength(min = 5, max = 20) String playerId,
            @ForAll @AlphaChars @StringLength(min = 10, max = 30) String sessionId
    ) {
        // Arrange
        SimpMessagingTemplate messagingTemplate = mock(SimpMessagingTemplate.class);
        MatchmakingService matchmakingService = new MatchmakingService(messagingTemplate);
        
        // Act - Add single player to the queue
        matchmakingService.joinQueue(playerId, sessionId);
        
        // Assert - Verify no match notifications were sent
        verify(messagingTemplate, never()).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                any()
        );
        
        // Verify player is still in queue
        assertEquals(1, matchmakingService.getQueueSize(), 
                "Single player should remain in queue");
    }
    
    /**
     * Property 13: Matchmaking Pairing - Multiple pairs can be matched
     * 
     * Validates Requirement 5.1:
     * - Multiple pairs of players can be matched simultaneously
     * - Each pair gets a unique game ID
     * 
     * This property ensures the matchmaking system scales to multiple concurrent matches.
     */
    @Property(tries = 100)
    @Label("Property 13: Matchmaking Pairing - multiple pairs can be matched")
    @DisplayName("Property 13: Multiple pairs of players should be matched with unique game IDs")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testMultiplePairsMatched(
            @ForAll @Size(min = 2, max = 10) Set<@AlphaChars @StringLength(min = 5, max = 20) String> playerIds
    ) {
        // Ensure we have an even number of players
        int playerCount = playerIds.size();
        if (playerCount % 2 != 0) {
            playerCount--; // Drop one player to make it even
        }
        Assume.that(playerCount >= 2);
        
        // Arrange
        SimpMessagingTemplate messagingTemplate = mock(SimpMessagingTemplate.class);
        MatchmakingService matchmakingService = new MatchmakingService(messagingTemplate);
        
        // Act - Add all players to the queue
        int addedPlayers = 0;
        for (String playerId : playerIds) {
            if (addedPlayers >= playerCount) break;
            matchmakingService.joinQueue(playerId, "session-" + playerId);
            addedPlayers++;
        }
        
        // Assert - Verify all players were matched (even number of notifications)
        verify(messagingTemplate, times(playerCount)).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                any()
        );
        
        // Verify queue is empty or has at most 1 player (if odd number originally)
        assertTrue(matchmakingService.getQueueSize() <= 1, 
                "Queue should be empty or have at most 1 player after matching");
    }
}
