# Design Document: Nine Men's Morris Digital Board Game

## Overview

This document describes the technical design for a digital implementation of Nine Men's Morris (Mills), a traditional strategy board game. The system will be built using Java 25 with a modern web-based architecture to support desktop and mobile browsers. The design emphasizes clean separation between game logic, presentation, and backend services to ensure maintainability and testability.

## Technology Stack

### Backend Technologies

**Java 25 (LTS - Released March 2025)**
- **Rationale**: Latest LTS release with modern language features including pattern matching, virtual threads, and improved performance
- **Benefits**: 
  - Virtual threads ideal for handling many concurrent WebSocket connections
  - Pattern matching simplifies game state handling code
  - Latest security updates and performance improvements
  - Long-term support ensures stability for portfolio project

**Spring Boot 3.4.x (Latest stable)**
- **Rationale**: Industry-standard framework with excellent WebSocket support and minimal configuration
- **Benefits**:
  - Built-in WebSocket and STOMP support
  - Dependency injection for clean architecture
  - Easy deployment and packaging
  - Extensive documentation and community support
  - Auto-configuration reduces boilerplate

**Spring WebSocket with STOMP Protocol**
- **Rationale**: Native Spring support for real-time bidirectional communication
- **Benefits**:
  - Seamless integration with Spring Boot
  - STOMP provides message routing and pub/sub patterns
  - Fallback to SockJS for older browsers
  - Built-in session management

**Maven 3.9.x (Latest)**
- **Rationale**: Standard Java build tool with excellent IDE integration
- **Benefits**:
  - Dependency management
  - Consistent build process
  - Plugin ecosystem for testing and packaging

### Frontend Technologies

**HTML5 Canvas API**
- **Rationale**: Native browser API for high-performance 2D graphics
- **Benefits**:
  - Smooth animations at 60 FPS
  - Direct pixel manipulation for game rendering
  - Excellent browser support
  - No external dependencies for rendering

**TypeScript 5.7.x (Latest)**
- **Rationale**: Type-safe JavaScript for robust frontend code
- **Benefits**:
  - Catch errors at compile time
  - Better IDE support and autocomplete
  - Easier refactoring and maintenance
  - Modern language features (async/await, modules)
  - Compiles to JavaScript for browser compatibility

**Vanilla TypeScript (No UI Framework)**
- **Rationale**: For game development, direct DOM and Canvas manipulation is more appropriate than React/Angular/Vue
- **Why no React/Angular/Vue**:
  - React/Angular are designed for data-driven UIs with components, not game rendering
  - Game rendering needs direct Canvas API access for 60 FPS performance
  - Virtual DOM adds unnecessary overhead for game loops
  - State management in games is different from typical web apps
  - Simpler architecture without framework complexity
  - Smaller bundle size and faster load times
- **Why no UI libraries (MUI, Bootstrap, etc.)**:
  - Game UI is custom and unique (board, pieces, animations)
  - UI libraries are designed for forms, buttons, tables - not game interfaces
  - Custom CSS gives full control over game aesthetics
  - Lighter weight without library overhead
- **What we DO use**:
  - TypeScript classes for clean code organization
  - Canvas API for game board rendering
  - DOM manipulation for menus and UI elements
  - CSS3 for styling and transitions
  - Web Components (optional) for reusable UI elements if needed

**CSS3 with Custom Styling**
- **Rationale**: Full control over game aesthetics without framework constraints
- **Benefits**:
  - Custom animations and transitions
  - Responsive design with CSS Grid and Flexbox
  - No framework-specific styling conflicts
  - Smaller CSS bundle
  - Modern CSS features (variables, calc, clamp)

**STOMP.js 7.x (Latest WebSocket client)**
- **Rationale**: Standard STOMP client for JavaScript
- **Benefits**:
  - Compatible with Spring WebSocket
  - Automatic reconnection support
  - Promise-based API

**Vite 6.x (Latest - Build tool)**
- **Rationale**: Modern, fast build tool for frontend development
- **Benefits**:
  - Lightning-fast hot module replacement (HMR)
  - Optimized production builds
  - Native ES modules support
  - TypeScript support out of the box
  - Much faster than Webpack

### Testing Technologies

**JUnit 5.11.x (Latest - Java unit testing)**
- **Rationale**: Modern Java testing framework
- **Benefits**:
  - Annotation-based test configuration
  - Parameterized tests
  - Nested test classes for organization
  - Excellent IDE integration

**jqwik 1.9.x (Latest - Property-based testing for Java)**
- **Rationale**: Mature property-based testing library for Java
- **Benefits**:
  - Integrates with JUnit 5
  - Powerful generators for complex types
  - Automatic shrinking of failing examples
  - Configurable test iterations

**Mockito 5.x (Latest - Mocking framework)**
- **Rationale**: Standard mocking library for Java
- **Benefits**:
  - Clean API for creating mocks
  - Verification of interactions
  - Stubbing method calls

**Playwright 1.49.x (Latest - E2E testing)**
- **Rationale**: Modern end-to-end testing framework
- **Benefits**:
  - Tests across Chrome, Firefox, Safari, and Edge
  - Mobile device emulation
  - Automatic waiting (no flaky tests)
  - Screenshot and video recording
  - Network interception for testing offline scenarios
  - Better than Selenium/Cypress for cross-browser testing

**Vitest 2.x (Latest - Frontend unit testing)**
- **Rationale**: Fast unit test framework for TypeScript/JavaScript
- **Benefits**:
  - Compatible with Vite
  - Jest-compatible API
  - Very fast execution
  - Built-in code coverage

### Why NOT Other Options

**Why not JavaFX?**
- Desktop-only (no mobile support)
- Requires users to download and install
- Harder to deploy and update
- Less suitable for responsive design
- Smaller community for game development

**Why not Vaadin?**
- Designed for business applications, not games
- Abstracts away too much control needed for game UI
- Heavier framework than needed
- Less control over animations and rendering
- Overkill for a game interface

