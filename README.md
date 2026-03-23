# Historical Board Games

A modern web platform for playing classic strategy board games from history. This portfolio project brings ancient games to life with AI opponents, local and online multiplayer, and interactive tutorials.

## Current Games

### Nine Men's Morris (Mills)
A classic strategy game with origins dating back thousands of years. Features single-player AI, local multiplayer, online multiplayer with matchmaking, and an interactive tutorial.

## Features

### Game Modes
- 🎮 **Single Player** — Play against an AI opponent powered by minimax with alpha-beta pruning, iterative deepening, transposition tables, and killer move heuristics
- 👥 **Local Two-Player** — Play with a friend on the same device with turn-based controls
- 🌐 **Online Multiplayer** — Real-time matchmaking and gameplay over WebSocket (STOMP protocol)
- 💬 **In-Game Chat** — Communicate with opponents during online matches with mute support

### Learning & Information
- 📚 **Interactive Tutorial** — 10-step guided walkthrough covering placement, mills, movement, flying, and win conditions
- 📖 **Information Page** — Game history, rules reference, and strategy tips with interactive board diagrams

### Technical Features
- 📱 **Responsive Design** — Seamless experience on desktop (1024px+) and mobile (375px+) with touch support
- ✨ **Smooth Animations** — 60 FPS rendering with placement, movement, removal, and mill highlight animations
- 🔊 **Sound Effects** — Audio feedback for placement, movement, mill formation, and game end (with mute toggle)
- 💾 **Game Persistence** — Local games auto-save to localStorage; resume on return
- 🎯 **Game Selection** — Landing page for navigating between historical board games
- 🌍 **Extensible Architecture** — Modular design built to add more games

## Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 25 | Language runtime |
| Spring Boot | 3.4.x | Web framework, WebSocket, dependency injection |
| Maven | 3.9.x | Build and dependency management |
| JUnit 5 | 5.x | Unit and integration testing |
| jqwik | 1.9.x | Property-based testing (100+ iterations) |
| JaCoCo | 0.8.14 | Code coverage reporting |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| TypeScript | 5.7 | Type-safe JavaScript |
| HTML5 Canvas API | — | High-performance 2D game rendering |
| Vite | 6.x | Build tool and dev server |
| Vitest | 2.x | Unit testing with V8 coverage |
| Playwright | 1.49+ | Cross-browser E2E testing |
| fast-check | 4.x | Property-based testing |
| STOMP.js | 7.x | WebSocket client for multiplayer |
| ESLint + Prettier | 10.x / 3.x | Code quality and formatting |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (TypeScript)             │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │Controllers│ │Rendering │ │    Network         │   │
│  │GameCtrl   │ │BoardRend.│ │  WebSocketClient   │   │
│  │UIManager  │ │Animations│ │  (STOMP/SockJS)    │   │
│  │Tutorial   │ │          │ │                    │   │
│  │InfoPage   │ │          │ │                    │   │
│  └─────┬─────┘ └────┬─────┘ └────────┬──────────┘   │
│        │             │                │              │
│        └─────────────┴────────────────┘              │
│                      │                               │
└──────────────────────┼───────────────────────────────┘
                       │ REST (AI) / WebSocket (Online)
