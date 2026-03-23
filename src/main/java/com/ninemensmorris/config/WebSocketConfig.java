package com.ninemensmorris.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
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
     * Allowed origin patterns for WebSocket connections.
     * Defaults to "*" for development; override via {@code websocket.allowed-origins}
     * property in production (e.g., {@code https://yourdomain.com}).
     */
    @Value("${websocket.allowed-origins:*}")
    private String allowedOrigins;
    
    /**
     * Registers STOMP endpoints that clients will connect to.
     * 
     * The /ws endpoint is configured with:
     * - SockJS fallback for browsers without WebSocket support
     * - Configurable CORS origins (defaults to all for dev, restricted in prod)
     * - Works with both ws:// (dev) and wss:// (prod behind reverse proxy)
     * 
     * @param registry the STOMP endpoint registry
     */
    @Override
    @SuppressWarnings("null") // String.split() never returns null; origins array is safe
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
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
    
    /**
     * Registers the UserPrincipalChannelInterceptor on the inbound channel.
     * This interceptor extracts playerId from STOMP CONNECT headers and sets
     * it as the user principal, enabling convertAndSendToUser() routing.
     * 
     * @param registration the channel registration
     */
    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new UserPrincipalChannelInterceptor());
    }
}
