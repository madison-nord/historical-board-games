# Implementation Plan: Nine Men's Morris Digital Board Game

## Overview

This implementation plan breaks down the Nine Men's Morris game into discrete, incremental coding tasks. This is the first game in the Historical Board Games platform, and the architecture is designed to be extensible for future games.

The approach follows a bottom-up strategy: build the core game engine first, then add AI, then build the frontend, and finally integrate online multiplayer features. Each task builds on previous work, ensuring continuous integration and early validation through testing.

**Platform Considerations**: While this plan focuses on Nine Men's Morris, the implementation will:
- Use a modular architecture that can accommodate multiple games
- Build reusable components (matchmaking, chat, WebSocket infrastructure)
- Design the frontend to support game selection and navigation
- Keep game-specific logic isolated in the engine package

The implementation uses:
- **Backend**: Java 25 with Spring Boot 3.4 for game logic and multiplayer
- **Frontend**: TypeScript 5.7 with vanilla Canvas API (no framework) for optimal game performance
- **Testing**: JUnit 5 + jqwik for backend, Vitest + Playwright for frontend

## Tasks

### Phase 1: Project Setup and Core Infrastructure

- [x] 1. Set up project structure and build configuration
  - Create Maven project with Spring Boot 3.4 parent
  - Configure Java 25 compiler settings
  - Set up frontend directory with Vite 6 and TypeScript 5.7
  - Configure project dependencies (Spring WebSocket, STOMP, JUnit 5, jqwik, Vitest, Playwright)
  - Create basic package structure: `engine`, `service`, `controller`, `model`
  - Set up Git repository with .gitignore
  - Create README with project overview and setup instructions
  - _Requirements: 12.5_

- [x] 2. Create core data models for game state
  - Implement `Position` class with index and occupant
  - Implement `PlayerColor` enum (WHITE, BLACK)
  - Implement `GamePhase` enum (PLACEMENT, MOVEMENT, FLYING)
  - Implement `MoveType` enum (PLACE, MOVE, REMOVE)
  - Implement `Move` class with type, from, to, removed, and player
  - Implement `GameStatus` enum (WAITING, IN_PROGRESS, COMPLETED)
  - _Requirements: 1.1, 1.6_


### Phase 2: Core Game Engine

- [x] 3. Implement Board class with position management
  - [x] 3.1 Create Board class with 24-position array
    - Initialize positions array (0-23)
    - Define adjacency map for all 24 positions based on Nine Men's Morris layout
    - Define MILL_PATTERNS constant with all 16 mill configurations
    - Implement `getPosition(int index)` method
    - Implement `isPositionEmpty(int index)` method
    - Implement `getAdjacentPositions(int index)` method
    - Implement `clone()` method for board copying
    - _Requirements: 1.7, 1.8_
  
  - [x] 3.2 Write property test for board adjacency
    - **Property 8: Movement Validation**
    - **Validates: Requirements 1.8**
    - Test that all adjacency relationships are bidirectional
    - Test that no position is adjacent to itself
    - Test that adjacency map covers all 24 positions
  
  - [x] 3.3 Write unit tests for board initialization
    - Test that new board has 24 empty positions
    - Test that adjacency map contains correct connections
    - Test that MILL_PATTERNS contains all 16 mills
    - _Requirements: 1.7, 1.8_

- [ ] 4. Implement GameState class with state management
  - [ ] 4.1 Create GameState class
    - Implement constructor with gameId initialization
    - Initialize board, phase (PLACEMENT), currentPlayer (WHITE)
    - Initialize piece counters: 9 remaining per player, 0 on board
    - Implement `applyMove(Move move)` method
    - Implement `isGameOver()` method
    - Implement `getWinner()` method
    - Implement `clone()` method
    - _Requirements: 1.1, 1.6, 1.9_
  
  - [ ] 4.2 Write property test for initial game state
    - **Property 6: Initial Game State**
    - **Validates: Requirements 1.6**
    - Test that all new games start with 9 pieces per player
    - Test that all new games start with empty board
    - Test that all new games start in PLACEMENT phase
    - Test that all new games start with WHITE as current player