┌──────────────────────┼───────────────────────────────┐
│                 Backend (Java/Spring Boot)            │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │  Controllers  │ │   Services   │ │   Engine    │  │
│  │AIRestCtrl     │ │AIService     │ │Board        │  │
│  │GameWSCtrl     │ │GameService   │ │GameState    │  │
│  │MatchmakingCtrl│ │Matchmaking   │ │RuleEngine   │  │
│  │ChatWSCtrl     │ │SessionMgmt   │ │             │  │
│  └───────┬───────┘ └──────┬───────┘ └──────┬──────┘  │
│          └────────────────┴────────────────┘         │
└──────────────────────────────────────────────────────┘
```


### Key Design Decisions
- **Game engine is pure Java** — no UI framework dependencies, immutable data structures, fully testable in isolation
- **Three-phase game flow** — Placement → Movement → Flying, with mill detection and piece removal at each phase
- **REST for stateless operations** — AI move requests send full game state, no server-side session needed
- **WebSocket for stateful operations** — Online multiplayer uses STOMP over SockJS for real-time game state sync
- **Frontend renders on Canvas** — No DOM manipulation for the board; 60 FPS game loop with `requestAnimationFrame`

## Project Structure

```
historical-board-games/
├── src/main/java/com/ninemensmorris/
│   ├── engine/              # Core game logic (Board, GameState, RuleEngine)
│   ├── service/             # Business logic (AI, Game, Matchmaking, Session)
│   ├── controller/          # REST & WebSocket controllers
│   ├── config/              # Spring config (WebSocket, SPA routing)
│   ├── dto/                 # Data transfer objects for API/WebSocket messages
│   └── model/               # Domain enums and value objects
├── src/main/resources/
│   ├── application.properties        # Default config
│   ├── application-prod.properties   # Production profile
│   └── static/                       # Built frontend (generated by prod build)
├── src/test/java/com/ninemensmorris/ # Backend tests (JUnit 5 + jqwik)
├── frontend/
│   ├── src/
│   │   ├── controllers/     # GameController, UIManager, Tutorial, InfoPage, etc.
│   │   ├── rendering/       # BoardRenderer, animations (placement, movement, removal, mill)
│   │   ├── network/         # WebSocketClient (STOMP/SockJS)
│   │   ├── models/          # TypeScript interfaces (GameState, Move, enums)
│   │   ├── utils/           # LocalStorage, SoundManager, logger
│   │   └── styles/          # CSS
│   ├── tests/e2e/           # Playwright E2E tests
│   └── index.html
├── .kiro/
│   ├── specs/               # Feature and bugfix specifications
│   └── steering/            # Development guidelines
└── pom.xml
```

## Getting Started

### Prerequisites

- **Java 25** or later (`JAVA_HOME` must be set)
- **Maven 3.9** or later
- **Node.js 20** or later
- **npm 10** or later

### Installation

```bash
git clone https://github.com/madison-nord/historical-board-games.git
cd historical-board-games
cd frontend && npm install && cd ..
mvn clean install
```

### Running the Application

#### Development Mode

Run backend and frontend separately for hot-reload:

```bash
# Terminal 1 — Backend
mvn spring-boot:run

# Terminal 2 — Frontend dev server (proxies API to backend)
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

#### Production Mode

Build everything into a single deployable JAR:

```bash
mvn clean package -Pprod
java -jar target/historical-board-games-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Open `http://localhost:8080` in your browser.

The `prod` Maven profile automatically:
1. Installs Node.js and npm via `frontend-maven-plugin`
2. Runs `npm install` and `npm run build` in the frontend directory
3. Copies the built frontend into `src/main/resources/static/`
4. Packages everything into a single executable JAR

## Deployment

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Server port |
| `SPRING_PROFILES_ACTIVE` | (none) | Set to `prod` for production |
| `WEBSOCKET_ALLOWED_ORIGINS` | `*` | Comma-separated allowed origins for WebSocket (e.g., `https://yourdomain.com`) |

### Production Configuration

The `application-prod.properties` profile provides:
- Reduced logging (`WARN` for root, `INFO` for application)
- Gzip compression for static assets (HTML, CSS, JS, JSON, SVG)
- Configurable WebSocket CORS origins
- Configurable server port

### System Requirements

- **Runtime**: Java 25 JRE
- **Build-time**: Java 25 JDK, Maven 3.9+, Node.js 20+ (handled by Maven plugin in prod profile)
- **Memory**: 256MB minimum heap recommended
- **Ports**: 8080 (default, configurable via `PORT`)

### Docker (Optional)

```dockerfile
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY target/historical-board-games-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
```

Build and run:
```bash
mvn clean package -Pprod
docker build -t historical-board-games .
docker run -p 8080:8080 -e WEBSOCKET_ALLOWED_ORIGINS=https://yourdomain.com historical-board-games
```


## API Reference

### REST Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai/move` | Request AI move for a given game state |

**AI Move Request:**
```json
{
  "board": [0, 0, 0, ...],
  "currentPlayer": "WHITE",
  "phase": "PLACEMENT",
  "whitePiecesRemaining": 9,
  "blackPiecesRemaining": 9,
  "whitePiecesOnBoard": 0,
  "blackPiecesOnBoard": 0,
  "mustRemovePiece": false,
  "moveHistory": []
}
```

### WebSocket Endpoints (STOMP over SockJS)