**Why not React/Angular/Vue?**
- Designed for component-based data-driven UIs, not game rendering
- Virtual DOM adds overhead for game loops (need 60 FPS)
- Game state management is different from typical web apps
- Unnecessary complexity for a game
- Larger bundle size
- React/Angular re-rendering conflicts with Canvas-based game loops
- Direct Canvas API access is more performant

**Why not UI libraries (Material-UI, Bootstrap, Ant Design)?**
- Designed for business/form UIs, not games
- Game UI is highly custom (board, pieces, animations)
- Adds unnecessary weight and complexity
- Harder to achieve unique game aesthetics
- Custom CSS provides better control

**Why not pure JavaScript (no TypeScript)?**
- Lack of type safety leads to runtime errors
- Harder to maintain as codebase grows
- Poor IDE support and autocomplete
- More difficult refactoring

**Why not Webpack?**
- Slower build times than Vite
- More complex configuration
- Vite provides better developer experience

**Why not Selenium?**
- Slower than Playwright
- More flaky tests
- Harder to set up
- Playwright has better API and features

**Why not Phaser/PixiJS (game frameworks)?**
- **Phaser 3** and **PixiJS** are excellent for complex 2D games (platformers, shooters, RPGs)
- **Overkill for a board game**: Nine Men's Morris is a simple turn-based board game, not an action game
- **Unnecessary complexity**: These frameworks include physics engines, sprite systems, particle effects - none needed here
- **Larger bundle size**: Phaser is ~1.2MB minified, PixiJS is ~500KB - adds significant load time
- **Learning curve**: Would need to learn framework-specific APIs and patterns
- **Portfolio value**: Demonstrates fundamental web skills better than using a game framework
- **Canvas API is sufficient**: Nine Men's Morris only needs to draw circles, lines, and simple shapes
- **What these frameworks provide that we DON'T need**:
  - Physics engines (no physics in board games)
  - Sprite sheets and texture atlases (we have simple shapes)
  - Particle systems (minimal effects needed)
  - Complex animation timelines (simple transitions are enough)
  - Audio management (can use Web Audio API directly if needed)
  - Asset loading systems (minimal assets)

**When you WOULD use game frameworks:**
- Complex 2D games with many sprites and animations
- Games requiring physics simulation
- Games with particle effects and complex visual effects
- Games with tile maps and level editors
- Games requiring cross-platform deployment (Phaser can export to mobile)

**For Nine Men's Morris specifically:**
- Canvas API provides everything needed: drawing circles, lines, and text
- CSS3 handles UI animations and transitions
- requestAnimationFrame provides smooth rendering loop
- Much lighter weight and faster to load
- Cleaner, more maintainable code without framework abstractions

### Technology Comparison Summary

| Aspect | Vanilla TypeScript + Canvas | React/Angular | Phaser/PixiJS |
|--------|----------------------------|---------------|---------------|
| **Bundle Size** | ~50KB | ~150-300KB | ~500KB-1.2MB |
| **Load Time** | Fast | Medium | Slower |
| **Learning Curve** | Low (standard web APIs) | Medium-High | Medium |
| **Game Performance** | Excellent (direct control) | Good (virtual DOM overhead) | Excellent |
| **Suitable for Board Game** | ✅ Perfect fit | ⚠️ Overengineered | ⚠️ Overkill |
| **Portfolio Value** | ✅ Shows fundamentals | ✅ Shows framework knowledge | ⚠️ Niche skill |
| **Maintenance** | Easy (no framework updates) | Medium (framework updates) | Medium (framework updates) |
| **Flexibility** | Complete control | Framework constraints | Framework constraints |

**Decision: Vanilla TypeScript + Canvas API**
- Best fit for a turn-based board game
- Optimal performance and load time
- Demonstrates strong fundamental web development skills
- Complete control over rendering and animations
- Minimal dependencies to maintain

### Key Design Decisions

**Architecture Approach: Web-Based with Spring Boot**
- **Frontend**: TypeScript with HTML5 Canvas, built with Vite, served by Spring Boot
- **Backend**: Spring Boot 3.4 with WebSocket support for real-time multiplayer
- **Rationale**: 
  - Maximum accessibility (works on any device with a browser)
  - Better responsive design support than JavaFX
  - Easier deployment than desktop applications
  - Direct web technologies provide better control over animations and game interactions
  - Modern tooling (Vite, TypeScript) for excellent developer experience

**Game Logic: Pure Java**
- Core game engine implemented in pure Java 25, independent of UI framework
- Enables thorough unit testing and potential reuse in different contexts
- Clear separation of concerns between rules enforcement and presentation
- Can be tested without any UI dependencies

**Real-Time Communication: WebSockets with STOMP**
- Spring WebSocket with STOMP protocol for online multiplayer
- Efficient bidirectional communication for game moves and chat
- Built-in support in Spring Boot ecosystem
- Automatic reconnection and session management

**AI Implementation: Minimax with Alpha-Beta Pruning**
- Classic game tree search algorithm suitable for two-player zero-sum games
- Alpha-beta pruning for performance optimization
- Configurable depth for difficulty levels (future enhancement)
- Well-understood algorithm with proven effectiveness

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Frontend (HTML/CSS/JS)                   │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │ Game UI    │  │ Tutorial UI  │  │  Info Page  │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         WebSocket Client (STOMP)               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Spring Boot Application                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  REST Controllers                     │  │
│  │         (Static Content, Game API, Info Pages)       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              WebSocket Controllers                    │  │
│  │         (Game Moves, Chat, Matchmaking)              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Service Layer                        │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │Game Service│  │Matchmaking   │  │ AI Service  │  │  │
│  │  │            │  │Service       │  │             │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Core Game Engine                    │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │Game Logic  │  │ Board State  │  │ Rule Engine │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              In-Memory Game Storage                   │  │
│  │         (Active Games, Matchmaking Queue)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend (Browser)**
- Renders game board and UI elements
- Handles user input (mouse/touch)
- Manages animations and visual feedback
- Communicates with backend via REST and WebSocket
- Implements local game state persistence (localStorage)

**REST Controllers**
- Serves static HTML/CSS/JS assets
- Provides API endpoints for game initialization
- Serves information page content