- [ ] 5. Implement RuleEngine for game rules validation
  - [ ] 5.1 Create RuleEngine class with move validation
    - Implement `isValidMove(GameState, Move)` for placement moves
    - Implement `isValidMove(GameState, Move)` for movement moves
    - Implement `isValidMove(GameState, Move)` for flying moves
    - Implement `checkMillFormed(Board, int position, PlayerColor)` method
    - Implement `canRemovePiece(GameState, int position)` method
    - Implement `determinePhase(GameState)` method
    - Implement `hasLegalMoves(GameState, PlayerColor)` method
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8_
  
  - [ ] 5.2 Write property test for placement validation
    - **Property 7: Placement Validation**
    - **Validates: Requirements 1.7**
    - Test that placement is only valid on empty positions
    - Test that placement is rejected on occupied positions
  
  - [ ] 5.3 Write property test for movement validation
    - **Property 8: Movement Validation**
    - **Validates: Requirements 1.8**
    - Test that movement requires adjacent empty position
    - Test that movement is rejected for non-adjacent positions
    - Test that movement is rejected for occupied positions
  
  - [ ] 5.4 Write property test for flying phase activation
    - **Property 4: Flying Phase Activation**
    - **Validates: Requirements 1.4**
    - Test that players with exactly 3 pieces can move anywhere
    - Test that players with more than 3 pieces cannot fly
  
  - [ ] 5.5 Write property test for mill protection
    - **Property 3: Protected Mill Pieces**
    - **Validates: Requirements 1.3**
    - Test that pieces in mills cannot be removed if other pieces exist
    - Test that pieces in mills can be removed if no other pieces exist


- [ ] 6. Implement move generation and game flow
  - [ ] 6.1 Add legal move generation to RuleEngine
    - Implement `generateLegalMoves(GameState)` method
    - Generate placement moves during PLACEMENT phase
    - Generate movement moves during MOVEMENT phase
    - Generate flying moves during FLYING phase
    - Generate removal moves after mill formation
    - _Requirements: 1.1, 1.7, 1.8_
  
  - [ ] 6.2 Write property test for move legality invariant
    - **Property 10: Move Legality Invariant**
    - **Validates: Requirements 1.7, 1.8**
    - Test that all generated moves are valid
    - Test that all valid moves are in generated list
  
  - [ ] 6.3 Write property test for turn alternation
    - **Property 9: Turn Alternation**
    - **Validates: Requirements 1.9, 4.2**
    - Test that applying any valid move switches current player
  
  - [ ] 6.4 Write property test for phase identification
    - **Property 1: Phase Identification**
    - **Validates: Requirements 1.1**
    - Test that phase is correctly determined based on game state
  
  - [ ] 6.5 Write property test for win condition detection
    - **Property 5: Win Condition Detection**
    - **Validates: Requirements 1.5**
    - Test that game ends when player has fewer than 3 pieces
    - Test that game ends when player has no legal moves

- [ ] 7. Checkpoint - Core game engine complete
  - Ensure all core game engine tests pass
  - Verify that a complete game can be played programmatically
  - Ask the user if questions arise

### Phase 3: AI Implementation

- [ ] 8. Implement board evaluation for AI
  - [ ] 8.1 Create AIService class with evaluation function
    - Implement `evaluatePosition(GameState, PlayerColor)` method
    - Score based on piece count difference
    - Score based on number of mills formed
    - Score based on number of potential mills (2 in a row)
    - Score based on mobility (number of legal moves)
    - Score based on blocked opponent pieces
    - _Requirements: 3.2, 3.3_
  
  - [ ] 8.2 Write unit tests for evaluation function
    - Test evaluation of winning positions (high score)
    - Test evaluation of losing positions (low score)
    - Test evaluation of equal positions (near zero score)
    - Test that more mills = higher score
    - _Requirements: 3.2_

- [ ] 9. Implement minimax algorithm with alpha-beta pruning
  - [ ] 9.1 Add minimax search to AIService
    - Implement `minimax(GameState, depth, alpha, beta, maximizing, aiColor)` method
    - Implement recursive tree search with depth limiting
    - Implement alpha-beta pruning for optimization
    - Implement `selectMove(GameState, PlayerColor)` public method
    - Set default search depth to 4
    - _Requirements: 3.2_
  
  - [ ] 9.2 Write property test for AI move legality
    - **Property 11: AI Move Legality**
    - **Validates: Requirements 3.2**
    - Test that AI always selects legal moves
  
  - [ ] 9.3 Write property test for evaluation consistency
    - **Property 12: AI Evaluation Consistency**
    - **Validates: Requirements 3.2**
    - Test that evaluating same position multiple times gives same score
  
  - [ ] 9.4 Write unit tests for AI strategic behavior
    - Test that AI forms mills when possible
    - Test that AI blocks opponent mills
    - Test that AI removes opponent pieces after forming mills
    - Test that AI completes game in winning positions
    - _Requirements: 3.2, 3.3_


### Phase 4: Service Layer