| Destination | Direction | Description |
|---|---|---|
| `/app/matchmaking/join` | Client → Server | Join matchmaking queue |
| `/app/matchmaking/leave` | Client → Server | Leave matchmaking queue |
| `/app/game/place` | Client → Server | Place a piece |
| `/app/game/move` | Client → Server | Move a piece |
| `/app/game/remove` | Client → Server | Remove opponent piece |
| `/app/chat/send` | Client → Server | Send chat message |
| `/topic/game/{gameId}` | Server → Client | Game state updates |
| `/topic/matchmaking/{playerId}` | Server → Client | Match found notification |
| `/queue/errors` | Server → Client | Error messages |

**WebSocket endpoint**: `/ws` with SockJS fallback

## Testing

### Test Summary

| Layer | Framework | Tests | Coverage |
|---|---|---|---|
| Backend unit + property | JUnit 5 + jqwik | 225 | 80%+ per package |
| Frontend unit + property | Vitest + fast-check | 520 | 80%+ per directory |
| Frontend E2E | Playwright | Multi-browser | Visual + functional |

### Running Tests

```bash
# Backend — all tests
mvn test

# Backend — specific test class
mvn test -Dtest=AIServiceTest

# Backend — coverage report
mvn clean test
# Open target/site/jacoco/index.html

# Frontend — all unit tests
cd frontend
npm test

# Frontend — with coverage
npm run test:coverage
# Open frontend/coverage/index.html

# Frontend — E2E tests
npm run test:e2e

# Frontend — E2E with UI
npm run test:e2e:ui

# Mutation testing (core game logic)
mvn test-compile org.pitest:pitest-maven:mutationCoverage
```

### Coverage Thresholds

**Backend (JaCoCo):**
- `engine.*` — 80% line, 75% branch
- `service.*` — 80% line, 75% branch
- `controller.*` — 80% line, 70% branch
- `config.*`, `model.*` — 70% line, 60% branch

**Frontend (Vitest V8):**
- `controllers/` — 80% statement/line/function, 75% branch
- `rendering/` — 80% statement/line/function, 75% branch
- `models/`, `utils/`, `network/` — 80% statement/line/function, 70% branch

### Property-Based Tests

Both backend (jqwik) and frontend (fast-check) use property-based testing with 100+ iterations to validate correctness properties:

- Phase identification and transitions
- Mill detection and protection rules
- Move legality invariants
- Turn alternation
- Win condition detection
- AI move legality and evaluation consistency
- Matchmaking pairing fairness
- Game state synchronization
- Save/load round-trip fidelity
- Tutorial action validation
- Responsive layout state preservation

## Game Rules

### Nine Men's Morris

Played on a board with 24 positions arranged in three concentric squares connected by lines.

**Phases:**
1. **Placement** — Players alternate placing 9 pieces each on empty positions
2. **Movement** — Players move pieces to adjacent empty positions
3. **Flying** — When a player has exactly 3 pieces remaining, they can move to any empty position

**Mills:** Forming a line of three pieces along a board line lets you remove one opponent piece (pieces in mills are protected unless no other pieces are available).

**Winning:** Reduce your opponent to fewer than 3 pieces, or leave them with no legal moves.

## AI Strategy

The AI uses minimax search with several enhancements:
- **Alpha-beta pruning** — Eliminates branches that can't affect the outcome
- **Iterative deepening** — Searches depth 1 through max depth, reordering moves by principal variation
- **Transposition table** — Caches evaluated positions across searches to avoid redundant work
- **Killer move heuristic** — Prioritizes moves that caused beta cutoffs at the same depth
- **Move repetition penalty** — Discourages the AI from reversing its previous move
- **Phase-aware evaluation** — Weights piece count, mills, potential mills, mobility, and blocked pieces differently per game phase
- **Quiescence extensions** — Extends search depth when a mill is formed to avoid horizon effects

## Development

### Code Quality

```bash
# Lint TypeScript
cd frontend
npm run lint:fix

# Format check
npm run format:check

# Type check
npm run type-check
```

### Conventional Commits

This project uses conventional commits: `type(scope): description`

Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`

### Available npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build |
| `npm test` | Run all unit tests (single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with V8 coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run type-check` | TypeScript type checking (`tsc --noEmit`) |

## Contributing

This is a portfolio project, but feedback and suggestions are welcome. Please open an issue to discuss any changes.

## License

See LICENSE file for details.

## Acknowledgments

- Nine Men's Morris implementation follows standard rules as documented on [Wikipedia](https://en.wikipedia.org/wiki/Nine_men%27s_morris)
- Built as a portfolio project demonstrating full-stack development with modern Java and TypeScript