**WebSocket Controllers**
- Handles real-time game move messages
- Manages chat message routing
- Coordinates matchmaking requests

**Game Service**
- Orchestrates game sessions
- Manages game lifecycle (create, update, complete)
- Coordinates between game engine and storage
- Handles single-player AI integration

**Matchmaking Service**
- Maintains queue of players seeking matches
- Pairs players based on availability
- Notifies players when match is found
- Handles timeout and cancellation

**AI Service**
- Implements minimax algorithm with alpha-beta pruning
- Evaluates board positions
- Selects optimal moves for AI opponent
- Runs asynchronously to avoid blocking

**Core Game Engine**
- Enforces Nine Men's Morris rules
- Manages board state representation
- Validates moves
- Detects game end conditions
- Pure Java, UI-agnostic

**In-Memory Storage**
- Stores active game sessions (Map<GameId, GameState>)
- Maintains matchmaking queue
- Stores player connections (WebSocket sessions)
- Note: For portfolio project, persistence to database is optional

## Components and Interfaces

### Core Game Engine

#### Board Representation

```java
public class Board {
    // 24 positions represented as array
    // Positions numbered 0-23 in standard Nine Men's Morris layout
    private Position[] positions;
    
    // Adjacency information for movement validation
    private Map<Integer, List<Integer>> adjacencyMap;
    
    // Mill patterns (all possible mill configurations)
    private static final int[][] MILL_PATTERNS = {
        {0, 1, 2}, {3, 4, 5}, {6, 7, 8},      // Outer square
        {9, 10, 11}, {12, 13, 14}, {15, 16, 17}, // Middle square
        {18, 19, 20}, {21, 22, 23},           // Inner square
        {0, 9, 21}, {3, 10, 18}, {6, 11, 15}, // Vertical lines
        {1, 4, 7}, {16, 19, 22},              // Vertical lines
        {8, 12, 17}, {5, 13, 20}, {2, 14, 23} // Vertical lines
    };
    
    public Board();
    public Position getPosition(int index);
    public boolean isPositionEmpty(int index);
    public List<Integer> getAdjacentPositions(int index);
    public boolean isValidPlacement(int index);
    public boolean isValidMove(int from, int to, GamePhase phase);
    public List<int[]> getMillsForPlayer(PlayerColor color);
    public boolean isPartOfMill(int position, PlayerColor color);
    public Board clone();
}

public class Position {
    private int index;
    private PlayerColor occupant; // null if empty
    
    public Position(int index);
    public boolean isEmpty();
    public PlayerColor getOccupant();
    public void setOccupant(PlayerColor color);
    public void clear();
}

public enum PlayerColor {
    WHITE, BLACK
}

public enum GamePhase {
    PLACEMENT,  // Placing initial pieces
    MOVEMENT,   // Moving pieces to adjacent positions
    FLYING      // Moving pieces anywhere (when player has 3 pieces)
}
```

#### Game State

```java
public class GameState {
    private String gameId;
    private Board board;
    private GamePhase phase;
    private PlayerColor currentPlayer;
    private int whitePiecesRemaining;  // Pieces not yet placed
    private int blackPiecesRemaining;
    private int whitePiecesOnBoard;    // Pieces currently on board
    private int blackPiecesOnBoard;
    private boolean millFormed;        // Flag indicating removal phase
    private GameStatus status;
    private PlayerColor winner;
    private List<Move> moveHistory;
    
    public GameState(String gameId);
    public void applyMove(Move move);
    public List<Move> getLegalMoves();
    public boolean isGameOver();
    public PlayerColor getWinner();
    public GameState clone();
}

public enum GameStatus {
    WAITING,      // Waiting for players
    IN_PROGRESS,  // Game active
    COMPLETED     // Game finished
}

public class Move {
    private MoveType type;
    private int from;        // -1 for placement
    private int to;
    private int removed;     // -1 if no piece removed
    private PlayerColor player;
    
    public Move(MoveType type, int from, int to, PlayerColor player);
    public Move(MoveType type, int to, PlayerColor player); // Placement
    public void setRemoved(int position);
}

public enum MoveType {
    PLACE,    // Place a new piece
    MOVE,     // Move existing piece
    REMOVE    // Remove opponent piece (after mill)
}
```

#### Rule Engine

```java
public class RuleEngine {
    
    public boolean isValidMove(GameState state, Move move);
    
    public boolean canRemovePiece(GameState state, int position);
    
    public boolean checkMillFormed(Board board, int position, PlayerColor color);
    
    public GamePhase determinePhase(GameState state);
    
    public boolean hasLegalMoves(GameState state, PlayerColor player);
    
    public GameState applyMove(GameState state, Move move);
    
    public List<Move> generateLegalMoves(GameState state);
    
    private boolean isInMill(Board board, int position, PlayerColor color);
    
    private boolean allPiecesInMills(Board board, PlayerColor color);
}
```

### AI Implementation

```java
public class AIService {
    private static final int DEFAULT_DEPTH = 4;
    private int searchDepth;
    
    public AIService();
    public AIService(int depth);
    
    public Move selectMove(GameState state, PlayerColor aiColor);
    
    private int minimax(GameState state, int depth, int alpha, int beta, 
                       boolean maximizing, PlayerColor aiColor);
    
    private int evaluatePosition(GameState state, PlayerColor aiColor);
    
    // Evaluation factors:
    // - Number of pieces on board
    // - Number of mills formed
    // - Number of blocked opponent pieces
    // - Mobility (number of legal moves)
    // - Potential mills (two pieces in a row)
    private int countMills(Board board, PlayerColor color);
    private int countPotentialMills(Board board, PlayerColor color);
    private int countMobility(GameState state, PlayerColor color);
}
```

### Service Layer

#### Game Service

```java
@Service
public class GameService {
    private Map<String, GameState> activeGames;
    private RuleEngine ruleEngine;
    private AIService aiService;
    
    public GameState createGame(GameMode mode, String player1Id, String player2Id);
    
    public GameState getGame(String gameId);
    
    public GameState makeMove(String gameId, Move move);
    
    public Move getAIMove(String gameId);
    
    public void forfeitGame(String gameId, String playerId);
    
    public void cleanupCompletedGames();
    
    private void checkGameEnd(GameState state);
}

public enum GameMode {
    SINGLE_PLAYER,
    LOCAL_TWO_PLAYER,
    ONLINE_MULTIPLAYER,
    TUTORIAL
}
```