- [ ] 10. Implement GameService for game orchestration
  - [ ] 10.1 Create GameService class
    - Implement `createGame(GameMode, player1Id, player2Id)` method
    - Implement `getGame(gameId)` method
    - Implement `makeMove(gameId, Move)` method with validation
    - Implement `getAIMove(gameId)` method that calls AIService
    - Implement `forfeitGame(gameId, playerId)` method
    - Implement `cleanupCompletedGames()` method
    - Use ConcurrentHashMap for thread-safe game storage
    - _Requirements: 3.1, 4.1, 5.2_
  
  - [ ] 10.2 Write unit tests for GameService
    - Test game creation for each game mode
    - Test move application and state updates
    - Test AI move integration
    - Test forfeit handling
    - Test game cleanup
    - _Requirements: 3.1, 4.1_

- [ ] 11. Checkpoint - Backend game logic complete
  - Ensure all backend tests pass
  - Verify single-player game can be played through service layer
  - Ask the user if questions arise

### Phase 5: Frontend Foundation

- [ ] 12. Set up frontend project structure
  - [ ] 12.1 Initialize Vite project with TypeScript
    - Create frontend directory with Vite 6 configuration
    - Configure TypeScript 5.7 with strict mode
    - Set up project structure: controllers, rendering, network, models, utils, styles
    - Create index.html with canvas element
    - Create main.ts entry point
    - Configure Vite to proxy API requests to Spring Boot backend
    - _Requirements: 12.5_
  
  - [ ] 12.2 Create frontend data models
    - Create TypeScript interfaces matching backend models
    - Implement `GameState` interface
    - Implement `Move` interface
    - Implement `PlayerColor` enum
    - Implement `GamePhase` enum
    - Implement `GameMode` enum
    - _Requirements: 1.1_

- [ ] 13. Implement BoardRenderer for game visualization
  - [ ] 13.1 Create BoardRenderer class with Canvas API
    - Initialize canvas and 2D context
    - Implement `drawBoard()` method to draw three concentric squares with connecting lines
    - Implement `drawPieces()` method to draw circles for pieces
    - Implement `getPositionCoordinates(position)` method for position mapping
    - Implement `render()` method to redraw entire board
    - Implement responsive scaling based on canvas size
    - _Requirements: 2.1, 2.2, 9.4_
  
  - [ ] 13.2 Write unit tests for BoardRenderer
    - Test position coordinate calculations
    - Test that all 24 positions have valid coordinates
    - Test responsive scaling calculations
    - _Requirements: 2.1, 9.4_

- [ ] 14. Add visual feedback and highlighting
  - [ ] 14.1 Implement highlighting system
    - Implement `highlightValidMoves(positions[])` method
    - Implement `clearHighlights()` method
    - Implement hover effect for valid positions
    - Implement visual distinction for empty, white, and black pieces
    - Add visual feedback for current player's turn
    - Add visual feedback for current game phase
    - Add display for remaining pieces during placement
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ] 14.2 Write unit tests for highlighting
    - Test that highlighting marks correct positions
    - Test that clearing removes all highlights
    - _Requirements: 2.3, 2.4_


- [ ] 15. Implement animation system
  - [ ] 15.1 Create Animation class and queue system
    - Create `Animation` interface with update and complete callbacks
    - Implement `PlacementAnimation` class (fade in over 300ms)
    - Implement `MovementAnimation` class (slide from position to position over 300ms)
    - Implement `RemovalAnimation` class (fade out over 300ms)
    - Implement `MillAnimation` class (highlight mill positions briefly)
    - Add animation queue to BoardRenderer
    - Implement `gameLoop(timestamp)` using requestAnimationFrame
    - Process animations in queue and update rendering
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 15.2 Write unit tests for animation system
    - Test animation queue management
    - Test animation timing calculations
    - Test animation completion callbacks
    - _Requirements: 10.1, 10.2_

- [ ] 16. Implement user input handling
  - [ ] 16.1 Add click/touch event handling
    - Add click event listener to canvas
    - Add touch event listener for mobile support
    - Implement position detection from click/touch coordinates
    - Implement `handlePositionClick(position)` method
    - Validate moves before sending to backend
    - Provide immediate visual feedback on invalid moves
    - _Requirements: 2.3, 2.4, 9.5_
  
  - [ ] 16.2 Write unit tests for input handling
    - Test coordinate to position mapping
    - Test click detection for all 24 positions
    - Test touch event handling
    - _Requirements: 9.5_

### Phase 6: Game Controller and Local Gameplay

