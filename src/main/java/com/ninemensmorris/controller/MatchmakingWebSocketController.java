package com.ninemensmorris.controller;

import org.springframework.lang.NonNull;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.ninemensmorris.dto.JoinMatchmakingMessage;
import com.ninemensmorris.service.MatchmakingService;

/**
 * WebSocket controller for handling matchmaking operations in online multiplayer.
 * 
 * This controller handles:
 * - Join matchmaking queue requests
 * - Leave matchmaking queue requests
 * - Integration with MatchmakingService for player pairing
 * 
 * Players are automatically paired when two players are in the queue.
 * Both players receive game start notifications via WebSocket.
 */
@Controller
public class MatchmakingWebSocketController {
    
    private final MatchmakingService matchmakingService;
    
    /**
     * Creates a new MatchmakingWebSocketController.
     * 
     * @param matchmakingService the matchmaking service for managing player queue
     */
    public MatchmakingWebSocketController(@NonNull MatchmakingService matchmakingService) {
        this.matchmakingService = matchmakingService;
    }
    
    /**
     * Handles join matchmaking requests from clients.
     * 
     * Adds the player to the matchmaking queue. If two players are in the queue,
     * they are automatically paired and both receive game start notifications.
     * 
     * @param message the join matchmaking message containing player ID and session ID
     */
    @MessageMapping("/matchmaking/join")
    public void handleJoinMatchmaking(@NonNull JoinMatchmakingMessage message) {
        matchmakingService.joinQueue(message.getPlayerId(), message.getSessionId());
    }
    
    /**
     * Handles leave matchmaking requests from clients.
     * 
     * Removes the player from the matchmaking queue if they are currently waiting.
     * 
     * @param message the leave matchmaking message containing player ID
     */
    @MessageMapping("/matchmaking/leave")
    public void handleLeaveMatchmaking(@NonNull JoinMatchmakingMessage message) {
        matchmakingService.leaveQueue(message.getPlayerId());
    }
}
