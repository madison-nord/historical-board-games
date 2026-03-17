package com.ninemensmorris.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * Unit tests for UserPrincipalChannelInterceptor.
 * Verifies that playerId from STOMP CONNECT headers is set as user principal.
 */
public class UserPrincipalChannelInterceptorTest {

    private UserPrincipalChannelInterceptor interceptor;
    private MessageChannel mockChannel;

    @BeforeEach
    @SuppressWarnings("unused") // Used by JUnit framework
    void setUp() {
        interceptor = new UserPrincipalChannelInterceptor();
        mockChannel = mock(MessageChannel.class);
    }

    /**
     * Helper to create a STOMP message with mutable headers.
     * The accessor must be set as mutable so the interceptor can call setUser().
     */
    private Message<?> createStompMessage(StompCommand command, String playerIdHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (playerIdHeader != null) {
            accessor.addNativeHeader("playerId", playerIdHeader);
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    @DisplayName("Should set user principal from playerId header on CONNECT")
    void testSetsPrincipalOnConnect() {
        Message<?> message = createStompMessage(StompCommand.CONNECT, "player-123");

        Message<?> result = interceptor.preSend(message, mockChannel);

        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertNotNull(resultAccessor.getUser());
        assertEquals("player-123", resultAccessor.getUser().getName());
    }

    @Test
    @DisplayName("Should NOT set principal when playerId header is missing")
    void testNoPrincipalWithoutHeader() {
        Message<?> message = createStompMessage(StompCommand.CONNECT, null);

        Message<?> result = interceptor.preSend(message, mockChannel);

        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertNull(resultAccessor.getUser());
    }

    @Test
    @DisplayName("Should NOT set principal on non-CONNECT commands")
    void testNoPrincipalOnSend() {
        Message<?> message = createStompMessage(StompCommand.SEND, "player-123");

        Message<?> result = interceptor.preSend(message, mockChannel);

        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertNull(resultAccessor.getUser());
    }

    @Test
    @DisplayName("Should NOT set principal when playerId is empty")
    void testNoPrincipalWithEmptyHeader() {
        Message<?> message = createStompMessage(StompCommand.CONNECT, "");

        Message<?> result = interceptor.preSend(message, mockChannel);

        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertNull(resultAccessor.getUser());
    }
}