- [ ] 17. Implement GameController for game orchestration
  - [ ] 17.1 Create GameController class
    - Implement constructor with game mode parameter
    - Implement `startGame()` method
    - Implement `handlePositionClick(position)` method with game logic
    - Implement state management for current game
    - Implement move validation and application
    - Integrate with BoardRenderer for visual updates
    - Handle placement phase, movement phase, and flying phase
    - Handle mill formation and piece removal
    - Detect and display game end conditions
    - _Requirements: 1.1, 1.2, 1.9, 4.2_
  
  - [ ] 17.2 Write integration tests for GameController
    - Test complete game flow from start to finish
    - Test phase transitions
    - Test mill formation and removal
    - Test win condition detection
    - _Requirements: 1.1, 1.2, 1.5_

- [ ] 18. Implement single-player mode with AI
  - [ ] 18.1 Add AI integration to GameController
    - Implement `handleAIMove()` method
    - Call backend API to get AI move
    - Apply AI move to game state
    - Animate AI move
    - Add visual indication when AI is thinking
    - Implement color selection (player chooses white or black)
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [ ] 18.2 Write integration tests for single-player mode
    - Test that AI makes moves automatically
    - Test that AI moves are legal
    - Test complete single-player game
    - _Requirements: 3.1, 3.2_

- [ ] 19. Implement local two-player mode
  - [ ] 19.1 Add local multiplayer to GameController
    - Implement turn-based control for two local players
    - Display current player indicator
    - Alternate control between players
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 19.2 Write integration tests for local two-player mode
    - Test turn alternation
    - Test that both players can make moves
    - Test complete two-player game
    - _Requirements: 4.1, 4.2_

- [ ] 20. Checkpoint - Local gameplay complete
  - Ensure single-player and local two-player modes work end-to-end
  - Test on different screen sizes
  - Ask the user if questions arise


### Phase 7: State Persistence

- [ ] 21. Implement local storage for game state
  - [ ] 21.1 Create LocalStorage utility class
    - Implement `saveGameState(GameState)` method
    - Implement `loadGameState()` method
    - Implement `clearGameState()` method
    - Serialize game state to JSON
    - Handle localStorage unavailability gracefully
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ] 21.2 Integrate persistence with GameController
    - Save state after each move in local games
    - Load saved state on application start
    - Offer resume option if saved game exists
    - Clear saved state on game completion
    - Clear saved state on explicit abandonment
    - Do not persist online multiplayer games
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 21.3 Write property test for save-load round trip
    - **Property 18: Save-Load Round Trip**
    - **Validates: Requirements 11.1**
    - Test that saving and loading produces equivalent state
  
  - [ ] 21.4 Write property test for persistence cleanup
    - **Property 19: Persistence Cleanup**
    - **Validates: Requirements 11.3**
    - Test that completed games clear saved state
    - Test that abandoned games clear saved state
  
  - [ ] 21.5 Write unit tests for localStorage handling
    - Test save and load operations
    - Test handling of unavailable localStorage
    - Test handling of corrupted data
    - _Requirements: 11.1, 11.2_

### Phase 8: UI and Menus

- [ ] 22. Implement UIManager for menus and dialogs
  - [ ] 22.1 Create UIManager class
    - Implement `showMainMenu()` method with game mode buttons
    - Implement `showGameModeSelection()` method
    - Implement `showColorSelection()` method for single-player
    - Implement `showGameResult(winner)` method
    - Implement `showErrorDialog(message)` method
    - Implement `showResumeGameDialog()` method
    - Use HTML dialog elements for modals
    - _Requirements: 3.5, 4.1_
  
  - [ ] 22.2 Create CSS styling for UI
    - Design modern, clean main menu
    - Style game board and pieces with cohesive color scheme
    - Style dialogs and buttons
    - Implement hover effects and transitions
    - Ensure consistent typography
    - _Requirements: 10.4_
  
  - [ ] 22.3 Write unit tests for UIManager
    - Test menu display and navigation
    - Test dialog creation and closing
    - _Requirements: 3.5, 4.1_

- [ ] 23. Implement responsive design
  - [ ] 23.1 Add responsive CSS and layout
    - Implement CSS Grid/Flexbox for responsive layout
    - Add media queries for mobile (min 375px) and desktop (min 1024px)
    - Scale canvas proportionally to fit screen
    - Ensure touch targets are minimum 44x44 pixels on mobile
    - Test layout at various viewport sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_
  
  - [ ] 23.2 Write property test for state preservation during resize
    - **Property 20: State Preservation During Resize**
    - **Validates: Requirements 9.3**
    - Test that resize events don't modify game state