#### Matchmaking Service

```java
@Service
public class MatchmakingService {
    private Queue<MatchmakingRequest> waitingPlayers;
    private Map<String, String> playerToGameMap;
    private SimpMessagingTemplate messagingTemplate;
    
    public void joinQueue(String playerId, String sessionId);
    
    public void leaveQueue(String playerId);
    
    private void tryMatchPlayers();
    
    private void notifyPlayersOfMatch(String player1Id, String player2Id, 
                                     String gameId);
    
    public void handleDisconnect(String playerId);
}

public class MatchmakingRequest {
    private String playerId;
    private String sessionId;
    private Instant timestamp;
}
```

### WebSocket Communication

#### Message Types

```java
// Client -> Server messages

public class PlacePieceMessage {
    private String gameId;
    private int position;
}

public class MovePieceMessage {
    private String gameId;
    private int from;
    private int to;
}

public class RemovePieceMessage {
    private String gameId;
    private int position;
}

public class ChatMessage {
    private String gameId;
    private String senderId;
    private String content;
    private Instant timestamp;
}

public class JoinMatchmakingMessage {
    private String playerId;
}

// Server -> Client messages

public class GameStateUpdate {
    private String gameId;
    private GameState state;
    private Move lastMove;
}

public class GameStartMessage {
    private String gameId;
    private PlayerColor yourColor;
    private String opponentId;
}

public class GameEndMessage {
    private String gameId;
    private PlayerColor winner;
    private EndReason reason;
}

public enum EndReason {
    VICTORY,
    FORFEIT,
    DISCONNECT
}

public class ChatMessageBroadcast {
    private String gameId;
    private String senderId;
    private String content;
    private Instant timestamp;
}

public class OpponentDisconnectedMessage {
    private String gameId;
}
```

#### WebSocket Controller

```java
@Controller
public class GameWebSocketController {
    
    @Autowired
    private GameService gameService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @MessageMapping("/game/place")
    public void handlePlacePiece(PlacePieceMessage message, 
                                 Principal principal);
    
    @MessageMapping("/game/move")
    public void handleMovePiece(MovePieceMessage message, 
                               Principal principal);
    
    @MessageMapping("/game/remove")
    public void handleRemovePiece(RemovePieceMessage message, 
                                 Principal principal);
    
    @MessageMapping("/chat/send")
    public void handleChatMessage(ChatMessage message, 
                                 Principal principal);
    
    @MessageMapping("/matchmaking/join")
    public void handleJoinMatchmaking(JoinMatchmakingMessage message, 
                                     Principal principal);
    
    @MessageMapping("/matchmaking/leave")
    public void handleLeaveMatchmaking(Principal principal);
    
    private void broadcastGameState(String gameId, GameState state, Move move);
    
    private void broadcastChatMessage(String gameId, ChatMessage message);
}
```

### Frontend Architecture

#### TypeScript Structure (Vanilla - No Framework)

The frontend uses vanilla TypeScript with direct DOM and Canvas API manipulation for optimal game performance. This approach is more suitable for games than React/Angular because:
- Direct control over rendering loop for 60 FPS
- No virtual DOM overhead
- Simpler state management for game logic
- Smaller bundle size and faster load times

```typescript
// Main game controller
class GameController {
    private gameId: string;
    private gameMode: GameMode;
    private boardRenderer: BoardRenderer;
    private webSocketClient: WebSocketClient;
    private localGameState: GameState | null;
    
    constructor(gameMode: GameMode);
    
    public startGame(): void;
    public handlePositionClick(position: number): void;
    public handleAIMove(move: Move): void;
    public saveGameState(): void;
    public loadGameState(): GameState | null;
}

// Board rendering and interaction
class BoardRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private boardState: BoardState;
    private animationQueue: Animation[];
    
    public render(): void;
    public animatePlacement(position: number, color: PlayerColor): Promise<void>;
    public animateMovement(from: number, to: number, color: PlayerColor): Promise<void>;
    public animateRemoval(position: number): Promise<void>;
    public highlightValidMoves(positions: number[]): void;
    public clearHighlights(): void;
    
    private drawBoard(): void;
    private drawPieces(): void;
    private drawHighlights(): void;
    private getPositionCoordinates(position: number): {x: number, y: number};
    
    // Game loop for smooth animations
    private gameLoop(timestamp: number): void {
        this.processAnimations(timestamp);
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// WebSocket communication
class WebSocketClient {
    private stompClient: Client;
    private gameController: GameController;
    
    public connect(): Promise<void>;
    public disconnect(): void;
    public sendMove(move: Move): void;
    public sendChatMessage(content: string): void;
    public joinMatchmaking(): void;
    public leaveMatchmaking(): void;
    
    private onGameStateUpdate(update: GameStateUpdate): void;
    private onGameStart(message: GameStartMessage): void;
    private onGameEnd(message: GameEndMessage): void;
    private onChatMessage(message: ChatMessageBroadcast): void;
}

// Tutorial system
class TutorialController {
    private currentStep: number;
    private tutorialSteps: TutorialStep[];
    private boardRenderer: BoardRenderer;
    
    public start(): void;
    public nextStep(): void;
    public previousStep(): void;
    public skip(): void;
    
    private executeStep(step: TutorialStep): void;
    private validateUserAction(action: UserAction): boolean;
}

interface TutorialStep {
    instruction: string;
    highlightPositions: number[];
    expectedAction: UserAction;
    onComplete: () => void;
}

// UI Manager for menus and dialogs (using DOM)
class UIManager {
    public showMainMenu(): void;
    public showGameModeSelection(): void;
    public showMatchmakingDialog(): void;
    public showGameResult(winner: PlayerColor): void;
    public showErrorDialog(message: string): void;
    public showResumeGameDialog(): void;
    
    private createDialog(content: HTMLElement): HTMLDialogElement;
    private closeDialog(dialog: HTMLDialogElement): void;
}

// Entry point
// main.ts
import { GameController } from './GameController';
import { UIManager } from './UIManager';

const uiManager = new UIManager();
uiManager.showMainMenu();

document.getElementById('single-player-btn')?.addEventListener('click', () => {
    const game = new GameController(GameMode.SINGLE_PLAYER);
    game.startGame();
});

// ... other event listeners
```

