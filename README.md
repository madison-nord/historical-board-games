# Nine Men's Morris - Digital Board Game

A modern web-based implementation of the classic strategy board game Nine Men's Morris (also known as Mills). This portfolio project features single-player AI, local multiplayer, online multiplayer with matchmaking, and an interactive tutorial.

## Features

- 🎮 **Single Player Mode** - Play against an intelligent AI opponent using minimax algorithm
- 👥 **Local Two-Player Mode** - Play with a friend on the same device
- 🌐 **Online Multiplayer** - Real-time matchmaking and gameplay with WebSocket
- 💬 **Chat System** - Communicate with opponents during online matches
- 📚 **Interactive Tutorial** - Learn the game with step-by-step guidance
- 📖 **Information Page** - Learn about the history and rules of Nine Men's Morris
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ✨ **Modern UI** - Beautiful animations and smooth 60 FPS gameplay

## Technology Stack

### Backend
- **Java 25** - Latest LTS with modern language features
- **Spring Boot 3.4** - Web framework with WebSocket support
- **Maven 3.9** - Build and dependency management
- **JUnit 5** - Unit testing framework
- **jqwik** - Property-based testing

### Frontend
- **TypeScript 5.7** - Type-safe JavaScript
- **HTML5 Canvas API** - High-performance 2D graphics
- **Vite 6** - Fast build tool and dev server
- **Vitest** - Unit testing for frontend
- **Playwright** - End-to-end testing across browsers

## Project Structure

```
nine-mens-morris-game/
├── src/
│   ├── main/
│   │   ├── java/com/ninemensmorris/
│   │   │   ├── engine/          # Core game logic
│   │   │   ├── service/         # Business logic
│   │   │   ├── controller/      # REST & WebSocket controllers
│   │   │   └── model/           # Data models
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/          # Built frontend (generated)
│   └── test/                    # Backend tests
├── frontend/
│   ├── src/
│   │   ├── controllers/         # Game controllers
│   │   ├── rendering/           # Canvas rendering
│   │   ├── network/             # WebSocket client
│   │   ├── models/              # TypeScript interfaces
│   │   ├── utils/               # Utilities
│   │   └── styles/              # CSS
│   ├── tests/                   # Frontend tests
│   └── index.html
├── .kiro/specs/                 # Project specifications
└── pom.xml
```

## Getting Started

### Prerequisites

- **Java 25** or later
- **Maven 3.9** or later
- **Node.js 20** or later
- **npm 10** or later

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nine-mens-morris-game
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Build the project**
   ```bash
   mvn clean install
   ```

### Running the Application

#### Development Mode

1. **Start the backend** (in one terminal)
   ```bash
   mvn spring-boot:run
   ```

2. **Start the frontend dev server** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser**
   - Navigate to `http://localhost:3000`

#### Production Mode

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

2. **Run the Spring Boot application**
   ```bash
   mvn spring-boot:run
   ```

3. **Open your browser**
   - Navigate to `http://localhost:8080`

## Testing

### Backend Tests
```bash
# Run all backend tests
mvn test

# Run specific test class
mvn test -Dtest=BoardTest
```

### Frontend Tests
```bash
cd frontend

# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Game Rules

Nine Men's Morris is played on a board with 24 positions arranged in three concentric squares. The game has three phases:

1. **Placement Phase** - Players alternate placing their 9 pieces on empty positions
2. **Movement Phase** - Players move pieces to adjacent empty positions
3. **Flying Phase** - When a player has only 3 pieces left, they can move to any empty position

**Forming Mills**: When a player forms a line of three pieces (a "mill"), they remove one opponent piece.

**Winning**: A player wins when the opponent has fewer than 3 pieces or cannot make a legal move.

## Development Roadmap

See `.kiro/specs/nine-mens-morris-game/tasks.md` for the complete implementation plan.

## Contributing

This is a portfolio project, but feedback and suggestions are welcome! Please open an issue to discuss any changes.

## License

See LICENSE file for details.

## Acknowledgments

- Nine Men's Morris is an ancient strategy game with origins dating back thousands of years
- This implementation follows the standard rules as documented on Wikipedia
- Built as a portfolio project to demonstrate full-stack development skills

---

**Author**: [Your Name]  
**Portfolio**: [Your Portfolio URL]  
**Contact**: [Your Email]