### Phase 9: Tutorial Mode

- [ ] 24. Implement tutorial system
  - [ ] 24.1 Create TutorialController class
    - Define tutorial steps as data structure
    - Implement `start()` method to begin tutorial
    - Implement `nextStep()` method to advance
    - Implement `previousStep()` method to go back
    - Implement `skip()` method to exit tutorial
    - Implement step execution with instructions and highlights
    - Implement action validation for each step
    - _Requirements: 7.1, 7.5_
  
  - [ ] 24.2 Create tutorial content
    - Step 1: Introduction to Nine Men's Morris
    - Step 2: Explain the board layout (24 positions, 3 squares)
    - Step 3: Placement phase - guide placing first piece
    - Step 4: Placement phase - guide placing more pieces
    - Step 5: Forming a mill - guide creating first mill
    - Step 6: Removing opponent piece after mill
    - Step 7: Movement phase - guide moving pieces
    - Step 8: Flying phase - explain and demonstrate
    - Step 9: Win conditions - explain how to win
    - Step 10: Completion - offer practice game vs AI
    - _Requirements: 7.2, 7.3, 7.6_
  
  - [ ] 24.3 Write property test for tutorial action validation
    - **Property 17: Tutorial Action Validation**
    - **Validates: Requirements 7.4**
    - Test that correct actions advance tutorial
    - Test that incorrect actions provide feedback without advancing
  
  - [ ] 24.4 Write unit tests for tutorial navigation
    - Test step progression
    - Test skip functionality
    - Test back navigation
    - _Requirements: 7.5_

- [ ] 25. Checkpoint - Tutorial and UI complete
  - Test complete tutorial flow
  - Verify responsive design on mobile and desktop
  - Ask the user if questions arise

### Phase 10: Online Multiplayer - Backend

- [ ] 26. Configure Spring WebSocket with STOMP
  - [ ] 26.1 Set up WebSocket configuration
    - Create `WebSocketConfig` class extending `AbstractWebSocketMessageBrokerConfigurer`
    - Configure STOMP endpoint with SockJS fallback
    - Configure message broker for pub/sub
    - Set application destination prefix
    - _Requirements: 12.3_
  
  - [ ] 26.2 Create WebSocket message DTOs
    - Create `PlacePieceMessage` class
    - Create `MovePieceMessage` class
    - Create `RemovePieceMessage` class
    - Create `ChatMessage` class
    - Create `JoinMatchmakingMessage` class
    - Create `GameStateUpdate` class
    - Create `GameStartMessage` class
    - Create `GameEndMessage` class
    - Create `ChatMessageBroadcast` class
    - Create `OpponentDisconnectedMessage` class
    - _Requirements: 5.1, 6.1_

- [ ] 27. Implement MatchmakingService
  - [ ] 27.1 Create MatchmakingService class
    - Implement `joinQueue(playerId, sessionId)` method
    - Implement `leaveQueue(playerId)` method
    - Implement `tryMatchPlayers()` private method
    - Implement `notifyPlayersOfMatch(player1, player2, gameId)` method
    - Implement `handleDisconnect(playerId)` method
    - Use ConcurrentLinkedQueue for thread-safe queue
    - Use SimpMessagingTemplate for WebSocket messaging
    - _Requirements: 5.1, 5.2_
  
  - [ ] 27.2 Write property test for matchmaking pairing
    - **Property 13: Matchmaking Pairing**
    - **Validates: Requirements 5.1, 5.2**
    - Test that two queued players get paired and assigned a game
    - Test that colors are randomly assigned
  
  - [ ] 27.3 Write unit tests for matchmaking
    - Test queue join and leave
    - Test player pairing logic
    - Test disconnect handling
    - _Requirements: 5.1_


