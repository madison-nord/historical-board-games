package com.ninemensmorris.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for Nine Men's Morris online multiplayer.
 * 
 * This configuration sets up:
 * - STOMP protocol over WebSocket for real-time bidirectional communication
 * - SockJS fallback for browsers that don't support WebSocket
 * - Message broker for pub/sub messaging pattern
 * - Application destination prefix for client-to-server messages
 * 
 * The WebSocket endpoint is available at /ws and supports:
 * - Game move messages (place, move, remove)
 * - Chat messages between players
 * - Matchmaking messages
 * - Game state synchronization
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    /**
     * Registers STOMP endpoints that clients will connect to.
     * 
     * The /ws endpoint is configured with:
     * - SockJS fallback for browsers without WebSocket support
     * - CORS enabled for all origins (should be restricted in production)
     * 
     * @param registry the STOMP endpoint registry
     */
    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*")
                .withSockJS();
    }
    
    /**
     * Configures the message broker for routing messages.
     * 
     * Configuration:
     * - /topic prefix: for broadcasting to multiple subscribers (game state updates)
     * - /queue prefix: for point-to-point messages (private messages)
     * - /app prefix: for messages routed to @MessageMapping methods
     * 
     * @param registry the message broker registry
     */
    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
