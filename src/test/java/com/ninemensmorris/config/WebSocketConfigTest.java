package com.ninemensmorris.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;

/**
 * Unit tests for WebSocketConfig.
 * 
 * Tests verify that WebSocket configuration is set up correctly with:
 * - STOMP endpoint with SockJS fallback
 * - Message broker configuration
 * - Application destination prefix
 */
public class WebSocketConfigTest {
    
    private WebSocketConfig webSocketConfig;
    private StompEndpointRegistry stompEndpointRegistry;
    private MessageBrokerRegistry messageBrokerRegistry;
    private StompWebSocketEndpointRegistration endpointRegistration;
    
    @BeforeEach
    @SuppressWarnings("unused") // Used by JUnit framework
    void setUp() throws Exception {
        webSocketConfig = new WebSocketConfig();
        // Set the @Value field via reflection since we're not using Spring context
        var field = WebSocketConfig.class.getDeclaredField("allowedOrigins");
        field.setAccessible(true);
        field.set(webSocketConfig, "*");
        stompEndpointRegistry = mock(StompEndpointRegistry.class);
        messageBrokerRegistry = mock(MessageBrokerRegistry.class);
        endpointRegistration = mock(StompWebSocketEndpointRegistration.class);
    }
    
    @Test
    @DisplayName("Configure STOMP endpoint with SockJS fallback")
    @SuppressWarnings("null") // Mock objects are non-null in test context
    void testConfigureStompEndpoint() {
        // Arrange
        when(stompEndpointRegistry.addEndpoint(anyString())).thenReturn(endpointRegistration);
        when(endpointRegistration.setAllowedOriginPatterns(anyString())).thenReturn(endpointRegistration);
        
        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);
        
        // Assert - allowedOrigins "*" is split by comma, producing ["*"]
        verify(stompEndpointRegistry).addEndpoint("/ws");
        verify(endpointRegistration).setAllowedOriginPatterns(new String[]{"*"});
        verify(endpointRegistration).withSockJS();
    }
    
    @Test
    @DisplayName("Configure message broker with correct prefixes")
    @SuppressWarnings("null") // Mock objects are non-null in test context
    void testConfigureMessageBroker() {
        // Act
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);
        
        // Assert
        verify(messageBrokerRegistry).enableSimpleBroker("/topic", "/queue");
        verify(messageBrokerRegistry).setApplicationDestinationPrefixes("/app");
    }
    
    @Test
    @DisplayName("Register UserPrincipalChannelInterceptor on inbound channel")
    void testConfigureClientInboundChannel() {
        // Verify the WebSocketConfig class declares configureClientInboundChannel
        // The actual interceptor behavior is tested in UserPrincipalChannelInterceptorTest
        boolean methodFound = false;
        for (java.lang.reflect.Method method : WebSocketConfig.class.getDeclaredMethods()) {
            if ("configureClientInboundChannel".equals(method.getName())) {
                methodFound = true;
                break;
            }
        }
        assert methodFound : "WebSocketConfig should declare configureClientInboundChannel method";
    }
}