- [ ] 28. Implement GameWebSocketController
  - [ ] 28.1 Create WebSocket controller for game moves
    - Create `GameWebSocketController` class with `@Controller` annotation
    - Implement `handlePlacePiece(@MessageMapping("/game/place"))` method
    - Implement `handleMovePiece(@MessageMapping("/game/move"))` method
    - Implement `handleRemovePiece(@MessageMapping("/game/remove"))` method
    - Validate moves and apply to game state
    - Broadcast game state updates to both players
    - Handle errors and send error messages
    - _Requirements: 5.3_
  
  - [ ] 28.2 Add chat message handling
    - Implement `handleChatMessage(@MessageMapping("/chat/send"))` method
    - Implement content filtering for inappropriate language
    - Broadcast chat messages to both players in game
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ] 28.3 Add matchmaking message handling
    - Implement `handleJoinMatchmaking(@MessageMapping("/matchmaking/join"))` method
    - Implement `handleLeaveMatchmaking(@MessageMapping("/matchmaking/leave"))` method
    - Integrate with MatchmakingService
    - _Requirements: 5.1_
  
  - [ ] 28.4 Write property test for game state synchronization
    - **Property 14: Game State Synchronization**
    - **Validates: Requirements 5.3**
    - Test that both players receive identical state updates
  
  - [ ] 28.5 Write property test for chat message delivery
    - **Property 15: Chat Message Delivery**
    - **Validates: Requirements 6.2, 6.3**
    - Test that messages are delivered with correct content
  
  - [ ] 28.6 Write property test for chat content filtering
    - **Property 16: Chat Content Filtering**
    - **Validates: Requirements 6.4**
    - Test that inappropriate language is filtered or blocked
  
  - [ ] 28.7 Write integration tests for WebSocket controller
    - Test complete game flow over WebSocket
    - Test chat message routing
    - Test matchmaking flow
    - Test disconnect handling
    - _Requirements: 5.3, 6.2_

- [ ] 29. Implement disconnect and reconnect handling
  - [ ] 29.1 Add session management
    - Track WebSocket sessions for each player
    - Implement disconnect detection
    - Implement `handleDisconnect(sessionId)` method
    - Notify opponent when player disconnects
    - Preserve game state for 60 seconds
    - Allow reconnection within timeout
    - Declare winner if opponent doesn't reconnect
    - _Requirements: 5.4_
  
  - [ ] 29.2 Write unit tests for disconnect handling
    - Test disconnect notification
    - Test game state preservation
    - Test reconnection within timeout
    - Test timeout and winner declaration
    - _Requirements: 5.4_

- [ ] 30. Checkpoint - Backend multiplayer complete
  - Test WebSocket connections and message routing
  - Test matchmaking with multiple concurrent users
  - Test disconnect and reconnect scenarios
  - Ask the user if questions arise

### Phase 11: Online Multiplayer - Frontend

- [ ] 31. Implement WebSocketClient for frontend
  - [ ] 31.1 Create WebSocketClient class
    - Install and configure STOMP.js library
    - Implement `connect()` method with STOMP over WebSocket
    - Implement `disconnect()` method
    - Implement `sendMove(move)` method
    - Implement `sendChatMessage(content)` method
    - Implement `joinMatchmaking()` method
    - Implement `leaveMatchmaking()` method
    - Subscribe to game state updates
    - Subscribe to chat messages
    - Subscribe to matchmaking notifications
    - Handle connection errors with retry logic
    - _Requirements: 5.1, 5.3, 6.2_
  
  - [ ] 31.2 Add message handlers
    - Implement `onGameStateUpdate(update)` handler
    - Implement `onGameStart(message)` handler
    - Implement `onGameEnd(message)` handler
    - Implement `onChatMessage(message)` handler
    - Implement `onOpponentDisconnected(message)` handler
    - Update GameController with received state
    - Update UI with game events
    - _Requirements: 5.3, 5.4, 5.5, 6.2_
  
  - [ ] 31.3 Write unit tests for WebSocketClient
    - Test connection and disconnection
    - Test message sending
    - Test message receiving and handling
    - Test reconnection logic
    - _Requirements: 5.3, 6.2_


- [ ] 32. Implement online multiplayer UI
  - [ ] 32.1 Add matchmaking UI
    - Create matchmaking dialog with "Finding match..." indicator
    - Add cancel button to leave queue
    - Display match found notification
    - Show opponent information when matched
    - _Requirements: 5.1_
  
  - [ ] 32.2 Add chat UI
    - Create chat panel with message history
    - Add chat input field
    - Add send button
    - Display messages with sender and timestamp
    - Add mute button to disable chat
    - Implement chat filtering on frontend
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [ ] 32.3 Add disconnect handling UI
    - Display "Opponent disconnected" notification
    - Show "Wait" and "Claim Victory" buttons
    - Display reconnection countdown
    - Handle opponent reconnection
    - _Requirements: 5.4_
  
  - [ ] 32.4 Add post-game UI
    - Display game result to both players
    - Show "Rematch" button
    - Show "Return to Menu" button
    - _Requirements: 5.5, 5.6_

- [ ] 33. Integrate online multiplayer with GameController
  - [ ] 33.1 Add online mode to GameController
    - Modify GameController to support online mode
    - Send moves via WebSocket instead of local application
    - Receive and apply opponent moves from WebSocket
    - Disable local move application (server is source of truth)
    - Handle latency and waiting for opponent
    - _Requirements: 5.2, 5.3_
  
  - [ ] 33.2 Write integration tests for online multiplayer
    - Test complete online game flow
    - Test chat during game
    - Test disconnect and reconnect
    - Test rematch functionality
    - _Requirements: 5.2, 5.3, 6.2_

