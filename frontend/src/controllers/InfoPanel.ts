import { PlayerColor, GamePhase, GameMode, type GameState } from '../models/index.js';

/**
 * Data required by the InfoPanel to derive display content.
 * All fields are plain values — no DOM references or side effects.
 */
export interface InfoPanelData {
  currentPlayer: PlayerColor;
  phase: GamePhase;
  whitePiecesRemaining: number;
  blackPiecesRemaining: number;
  gameMode: GameMode;
  playerColor: PlayerColor;
  isGameOver: boolean;
  winner: PlayerColor | null;
  millFormed: boolean;
  selectedPosition: number | null;
  isOpponentTurn: boolean;
  isAiThinking: boolean;
}

/**
 * Derive the contextual action instruction from the current game state.
 * Pure function — no side effects, no DOM access.
 */
export function deriveActionInstruction(data: InfoPanelData): string {
  if (data.isGameOver) {
    return '';
  }
  if (data.isOpponentTurn || data.isAiThinking) {
    return 'Waiting for opponent...';
  }
  if (data.millFormed) {
    return "Remove an opponent's piece";
  }
  if (data.phase === GamePhase.PLACEMENT) {
    return 'Place a piece on an empty position';
  }
  if (data.selectedPosition !== null) {
    return 'Select a destination for your piece';
  }
  return 'Select a piece to move';
}

/**
 * Derive the turn-change announcement message.
 * Pure function — no side effects, no DOM access.
 */
export function deriveTurnMessage(
  newPlayer: PlayerColor,
  gameMode: GameMode,
  localPlayerColor: PlayerColor
): string {
  if (gameMode === GameMode.LOCAL_TWO_PLAYER) {
    return `${newPlayer === PlayerColor.WHITE ? 'White' : 'Black'}'s Turn`;
  }
  return newPlayer === localPlayerColor ? 'Your Turn' : "Opponent's Turn";
}

/**
 * Derive the phase-transition announcement message and subtitle.
 * Pure function — no side effects, no DOM access.
 */
export function derivePhaseMessage(phase: GamePhase): { message: string; subtitle: string } {
  switch (phase) {
    case GamePhase.MOVEMENT:
      return { message: 'Movement Phase', subtitle: 'Move pieces to adjacent positions' };
    case GamePhase.FLYING:
      return { message: 'Flying Phase', subtitle: 'You can move to any empty position' };
    default:
      return { message: '', subtitle: '' };
  }
}

/**
 * Derive the game-end announcement message and subtitle.
 * Pure function — no side effects, no DOM access.
 *
 * - LOCAL_TWO_PLAYER: "[Color] Wins!" (both players share the screen)
 * - ONLINE_MULTIPLAYER / SINGLE_PLAYER: "You Won!" or "You Lost!" based on local player color
 */
export function deriveGameEndMessage(
  winner: PlayerColor | null,
  reason: string,
  gameMode: GameMode,
  localPlayerColor: PlayerColor
): { message: string; subtitle: string } {
  if (gameMode === GameMode.LOCAL_TWO_PLAYER) {
    const colorName = winner === PlayerColor.WHITE ? 'White' : 'Black';
    return { message: `${colorName} Wins!`, subtitle: reason };
  }
  if (winner === localPlayerColor) {
    return { message: 'You Won!', subtitle: reason };
  }
  return { message: 'You Lost!', subtitle: reason };
}

/**
 * Persistent HTML panel displaying current game state and action instructions.
 * Positioned adjacent to the canvas, replacing canvas-drawn game info text.
 */
export class InfoPanel {
  private container: HTMLElement | null = null;
  private turnIndicator: HTMLElement | null = null;
  private phaseDisplay: HTMLElement | null = null;
  private piecesDisplay: HTMLElement | null = null;
  private playerColorDisplay: HTMLElement | null = null;
  private actionInstruction: HTMLElement | null = null;

