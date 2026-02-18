import { PlayerColor } from './PlayerColor.js';
import { GamePhase } from './GamePhase.js';

/**
 * Represents the complete state of a Nine Men's Morris game
 * Matches backend GameState class structure
 */
export interface GameState {
  /** Unique identifier for the game */
  gameId: string;

  /** Current game phase */
  phase: GamePhase;

  /** Player whose turn it is */
  currentPlayer: PlayerColor;

  /** Board positions (24 positions, null = empty, PlayerColor = occupied) */
  board: (PlayerColor | null)[];

  /** Number of pieces remaining to place for white player */
  whitePiecesRemaining: number;

  /** Number of pieces remaining to place for black player */
  blackPiecesRemaining: number;

  /** Number of white pieces currently on the board */
  whitePiecesOnBoard: number;

  /** Number of black pieces currently on the board */
  blackPiecesOnBoard: number;

  /** Whether the game is over */
  gameOver: boolean;

  /** Winner of the game (null if game not over or draw) */
  winner: PlayerColor | null;
}