- [ ] 34. Checkpoint - Online multiplayer complete
  - Test matchmaking with multiple browser windows
  - Test complete online game with chat
  - Test disconnect scenarios
  - Ask the user if questions arise

### Phase 12: Information Page

- [ ] 35. Create information page with game history and rules
  - [ ] 35.1 Write original content
    - Research Nine Men's Morris history (ancient origins, archaeological finds)
    - Write engaging historical overview (original content, not copied)
    - Write clear, accessible rules explanation
    - Explain all three game phases
    - Explain mill formation and piece removal
    - Explain win conditions
    - _Requirements: 8.1, 8.2_
  
  - [ ] 35.2 Create information page HTML and styling
    - Create info.html page
    - Add navigation from main menu
    - Create visual diagrams for board layout
    - Create diagrams for mill examples
    - Create diagrams for movement rules
    - Style page with consistent design
    - Ensure page is accessible without starting game
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [ ] 35.3 Write tests for information page
    - Test that page is accessible from main menu
    - Test that page contains all required sections
    - Test that diagrams are present
    - _Requirements: 8.4_

### Phase 13: End-to-End Testing

- [ ] 36. Set up Playwright for E2E testing
  - [ ] 36.1 Configure Playwright
    - Install Playwright 1.49
    - Configure playwright.config.ts for multiple browsers
    - Set up test projects for Chrome, Firefox, Safari, Edge
    - Set up mobile device emulation (iPhone, iPad, Android)
    - Configure screenshot and video recording
    - _Requirements: 9.1, 9.2_


- [ ] 37. Write E2E tests for visual and responsive design
  - [ ] 37.1 Write tests for desktop rendering
    - Test board rendering at 1920x1080 with screenshot comparison
    - Test board rendering at 1366x768 with screenshot comparison
    - Test board rendering at 1024x768 with screenshot comparison
    - _Requirements: 9.1_
  
  - [ ] 37.2 Write tests for mobile rendering
    - Test board rendering on iPhone SE (375x667) with screenshot
    - Test board rendering on iPhone 12 (390x844) with screenshot
    - Test board rendering on iPad (768x1024) with screenshot
    - Test touch target sizes (minimum 44x44 pixels)
    - _Requirements: 9.2, 9.6_
  
  - [ ] 37.3 Write tests for responsive behavior
    - Test layout adaptation during window resize
    - Test that game state is preserved during resize
    - _Requirements: 9.3_

- [ ] 38. Write E2E tests for game flows
  - [ ] 38.1 Write test for single-player game (player wins)
    - Start single-player mode
    - Play through complete game with winning moves
    - Verify win notification
    - _Requirements: 3.1_
  
  - [ ] 38.2 Write test for single-player game (AI wins)
    - Start single-player mode
    - Make suboptimal moves
    - Verify AI wins
    - _Requirements: 3.1_
  
  - [ ] 38.3 Write test for local two-player game
    - Start local two-player mode
    - Verify turn indicator switches
    - Play through complete game
    - Verify game result
    - _Requirements: 4.1, 4.2_
  
  - [ ] 38.4 Write test for tutorial completion
    - Start tutorial mode
    - Step through all tutorial steps
    - Verify completion and practice offer
    - _Requirements: 7.1, 7.6_
  
  - [ ] 38.5 Write test for online multiplayer
    - Create two browser contexts (two players)
    - Both join matchmaking
    - Verify match found
    - Play moves and verify synchronization
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 38.6 Write test for chat functionality
    - Set up online game with two players
    - Send messages between players
    - Verify message delivery
    - Test mute functionality
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [ ] 38.7 Write test for disconnect scenario
    - Set up online game
    - Disconnect one player
    - Verify disconnect notification
    - Verify wait/claim victory options
    - _Requirements: 5.4_
  
  - [ ] 38.8 Write test for game state persistence
    - Start single-player game
    - Make several moves
    - Close and reopen browser
    - Verify resume offer
    - Verify game state restored
    - _Requirements: 11.1, 11.2_

- [ ] 39. Write E2E tests for animations and performance
  - [ ] 39.1 Write test for animation smoothness
    - Monitor frame rate during animations
    - Verify FPS is above 55 (close to 60)
    - _Requirements: 10.5_
  
  - [ ] 39.2 Write test for visual feedback timing
    - Measure time from click to visual feedback
    - Verify feedback appears within 100ms
    - _Requirements: 10.6_

