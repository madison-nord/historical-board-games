package com.ninemensmorris.config;

import org.springframework.context.event.EventListener;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.ninemensmorris.service.SessionManagementService;

/**
 * Listens for WebSocket session connect and disconnect events.
 * 
 * Registers sessions on connect and handles cleanup on disconnect,
 * including notifying opponents and scheduling forfeit timeouts.
 */
@Component
public class WebSocketEventListener {

    private final SessionManagementService sessionManagementService;

    public WebSocketEventListener(@NonNull SessionManagementService sessionManagementService) {
        this.sessionManagementService = sessionManagementService;
    }

    /**
     * Handles WebSocket CONNECT events.
     * Extracts playerId from STOMP headers and registers the session.
     */
    @EventListener
    public void handleSessionConnect(@NonNull SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String playerId = accessor.getFirstNativeHeader("playerId");

        if (sessionId != null && playerId != null && !playerId.isEmpty()) {
            sessionManagementService.registerSession(sessionId, playerId);
        }
    }

    /**
     * Handles WebSocket DISCONNECT events.
     * Notifies the opponent and schedules a forfeit timeout.
     */
    @EventListener
    public void handleSessionDisconnect(@NonNull SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        if (sessionId != null) {
            sessionManagementService.handleDisconnect(sessionId);
        }
    }
}
