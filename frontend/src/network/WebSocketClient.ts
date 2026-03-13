import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameState, Move, MoveType, PlayerColor } from '../models';

// Message types for WebSocket communication
export interface GameStateUpdate {
  gameId: string;
  gameState: GameState;
}

export interface GameStartMessage {
  gameId: string;
  playerColor: PlayerColor;
  opponentId: string;
}

export interface GameEndMessage {
  gameId: string;
  winner: PlayerColor | null;
  reason: string;
}

export interface ChatMessageBroadcast {
  gameId: string;
  senderId: string;
  senderColor: PlayerColor;
  content: string;
  timestamp: string;
}

export interface OpponentDisconnectedMessage {
  gameId: string;
  timeoutSeconds: number;
}

export interface OpponentReconnectedMessage {
  gameId: string;
}

// Callback types for message handlers
export type GameStateUpdateHandler = (update: GameStateUpdate) => void;
export type GameStartHandler = (message: GameStartMessage) => void;
export type GameEndHandler = (message: GameEndMessage) => void;
export type ChatMessageHandler = (message: ChatMessageBroadcast) => void;
export type OpponentDisconnectedHandler = (message: OpponentDisconnectedMessage) => void;
export type OpponentReconnectedHandler = (message: OpponentReconnectedMessage) => void;
export type ConnectionStatusHandler = (connected: boolean) => void;

/**
 * WebSocket client for real-time multiplayer communication
 * Uses STOMP protocol over SockJS for reliable WebSocket connections
 */
export class WebSocketClient {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private playerId: string | null = null;
  private gameId: string | null = null;
  
  // Message handlers
  private onGameStateUpdateHandler: GameStateUpdateHandler | null = null;
  private onGameStartHandler: GameStartHandler | null = null;
  private onGameEndHandler: GameEndHandler | null = null;
  private onChatMessageHandler: ChatMessageHandler | null = null;
  private onOpponentDisconnectedHandler: OpponentDisconnectedHandler | null = null;
  private onOpponentReconnectedHandler: OpponentReconnectedHandler | null = null;
  private onConnectionStatusHandler: ConnectionStatusHandler | null = null;

  /**
   * Connect to the WebSocket server
   * @param playerId - Unique identifier for this player
   * @param serverUrl - WebSocket server URL (default: http://localhost:8080/ws)
   */
  connect(playerId: string, serverUrl: string = 'http://localhost:8080/ws'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.playerId = playerId;

      // Create STOMP client with SockJS
      this.client = new Client({
        webSocketFactory: () => new SockJS(serverUrl) as any,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: () => {
          console.log('WebSocket connected');
          this.notifyConnectionStatus(true);
          this.subscribeToUserQueues();
          resolve();
        },
        
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          this.notifyConnectionStatus(false);
          reject(new Error(`STOMP error: ${frame.headers['message']}`));
        },
        
        onWebSocketClose: () => {
          console.log('WebSocket closed');
          this.notifyConnectionStatus(false);
        },
        
        onWebSocketError: (error) => {
          console.error('WebSocket error:', error);
          this.notifyConnectionStatus(false);
        }
      });