#### Project Structure

```
frontend/
├── src/
│   ├── main.ts                 # Entry point
│   ├── controllers/
│   │   ├── GameController.ts   # Main game orchestration
│   │   ├── TutorialController.ts
│   │   └── UIManager.ts        # Menu and dialog management
│   ├── rendering/
│   │   ├── BoardRenderer.ts    # Canvas rendering
│   │   ├── Animation.ts        # Animation system
│   │   └── Theme.ts            # Colors and styling constants
│   ├── network/
│   │   └── WebSocketClient.ts  # Server communication
│   ├── models/
│   │   ├── GameState.ts        # Frontend game state model
│   │   ├── Move.ts
│   │   └── Player.ts
│   ├── utils/
│   │   ├── LocalStorage.ts     # Persistence utilities
│   │   └── Geometry.ts         # Board position calculations
│   └── styles/
│       ├── main.css            # Global styles
│       ├── board.css           # Game board styles
│       └── ui.css              # Menu and dialog styles
├── public/
│   ├── index.html
│   └── assets/
│       └── images/
├── tests/
│   ├── unit/                   # Vitest unit tests
│   └── e2e/                    # Playwright E2E tests
├── package.json
├── tsconfig.json
├── vite.config.ts
└── playwright.config.ts
```

## Data Models

### Database Schema (Optional for Portfolio)

For a portfolio project, in-memory storage is sufficient. However, if persistence is desired:

```sql
-- Players table (optional - can use session-based identification)
CREATE TABLE players (
    player_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table (for game history)
CREATE TABLE games (
    game_id VARCHAR(36) PRIMARY KEY,
    game_mode VARCHAR(20) NOT NULL,
    player1_id VARCHAR(36),
    player2_id VARCHAR(36),
    winner VARCHAR(36),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    move_count INTEGER,
    FOREIGN KEY (player1_id) REFERENCES players(player_id),
    FOREIGN KEY (player2_id) REFERENCES players(player_id)
);

-- Moves table (for game replay)
CREATE TABLE moves (
    move_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(36) NOT NULL,
    move_number INTEGER NOT NULL,
    player_color VARCHAR(10) NOT NULL,
    move_type VARCHAR(10) NOT NULL,
    from_position INTEGER,
    to_position INTEGER,
    removed_position INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(game_id)
);
```

### Local Storage Schema (Browser)