- [ ] 40. Write E2E tests for input methods and accessibility
  - [ ] 40.1 Write test for mouse input
    - Test clicking positions with mouse
    - Verify moves are registered
    - _Requirements: 9.5_
  
  - [ ] 40.2 Write test for touch input
    - Test tapping positions with touch
    - Verify moves are registered
    - _Requirements: 9.5_
  
  - [ ] 40.3 Write test for keyboard navigation
    - Test tabbing through interactive elements
    - Test activating buttons with Enter
    - _Requirements: Accessibility_
  
  - [ ] 40.4 Write test for screen reader compatibility
    - Verify ARIA labels are present
    - Verify role attributes are correct
    - Verify aria-live regions for dynamic content
    - _Requirements: Accessibility_

- [ ] 41. Final checkpoint - All tests passing
  - Run complete test suite (unit, property, integration, E2E)
  - Verify all tests pass across all browsers
  - Generate code coverage report
  - Ask the user if questions arise


### Phase 14: Polish and Deployment

- [ ] 42. Implement error handling and edge cases
  - [ ] 42.1 Add comprehensive error handling
    - Add try-catch blocks for all network operations
    - Implement graceful degradation for localStorage failures
    - Add error boundaries for rendering failures
    - Implement fallback for WebSocket connection failures
    - Add user-friendly error messages for all error scenarios
    - _Requirements: 12.4_
  
  - [ ] 42.2 Write tests for error scenarios
    - Test localStorage unavailable
    - Test WebSocket connection failure
    - Test network timeout
    - Test invalid game state
    - Test concurrent modification
    - _Requirements: 12.4_

- [ ] 43. Optimize performance and bundle size
  - [ ] 43.1 Optimize frontend bundle
    - Run Vite production build
    - Analyze bundle size with rollup-plugin-visualizer
    - Code-split if necessary
    - Minify CSS and JavaScript
    - Optimize images and assets
    - _Requirements: 10.5_
  
  - [ ] 43.2 Optimize backend performance
    - Profile AI performance at different depths
    - Optimize minimax algorithm if needed
    - Add caching for frequently accessed game states
    - Implement game cleanup scheduler
    - _Requirements: 3.2_

- [ ] 44. Add final visual polish
  - [ ] 44.1 Refine visual design
    - Fine-tune color scheme for consistency
    - Add subtle shadows and depth
    - Polish button hover and active states
    - Add smooth transitions for all UI changes
    - Ensure typography is consistent and readable
    - Add favicon and app icons
    - _Requirements: 10.4_
  
  - [ ] 44.2 Add sound effects (optional enhancement)
    - Add piece placement sound
    - Add piece movement sound
    - Add mill formation sound
    - Add game end sound
    - Add mute button for sounds
    - Note: This is an optional enhancement beyond requirements

- [ ] 45. Create deployment configuration
  - [ ] 45.1 Set up production build
    - Configure Maven for production build
    - Configure Vite for production build
    - Set up Spring Boot to serve frontend static files
    - Configure WebSocket for production (wss://)
    - Create application.properties for production
    - _Requirements: 12.5_
  
  - [ ] 45.2 Create deployment documentation
    - Write deployment instructions
    - Document environment variables
    - Document system requirements
    - Create Docker configuration (optional)
    - Update README with deployment steps
    - _Requirements: 12.5_

- [ ] 46. Final testing and quality assurance
  - [ ] 46.1 Run complete test suite
    - Run all unit tests (Java and TypeScript)
    - Run all property tests (100+ iterations each)
    - Run all integration tests
    - Run all E2E tests across all browsers
    - Verify code coverage meets 80% threshold for game engine
    - _Requirements: All_
  
  - [ ] 46.2 Perform manual testing
    - Test subjective quality (animations feel smooth, design is appealing)
    - Test on real mobile devices
    - Test on slow network connections
    - Test with browser extensions enabled
    - Have someone unfamiliar try the tutorial
    - Gather feedback and make final adjustments
    - _Requirements: All_

- [ ] 47. Final checkpoint - Project complete
  - All automated tests passing
  - Manual testing completed
  - Documentation complete
  - Ready for deployment and portfolio showcase

## Notes

- All test tasks are required to ensure comprehensive quality assurance
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- E2E tests provide comprehensive coverage of user flows and visual behavior
- The implementation follows a bottom-up approach: core engine → AI → frontend → multiplayer
- Each phase builds on previous work, ensuring continuous integration