      this.client.activate();
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client) {
        resolve();
        return;
      }

      // Unsubscribe from all subscriptions
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();

      // Deactivate client
      this.client.deactivate().then(() => {
        this.client = null;
        this.playerId = null;
        this.gameId = null;
        this.notifyConnectionStatus(false);
        resolve();
      });
    });
  }

  /**
   * Subscribe to user-specific message queues
   */
  private subscribeToUserQueues(): void {
    if (!this.client || !this.playerId) return;

    // Subscribe to game state updates
    const gameStateSub = this.client.subscribe(
      `/user/queue/game-state`,
      (message: IMessage) => this.handleGameStateUpdate(message)
    );
    this.subscriptions.set('game-state', gameStateSub);

    // Subscribe to game start notifications
    const gameStartSub = this.client.subscribe(
      `/user/queue/game-start`,
      (message: IMessage) => this.handleGameStart(message)
    );
    this.subscriptions.set('game-start', gameStartSub);

    // Subscribe to game end notifications
    const gameEndSub = this.client.subscribe(
      `/user/queue/game-end`,
      (message: IMessage) => this.handleGameEnd(message)
    );
    this.subscriptions.set('game-end', gameEndSub);

    // Subscribe to chat messages
    const chatSub = this.client.subscribe(
      `/user/queue/chat`,
      (message: IMessage) => this.handleChatMessage(message)
    );
    this.subscriptions.set('chat', chatSub);

    // Subscribe to opponent disconnected notifications
    const disconnectSub = this.client.subscribe(
      `/user/queue/opponent-disconnected`,
      (message: IMessage) => this.handleOpponentDisconnected(message)
    );
    this.subscriptions.set('opponent-disconnected', disconnectSub);

    // Subscribe to opponent reconnected notifications
    const reconnectSub = this.client.subscribe(
      `/user/queue/opponent-reconnected`,
      (message: IMessage) => this.handleOpponentReconnected(message)
    );
    this.subscriptions.set('opponent-reconnected', reconnectSub);
  }

  /**
   * Join the matchmaking queue
   */
  joinMatchmaking(): void {
    if (!this.client || !this.playerId) {
      throw new Error('Not connected to server');
    }

    this.client.publish({
      destination: '/app/matchmaking/join',
      body: JSON.stringify({ playerId: this.playerId })
    });
  }

  /**
   * Leave the matchmaking queue
   */
  leaveMatchmaking(): void {
    if (!this.client || !this.playerId) {
      throw new Error('Not connected to server');
    }

    this.client.publish({
      destination: '/app/matchmaking/leave',
      body: JSON.stringify({ playerId: this.playerId })
    });
  }

  /**
   * Send a move to the server
   * @param move - The move to send
   */
  sendMove(move: Move): void {
    if (!this.client || !this.gameId || !this.playerId) {
      throw new Error('Not connected or not in a game');
    }

    const destination = this.getMoveDestination(move);
    const payload = {
      gameId: this.gameId,
      playerId: this.playerId,
      ...this.getMovePayload(move)
    };

    this.client.publish({
      destination,
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send a chat message
   * @param content - The message content
   */
  sendChatMessage(content: string): void {
    if (!this.client || !this.gameId || !this.playerId) {
      throw new Error('Not connected or not in a game');
    }

    this.client.publish({
      destination: '/app/chat/send',
      body: JSON.stringify({
        gameId: this.gameId,
        playerId: this.playerId,
        content
      })
    });
  }

  /**
   * Get the appropriate destination for a move based on its type
   */
  private getMoveDestination(move: Move): string {
    switch (move.type) {
      case 'PLACE':
        return '/app/game/place';
      case 'MOVE':
        return '/app/game/move';
      case 'REMOVE':
        return '/app/game/remove';
      default:
        throw new Error(`Unknown move type: ${move.type}`);
    }
  }

  /**
   * Get the payload for a move based on its type
   */
  private getMovePayload(move: Move): object {
    switch (move.type) {
      case 'PLACE':
        return { position: move.to };
      case 'MOVE':
        return { from: move.from, to: move.to };
      case 'REMOVE':
        return { position: move.to };
      default:
        throw new Error(`Unknown move type: ${move.type}`);
    }
  }

  /**
   * Handle game state update message
   */
  private handleGameStateUpdate(message: IMessage): void {
    const update: GameStateUpdate = JSON.parse(message.body);
    if (this.onGameStateUpdateHandler) {
      this.onGameStateUpdateHandler(update);
    }
  }

  /**
   * Handle game start message
   */
  private handleGameStart(message: IMessage): void {
    const startMessage: GameStartMessage = JSON.parse(message.body);
    this.gameId = startMessage.gameId;
    if (this.onGameStartHandler) {
      this.onGameStartHandler(startMessage);
    }
  }

  /**
   * Handle game end message
   */
  private handleGameEnd(message: IMessage): void {
    const endMessage: GameEndMessage = JSON.parse(message.body);
    if (this.onGameEndHandler) {
      this.onGameEndHandler(endMessage);
    }
    this.gameId = null;
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(message: IMessage): void {
    const chatMessage: ChatMessageBroadcast = JSON.parse(message.body);
    if (this.onChatMessageHandler) {
      this.onChatMessageHandler(chatMessage);
    }
  }

  /**
   * Handle opponent disconnected message
   */
  private handleOpponentDisconnected(message: IMessage): void {
    const disconnectMessage: OpponentDisconnectedMessage = JSON.parse(message.body);
    if (this.onOpponentDisconnectedHandler) {
      this.onOpponentDisconnectedHandler(disconnectMessage);
    }
  }

  /**
   * Handle opponent reconnected message
   */
  private handleOpponentReconnected(message: IMessage): void {
    const reconnectMessage: OpponentReconnectedMessage = JSON.parse(message.body);
    if (this.onOpponentReconnectedHandler) {
      this.onOpponentReconnectedHandler(reconnectMessage);
    }
  }

  /**
   * Notify connection status change
   */
  private notifyConnectionStatus(connected: boolean): void {
    if (this.onConnectionStatusHandler) {
      this.onConnectionStatusHandler(connected);
    }
  }

  // Setter methods for message handlers

  setOnGameStateUpdate(handler: GameStateUpdateHandler): void {
    this.onGameStateUpdateHandler = handler;
  }

  setOnGameStart(handler: GameStartHandler): void {
    this.onGameStartHandler = handler;
  }

  setOnGameEnd(handler: GameEndHandler): void {
    this.onGameEndHandler = handler;
  }

  setOnChatMessage(handler: ChatMessageHandler): void {
    this.onChatMessageHandler = handler;
  }

  setOnOpponentDisconnected(handler: OpponentDisconnectedHandler): void {
    this.onOpponentDisconnectedHandler = handler;
  }

  setOnOpponentReconnected(handler: OpponentReconnectedHandler): void {
    this.onOpponentReconnectedHandler = handler;
  }

  setOnConnectionStatus(handler: ConnectionStatusHandler): void {
    this.onConnectionStatusHandler = handler;
  }

  // Getter methods

  isConnected(): boolean {
    return this.client !== null && this.client.connected;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getGameId(): string | null {
    return this.gameId;
  }
}