  /** Create and attach the Info Panel to the DOM */
  public create(): void {
    this.container = document.createElement('div');
    this.container.className = 'info-panel';
    this.container.id = 'info-panel';

    this.turnIndicator = document.createElement('div');
    this.turnIndicator.className = 'info-panel-turn';
    this.turnIndicator.textContent = 'Current Turn: —';
    this.container.appendChild(this.turnIndicator);

    this.phaseDisplay = document.createElement('div');
    this.phaseDisplay.className = 'info-panel-phase';
    this.phaseDisplay.textContent = 'Phase: —';
    this.container.appendChild(this.phaseDisplay);

    this.piecesDisplay = document.createElement('div');
    this.piecesDisplay.className = 'info-panel-pieces';
    this.piecesDisplay.textContent = 'Pieces: —';
    this.container.appendChild(this.piecesDisplay);

    this.playerColorDisplay = document.createElement('div');
    this.playerColorDisplay.className = 'info-panel-player-color';
    this.playerColorDisplay.textContent = 'You are: —';
    this.container.appendChild(this.playerColorDisplay);

    this.actionInstruction = document.createElement('div');
    this.actionInstruction.className = 'info-panel-action';
    this.actionInstruction.textContent = 'Waiting for game to start...';
    this.container.appendChild(this.actionInstruction);

    const target = document.getElementById('info-panel-container');
    if (target) {
      target.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }
  }

  /** Update all panel fields from current game state */
  public update(
    gameState: GameState,
    gameMode: GameMode,
    playerColor: PlayerColor,
    selectedPosition: number | null,
    isAiThinking: boolean
  ): void {
    if (!this.container) {
      return;
    }

    const currentPlayer = gameState.currentPlayer;
    const phase = gameState.phase;
    const isGameOver = gameState.gameOver || gameState.isGameOver || false;
    const millFormed = gameState.millFormed || false;
    const isOpponentTurn = gameMode !== GameMode.LOCAL_TWO_PLAYER && currentPlayer !== playerColor;

    if (this.turnIndicator) {
      const colorName = currentPlayer === PlayerColor.WHITE ? 'White' : 'Black';
      this.turnIndicator.textContent = `Current Turn: ${colorName}`;
    }

    if (this.phaseDisplay) {
      let phaseName: string;
      switch (phase) {
        case GamePhase.PLACEMENT:
          phaseName = 'Placement';
          break;
        case GamePhase.MOVEMENT:
          phaseName = 'Movement';
          break;
        case GamePhase.FLYING:
          phaseName = 'Flying';
          break;
        default:
          phaseName = String(phase);
      }
      this.phaseDisplay.textContent = `Phase: ${phaseName}`;
    }

    if (this.piecesDisplay) {
      if (phase === GamePhase.PLACEMENT) {
        this.piecesDisplay.textContent = `White pieces: ${gameState.whitePiecesRemaining} | Black pieces: ${gameState.blackPiecesRemaining}`;
        this.piecesDisplay.removeAttribute('data-hidden');
      } else {
        this.piecesDisplay.textContent = '\u00A0'; // non-breaking space to preserve height
        this.piecesDisplay.setAttribute('data-hidden', 'true');
      }
    }

    if (this.playerColorDisplay) {
      if (gameMode === GameMode.ONLINE_MULTIPLAYER) {
        const colorName = playerColor === PlayerColor.WHITE ? 'White' : 'Black';
        this.playerColorDisplay.textContent = `You are: ${colorName}`;
        this.playerColorDisplay.removeAttribute('data-hidden');
      } else {
        this.playerColorDisplay.textContent = '\u00A0';
        this.playerColorDisplay.setAttribute('data-hidden', 'true');
      }
    }

    if (this.actionInstruction) {
      const data: InfoPanelData = {
        currentPlayer,
        phase,
        whitePiecesRemaining: gameState.whitePiecesRemaining,
        blackPiecesRemaining: gameState.blackPiecesRemaining,
        gameMode,
        playerColor,
        isGameOver,
        winner: gameState.winner,
        millFormed,
        selectedPosition,
        isOpponentTurn,
        isAiThinking,
      };
      this.actionInstruction.textContent = deriveActionInstruction(data);
    }
  }

  /** Show the panel */
  public show(): void {
    if (this.container) {
      this.container.style.display = '';
    }
  }

  /** Hide the panel */
  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /** Remove the panel from the DOM */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.turnIndicator = null;
    this.phaseDisplay = null;
    this.piecesDisplay = null;
    this.playerColorDisplay = null;
    this.actionInstruction = null;
  }
}
