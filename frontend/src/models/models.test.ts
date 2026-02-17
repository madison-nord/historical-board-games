import { describe, it, expect } from 'vitest';
import { PlayerColor, GamePhase, GameMode, MoveType } from './index.js';
import type { Move, GameState } from './index.js';

describe('Frontend Models', () => {
  it('should have correct PlayerColor enum values', () => {
    expect(PlayerColor.WHITE).toBe('WHITE');
    expect(PlayerColor.BLACK).toBe('BLACK');
  });

  it('should have correct GamePhase enum values', () => {
    expect(GamePhase.PLACEMENT).toBe('PLACEMENT');
    expect(GamePhase.MOVEMENT).toBe('MOVEMENT');
    expect(GamePhase.FLYING).toBe('FLYING');
  });

  it('should have correct GameMode enum values', () => {
    expect(GameMode.SINGLE_PLAYER).toBe('SINGLE_PLAYER');
    expect(GameMode.LOCAL_TWO_PLAYER).toBe('LOCAL_TWO_PLAYER');
    expect(GameMode.ONLINE_MULTIPLAYER).toBe('ONLINE_MULTIPLAYER');
  });

  it('should have correct MoveType enum values', () => {
    expect(MoveType.PLACE).toBe('PLACE');
    expect(MoveType.MOVE).toBe('MOVE');
    expect(MoveType.REMOVE).toBe('REMOVE');
  });

  it('should create valid Move objects', () => {
    const move: Move = {
      type: MoveType.PLACE,
      from: -1,
      to: 0,
      player: PlayerColor.WHITE
    };

    expect(move.type).toBe(MoveType.PLACE);
    expect(move.from).toBe(-1);
    expect(move.to).toBe(0);
    expect(move.player).toBe(PlayerColor.WHITE);
  });

  it('should create valid GameState objects', () => {
    const gameState: GameState = {
      gameId: 'test-game-123',
      phase: GamePhase.PLACEMENT,
      currentPlayer: PlayerColor.WHITE,
      board: new Array(24).fill(null),
      whitePiecesRemaining: 9,
      blackPiecesRemaining: 9,
      whitePiecesOnBoard: 0,
      blackPiecesOnBoard: 0,
      gameOver: false,
      winner: null
    };

    expect(gameState.gameId).toBe('test-game-123');
    expect(gameState.phase).toBe(GamePhase.PLACEMENT);
    expect(gameState.currentPlayer).toBe(PlayerColor.WHITE);
    expect(gameState.board).toHaveLength(24);
    expect(gameState.whitePiecesRemaining).toBe(9);
    expect(gameState.blackPiecesRemaining).toBe(9);
    expect(gameState.gameOver).toBe(false);
    expect(gameState.winner).toBeNull();
  });
});