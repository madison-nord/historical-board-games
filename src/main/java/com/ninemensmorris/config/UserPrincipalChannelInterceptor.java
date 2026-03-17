package com.ninemensmorris.config;

import java.security.Principal;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * Channel interceptor that extracts the playerId from STOMP CONNECT headers
 * and sets it as the user principal on the session.
 * 
 * This enables convertAndSendToUser() to route messages to specific players
 * without requiring full authentication.
 */
public class UserPrincipalChannelInterceptor implements ChannelInterceptor {

    private static final String PLAYER_ID_HEADER = "playerId";

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String playerId = accessor.getFirstNativeHeader(PLAYER_ID_HEADER);
            if (playerId != null && !playerId.isEmpty()) {
                accessor.setUser(new PlayerPrincipal(playerId));
            }
        }

        return message;
    }

    /**
     * Simple Principal implementation that wraps a player ID.
     */
    private static class PlayerPrincipal implements Principal {
        private final String playerId;

        PlayerPrincipal(String playerId) {
            this.playerId = playerId;
        }

        @Override
        public String getName() {
            return playerId;
        }
    }
}