```typescript
interface SavedGameState {
    gameId: string;
    gameMode: GameMode;
    board: number[];  // Array of 24 positions (-1=empty, 0=white, 1=black)
    phase: GamePhase;
    currentPlayer: PlayerColor;
    whitePiecesRemaining: number;
    blackPiecesRemaining: number;
    whitePiecesOnBoard: number;
    blackPiecesOnBoard: number;
    millFormed: boolean;
    moveHistory: Move[];
    savedAt: string;  // ISO timestamp
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Core Game Logic Properties

**Property 1: Phase Identification**
*For any* game state, the Game_Engine should correctly identify whether the game is in Placement, Movement, or Flying phase based on the number of pieces remaining and pieces on board.
**Validates: Requirements 1.1**

**Property 2: Mill Formation Enables Removal**
*For any* board state where a player forms a mill, the Game_Engine should allow that player to remove exactly one opponent piece before continuing play.
**Validates: Requirements 1.2**

**Property 3: Protected Mill Pieces**
*For any* board state where a player attempts to remove an opponent piece, if that piece is part of a mill and other non-mill pieces exist for that color, the removal should be rejected.
**Validates: Requirements 1.3**

**Property 4: Flying Phase Activation**
*For any* game state where a player has exactly three pieces on the board, that player should be able to move to any empty position (flying), not just adjacent positions.
**Validates: Requirements 1.4**

**Property 5: Win Condition Detection**
*For any* game state where a player has fewer than three pieces on board OR has no legal moves available, the Game_Engine should declare the opponent as the winner.
**Validates: Requirements 1.5**

**Property 6: Initial Game State**
*For any* newly created game, both players should start with exactly nine pieces to place and an empty board.
**Validates: Requirements 1.6**

**Property 7: Placement Validation**
*For any* placement move during the Placement phase, the move should only be valid if the target position is empty.
**Validates: Requirements 1.7**

**Property 8: Movement Validation**
*For any* movement move during the Movement phase (non-flying), the move should only be valid if the destination is empty AND adjacent to the source position according to the board's adjacency map.
**Validates: Requirements 1.8**

**Property 9: Turn Alternation**
*For any* game state and valid move, applying the move should result in the current player switching to the opponent.
**Validates: Requirements 1.9, 4.2**

**Property 10: Move Legality Invariant**
*For any* game state, all moves generated by the legal move generator should be accepted as valid by the move validator, and all moves not in the legal move list should be rejected.
**Validates: Requirements 1.7, 1.8, 3.2**

### AI Properties

**Property 11: AI Move Legality**
*For any* game state where the AI is to move, the move selected by the AI should always be in the set of legal moves for that state.
**Validates: Requirements 3.2**

**Property 12: AI Evaluation Consistency**
*For any* board position, evaluating it multiple times should produce the same score (evaluation function should be deterministic).
**Validates: Requirements 3.2**

### Matchmaking and Multiplayer Properties

**Property 13: Matchmaking Pairing**
*For any* two players in the matchmaking queue, when they are paired, a new game should be created with both players assigned and colors randomly distributed.
**Validates: Requirements 5.1, 5.2**

**Property 14: Game State Synchronization**
*For any* move made in an online multiplayer game, both players should receive a game state update containing the same board state and game phase.
**Validates: Requirements 5.3**

**Property 15: Chat Message Delivery**
*For any* chat message sent by a player in an online game, the opponent should receive a message with the same content and sender information.
**Validates: Requirements 6.2, 6.3**

**Property 16: Chat Content Filtering**
*For any* chat message containing inappropriate language from a predefined list, the Chat_System should either block the message or replace inappropriate words before delivery.
**Validates: Requirements 6.4**

### Tutorial Properties

**Property 17: Tutorial Action Validation**
*For any* tutorial step that expects a specific player action, providing the correct action should advance to the next step, while incorrect actions should provide feedback without advancing.
**Validates: Requirements 7.4**

### State Persistence Properties

**Property 18: Save-Load Round Trip**
*For any* local game state (single-player or local two-player), saving the state to browser storage and then loading it should produce an equivalent game state.
**Validates: Requirements 11.1**

**Property 19: Persistence Cleanup**
*For any* local game that reaches completion or is explicitly abandoned, the saved state in browser storage should be cleared.
**Validates: Requirements 11.3**

**Property 20: State Preservation During Resize**
*For any* game in progress, triggering a window resize event should not modify the game state (board position, phase, current player, or move history).
**Validates: Requirements 9.3**

### Rule Invariants

**Property 21: Board Position Count Invariant**
*For any* game state, the total number of pieces on the board plus the number of pieces remaining to place should equal 18 (9 per player) minus the number of pieces that have been removed.
**Validates: Requirements 1.6**

**Property 22: Mill Detection Consistency**
*For any* board state and position, if a piece at that position is part of a mill, then there must exist at least one valid mill pattern (from the predefined mill patterns) that includes that position and is occupied by pieces of the same color.
**Validates: Requirements 1.2**

## Error Handling

### Game Engine Errors

**Invalid Move Handling**
- When an invalid move is attempted, the Game_Engine should reject it and return a descriptive error message
- The game state should remain unchanged after an invalid move attempt
- Error messages should indicate why the move is invalid (e.g., "Position occupied", "Not adjacent", "Piece is in a mill")

**Illegal State Detection**
- The Game_Engine should detect and prevent illegal states (e.g., more than 9 pieces per player)
- If an illegal state is detected, the system should log the error and attempt recovery or game reset
- Illegal states should never be persisted to storage

### Network and Communication Errors

**WebSocket Connection Failures**
- When WebSocket connection fails, the frontend should display a clear error message
- The system should attempt automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- After 5 failed reconnection attempts, the user should be prompted to refresh or return to main menu

**Message Delivery Failures**
- When a game move message fails to send, the frontend should retry up to 3 times
- If all retries fail, the user should be notified and given the option to forfeit or wait
- Chat messages that fail to send should be marked as "failed" in the UI with a retry option

**Matchmaking Timeout**
- When no match is found within 30 seconds, the user should be notified
- The user should be given options to: continue waiting, play against AI, or cancel
- The matchmaking request should remain active if the user chooses to continue waiting

**Opponent Disconnection**
- When an opponent disconnects, the remaining player should be notified immediately
- The game state should be preserved on the server for 60 seconds
- If the opponent reconnects within 60 seconds, the game should resume
- If the opponent doesn't reconnect, the remaining player should be declared the winner

### Frontend Errors

**Browser Storage Failures**
- When localStorage is unavailable or full, the system should gracefully degrade (no persistence)
- The user should be notified that game state won't be saved
- The game should remain playable without persistence

**Rendering Errors**
- When canvas rendering fails, the system should fall back to DOM-based rendering
- If both rendering methods fail, display a clear error message with browser compatibility information

**Input Validation**
- All user inputs (moves, chat messages) should be validated on the frontend before sending
- Invalid inputs should be rejected with immediate visual feedback
- Validation errors should never crash the application

### Backend Errors

**Service Unavailability**
- When the backend service is unavailable, the frontend should display a maintenance message
- Single-player and local two-player modes should remain functional (no backend required)
- Online features should be gracefully disabled with clear messaging

**Game State Corruption**
- When a corrupted game state is detected, the system should log the error with full state details
- The affected game should be terminated and players notified
- Players should be returned to the main menu with an apology message

**Concurrent Modification**
- When two moves are received simultaneously (race condition), the server should process them in order of receipt
- The second move should be validated against the state after the first move
- If the second move becomes invalid, the player should be notified and allowed to make a new move

## Testing Strategy

### Overview

The testing strategy employs a dual approach combining traditional unit testing with property-based testing to ensure comprehensive coverage and correctness guarantees.

**Unit Tests**: Validate specific examples, edge cases, and integration points
**Property Tests**: Verify universal properties across randomly generated inputs

Together, these approaches provide both concrete validation of known scenarios and broad coverage of the input space.

### Property-Based Testing

**Framework**: Use **jqwik** for Java property-based testing
- jqwik is a mature property-based testing library for Java
- Integrates seamlessly with JUnit 5
- Provides powerful generators and shrinking capabilities

**Configuration**:
- Each property test should run a minimum of 100 iterations
- Use `@Property` annotation with `tries = 100` or higher
- Each test should include a comment tag referencing the design property

**Tag Format**:
```java
// Feature: nine-mens-morris-game, Property 1: Phase Identification
@Property(tries = 100)
void testPhaseIdentification(@ForAll GameState state) {
    // Test implementation
}
```

**Test Organization**:
- Property tests should be in separate test classes from unit tests
- Organize by component: `GameEnginePropertyTests`, `AIServicePropertyTests`, etc.
- Each correctness property from the design should have exactly one corresponding property test

**Generators**:
Custom generators needed for property tests:
- `GameStateGenerator`: Generates valid game states in various phases
- `BoardGenerator`: Generates valid board configurations
- `MoveGenerator`: Generates valid and invalid moves
- `MillPatternGenerator`: Generates boards with and without mills

### Unit Testing

**Framework**: JUnit 5 with Mockito for mocking

**Coverage Areas**:

**Game Engine Unit Tests**:
- Specific examples of each game phase
- Edge cases: exactly 3 pieces (flying threshold), exactly 2 pieces (loss condition)
- Mill formation patterns: all 16 possible mill configurations
- Removal validation: pieces in mills vs. not in mills
- Win condition scenarios: no legal moves, fewer than 3 pieces

**AI Service Unit Tests**:
- Known board positions with expected best moves
- Minimax depth limiting
- Alpha-beta pruning effectiveness
- Evaluation function components

**Service Layer Unit Tests**:
- Game creation for each game mode
- Move application and state updates
- Matchmaking queue operations
- Chat message routing
- Disconnect handling

**WebSocket Controller Unit Tests**:
- Message handling for each message type
- Error responses for invalid messages
- Broadcasting to correct recipients
- Session management

**Frontend Unit Tests** (JavaScript/TypeScript with Jest):
- Board rendering calculations
- Position coordinate mapping
- Animation queue management
- WebSocket message handling
- Local storage operations
- Tutorial step progression

### Integration Testing

**Backend Integration Tests** (Spring Boot Test):
- Full game flow: create game → make moves → complete game
- Matchmaking flow: join queue → get matched → start game
- WebSocket communication: connect → send messages → receive updates
- Error scenarios: invalid moves, disconnections, timeouts

**End-to-End Tests** (Playwright):

These tests automate the manual testing checklist and provide comprehensive coverage of user flows and visual behavior.

**Visual and Responsive Design Tests**:
```typescript
// Test board rendering at different resolutions
test('board renders correctly on desktop resolutions', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await expect(page.locator('.game-board')).toBeVisible();
  await expect(page.locator('.game-board')).toHaveScreenshot('board-1920x1080.png');
  
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(page.locator('.game-board')).toHaveScreenshot('board-1366x768.png');
  
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('.game-board')).toHaveScreenshot('board-1024x768.png');
});

