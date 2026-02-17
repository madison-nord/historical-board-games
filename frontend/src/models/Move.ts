import { MoveType } from './MoveType.js';
import { PlayerColor } from './PlayerColor.js';

/**
 * Represents a move in Nine Men's Morris game
 * Matches backend Move class structure
 */
export interface Move {
  /** Type of move being made */
  type: MoveType;
  
  /** Source position (for MOVE operations, -1 for PLACE/REMOVE) */
  from: number;
  
  /** Target position */
  to: number;
  
  /** Player making the move */
  player: PlayerColor;
  
  /** Position of removed piece (for mill captures, -1 if none) */
  removed?: number;
}