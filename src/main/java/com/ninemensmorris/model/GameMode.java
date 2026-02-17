package com.ninemensmorris.model;

/**
 * Enumeration representing the different game modes available in Nine Men's Morris.
 * 
 * This enum defines the various ways the game can be played:
 * - Single player against AI
 * - Local two-player on the same device
 * - Online multiplayer against remote players
 */
public enum GameMode {
    
    /**
     * Single player mode where the human player competes against the AI.
     * The AI provides challenging strategic gameplay using minimax algorithm.
     */
    SINGLE_PLAYER,
    
    /**
     * Local two-player mode where two human players take turns on the same device.
     * Players alternate control with visual indicators showing whose turn it is.
     */
    LOCAL_TWO_PLAYER,
    
    /**
     * Online multiplayer mode where players compete against remote opponents.
     * Includes matchmaking, real-time synchronization, and chat functionality.
     */
    ONLINE_MULTIPLAYER
}