test('board renders correctly on mobile devices', async ({ page }) => {
  // iPhone SE
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page.locator('.game-board')).toBeVisible();
  await expect(page.locator('.game-board')).toHaveScreenshot('board-iphone-se.png');
  
  // iPhone 12
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.game-board')).toHaveScreenshot('board-iphone-12.png');
  
  // iPad
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('.game-board')).toHaveScreenshot('board-ipad.png');
});

test('touch targets are appropriately sized on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  
  // Measure touch target sizes
  const positions = await page.locator('.board-position').all();
  for (const position of positions) {
    const box = await position.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
```

**Cross-Browser Tests**:
Playwright automatically runs tests across Chrome, Firefox, Safari, and Edge when configured:
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'edge', use: { ...devices['Desktop Edge'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

**Game Flow Tests**:
```typescript
test('complete single-player game - player wins', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  await page.click('button:has-text("Play as White")');
  
  // Play through a game (using known winning sequence)
  // ... make moves ...
  
  await expect(page.locator('.game-result')).toContainText('You Win!');
});

test('complete single-player game - AI wins', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  await page.click('button:has-text("Play as Black")');
  
  // Make suboptimal moves to let AI win
  // ... make moves ...
  
  await expect(page.locator('.game-result')).toContainText('AI Wins');
});

test('complete local two-player game', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Local Two Player")');
  
  // Verify turn indicator switches
  await expect(page.locator('.current-player')).toContainText('White');
  await page.click('.board-position[data-index="0"]');
  await expect(page.locator('.current-player')).toContainText('Black');
  
  // ... complete game ...
  
  await expect(page.locator('.game-result')).toBeVisible();
});

test('complete tutorial', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Tutorial")');
  
  // Step through tutorial
  await expect(page.locator('.tutorial-step')).toContainText('Welcome');
  await page.click('button:has-text("Next")');
  
  // ... complete all tutorial steps ...
  
  await expect(page.locator('.tutorial-complete')).toBeVisible();
  await expect(page.locator('button:has-text("Practice vs AI")')).toBeVisible();
});

test('online multiplayer with matchmaking', async ({ browser }) => {
  // Create two browser contexts (two players)
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Both players join matchmaking
  await page1.goto('/');
  await page1.click('button:has-text("Online Multiplayer")');
  await page1.click('button:has-text("Find Match")');
  
  await page2.goto('/');
  await page2.click('button:has-text("Online Multiplayer")');
  await page2.click('button:has-text("Find Match")');
  
  // Wait for match
  await expect(page1.locator('.game-board')).toBeVisible({ timeout: 5000 });
  await expect(page2.locator('.game-board')).toBeVisible({ timeout: 5000 });
  
  // Verify both players see the game
  await expect(page1.locator('.opponent-info')).toBeVisible();
  await expect(page2.locator('.opponent-info')).toBeVisible();
  
  // Player 1 makes a move
  const isPlayer1Turn = await page1.locator('.your-turn').isVisible();
  if (isPlayer1Turn) {
    await page1.click('.board-position[data-index="0"]');
    // Verify player 2 sees the move
    await expect(page2.locator('.board-position[data-index="0"]')).toHaveClass(/occupied/);
  }
  
  await context1.close();
  await context2.close();
});

test('chat functionality in online game', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Set up online game (similar to above)
  // ...
  
  // Player 1 sends a message
  await page1.fill('.chat-input', 'Good luck!');
  await page1.press('.chat-input', 'Enter');
  
  // Verify player 2 receives it
  await expect(page2.locator('.chat-message')).toContainText('Good luck!');
  
  // Test mute functionality
  await page2.click('button:has-text("Mute Chat")');
  await page1.fill('.chat-input', 'Another message');
  await page1.press('.chat-input', 'Enter');
  
  // Verify player 2 doesn't see it (or sees it muted)
  await expect(page2.locator('.chat-messages')).not.toContainText('Another message');
  
  await context1.close();
  await context2.close();
});

test('disconnect and reconnect scenario', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Set up online game
  // ...
  
  // Player 1 disconnects
  await context1.close();
  
  // Player 2 should see disconnect notification
  await expect(page2.locator('.opponent-disconnected')).toBeVisible();
  await expect(page2.locator('button:has-text("Wait")')).toBeVisible();
  await expect(page2.locator('button:has-text("Claim Victory")')).toBeVisible();
  
  await context2.close();
});

test('game state persistence', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  
  // Make a few moves
  await page.click('.board-position[data-index="0"]');
  await page.waitForTimeout(500); // Wait for AI move
  await page.click('.board-position[data-index="1"]');
  
  // Close and reopen browser
  await page.close();
  const newPage = await page.context().newPage();
  await newPage.goto('/');
  
  // Should offer to resume
  await expect(newPage.locator('button:has-text("Resume Game")')).toBeVisible();
  await newPage.click('button:has-text("Resume Game")');
  
  // Verify game state is restored
  await expect(newPage.locator('.board-position[data-index="0"]')).toHaveClass(/occupied/);
  await expect(newPage.locator('.board-position[data-index="1"]')).toHaveClass(/occupied/);
});
```

**Animation and Performance Tests**:
```typescript
test('animations are smooth', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  
  // Start performance monitoring
  await page.evaluate(() => {
    (window as any).frameCount = 0;
    (window as any).startTime = performance.now();
    
    function countFrames() {
      (window as any).frameCount++;
      requestAnimationFrame(countFrames);
    }
    requestAnimationFrame(countFrames);
  });
  
  // Make a move (triggers animation)
  await page.click('.board-position[data-index="0"]');
  await page.waitForTimeout(500); // Animation duration
  
  // Check frame rate
  const fps = await page.evaluate(() => {
    const elapsed = performance.now() - (window as any).startTime;
    return ((window as any).frameCount / elapsed) * 1000;
  });
  
  expect(fps).toBeGreaterThan(55); // Close to 60 FPS
});

test('visual feedback is immediate', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  
  // Measure time from click to visual feedback
  const startTime = Date.now();
  await page.click('.board-position[data-index="0"]');
  await expect(page.locator('.board-position[data-index="0"]')).toHaveClass(/highlighted/);
  const endTime = Date.now();
  
  expect(endTime - startTime).toBeLessThan(100); // Under 100ms
});
```

**Input Method Tests**:
```typescript
test('mouse input works correctly', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  
  // Click with mouse
  await page.mouse.click(100, 100); // Click on board position
  await expect(page.locator('.board-position[data-index="0"]')).toHaveClass(/occupied/);
});

test('touch input works correctly', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.click('button:has-text("Single Player")');
  
  // Tap with touch
  await page.touchscreen.tap(100, 100);
  await expect(page.locator('.board-position[data-index="0"]')).toHaveClass(/occupied/);
});
```

**Accessibility Tests**:
```typescript
test('keyboard navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Tab through interactive elements
  await page.keyboard.press('Tab');
  await expect(page.locator('button:has-text("Single Player")')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('button:has-text("Local Two Player")')).toBeFocused();
  
  // Activate with Enter
  await page.keyboard.press('Enter');
  await expect(page.locator('.game-board')).toBeVisible();
});

test('screen reader compatibility', async ({ page }) => {
  await page.goto('/');
  
  // Check for ARIA labels
  await expect(page.locator('.game-board')).toHaveAttribute('role', 'application');
  await expect(page.locator('.board-position[data-index="0"]')).toHaveAttribute('aria-label');
  await expect(page.locator('.current-player')).toHaveAttribute('aria-live', 'polite');
});
```

### Test Data

**Predefined Board Positions**:
Create a library of interesting board positions for testing:
- Opening positions (various piece placements)
- Mid-game positions (complex mill situations)
- End-game positions (flying phase scenarios)
- Winning positions (one move from victory)
- Stalemate positions (no legal moves)

**Example**:
```java
public class TestBoards {
    public static Board SIMPLE_MILL = Board.fromString(
        "WWW------" +  // Positions 0-8 (outer square)
        "---------" +  // Positions 9-17 (middle square)
        "------BBB"    // Positions 18-23 (inner square)
    );
    
    public static Board FLYING_PHASE_WHITE = Board.fromString(
        "W--------" +
        "----B----" +
        "W----B--W"
    );
    // ... more test boards
}
```

### Performance Testing

**AI Performance**:
- Measure AI move selection time at various depths
- Target: < 2 seconds for depth 4
- Profile and optimize if necessary

**WebSocket Latency**:
- Measure round-trip time for game moves
- Target: < 500ms under normal network conditions
- Test with simulated network delays

**Frontend Rendering**:
- Measure frame rate during animations
- Target: 60 FPS on modern devices
- Use browser performance tools

### Manual Testing Checklist

While most testing is automated, some aspects still benefit from human evaluation:

**Subjective Quality Assessment**:
- [ ] Animations feel smooth and natural (not just technically 60 FPS)
- [ ] Color scheme is aesthetically pleasing and professional
- [ ] Typography is readable and appropriate
- [ ] Overall "feel" of the game is polished and engaging
- [ ] Tutorial explanations are clear and easy to understand
- [ ] Information page content is well-written and engaging
- [ ] Game difficulty feels appropriate (AI is challenging but not impossible)

**Real-World Network Testing**:
- [ ] Test online multiplayer on actual slow network (3G simulation)
- [ ] Test with high latency connections (VPN to distant server)
- [ ] Test with intermittent connectivity (airplane mode on/off)

**Real Device Testing**:
- [ ] Test on actual physical devices (not just emulators)
- [ ] Test on older devices to verify performance
- [ ] Test on devices with different screen densities

**Exploratory Testing**:
- [ ] Try to break the game with unexpected inputs
- [ ] Test edge cases not covered by automated tests
- [ ] Verify error messages are helpful and user-friendly
- [ ] Test with browser extensions enabled (ad blockers, etc.)

**User Experience Validation**:
- [ ] Have someone unfamiliar with the game try the tutorial
- [ ] Observe if users can figure out the interface without instructions
- [ ] Gather feedback on confusing or frustrating aspects

### Continuous Integration

**CI Pipeline**:
1. Run all unit tests (Java and JavaScript)
2. Run all property tests (100+ iterations each)
3. Run integration tests
4. Generate code coverage report (target: >80% for game engine)
5. Run linting and static analysis
6. Build and package application

**Pre-Deployment Checklist**:
- [ ] All tests passing
- [ ] Code coverage meets threshold
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Manual testing completed
- [ ] Documentation updated
