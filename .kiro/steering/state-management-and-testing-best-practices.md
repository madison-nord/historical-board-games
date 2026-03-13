# State Management and Testing Best Practices

## Core Principle

**State management code requires deep understanding of lifecycle and relationships. Tests must verify actual behavior, not just compilation.**

## Preserving Future-Use Code

### The Problem

When implementing features incrementally, you may add parameters or fields that aren't immediately used but are required for future tasks. Compiler warnings about unused code can tempt you to remove them.

### ❌ WRONG Approach

```java
// Removing unused parameter to eliminate warning
public void joinQueue(String playerId) {  // sessionId removed!
    // ...
}
```

**Why this is wrong:**
- Breaks future integration that depends on this parameter
- Forces rework when the parameter is needed later
- Wastes time fixing what wasn't broken

### ✅ CORRECT Approach

```java
@SuppressWarnings("unused") // sessionId will be used in Task 31 for WebSocket message routing
private static class QueuedPlayer {
    final String playerId;
    final String sessionId;  // Preserved for future use
    
    QueuedPlayer(String playerId, String sessionId) {
        this.playerId = playerId;
        this.sessionId = sessionId;
    }
}
```

**Best practices:**
1. Use `@SuppressWarnings("unused")` with a comment explaining when/why it will be used
2. Reference the specific task or feature that will use it
3. Never remove code just to eliminate warnings
4. If unsure whether code is needed, ask before removing

## State Management Lifecycle Understanding

### The Problem

State management often involves multiple related data structures that must be kept in sync. Modifying one without understanding the full lifecycle can break functionality.

### Real Example: Session Reconnection

**Scenario:** Detecting when a player reconnects after disconnecting

**State structures:**
```java
ConcurrentHashMap<String, String> sessionToPlayer;  // sessionId -> playerId
ConcurrentHashMap<String, String> playerToSession;  // playerId -> sessionId
```

**Lifecycle:**
1. **Connect**: Both maps updated
2. **Disconnect**: `sessionToPlayer` removed (session dead), `playerToSession` kept (for reconnection detection)
3. **Reconnect**: New session registered, old sessionId detected in `playerToSession`, reconnection logic triggered
4. **Cleanup**: Both maps cleaned when game ends

### ❌ WRONG Approach

```java
public void handleDisconnect(String sessionId) {
    String playerId = sessionToPlayer.remove(sessionId);
    playerToSession.remove(playerId);  // WRONG: Removes reconnection detection ability!
}
```

### ✅ CORRECT Approach

```java
public void handleDisconnect(String sessionId) {
    String playerId = sessionToPlayer.remove(sessionId);
    // Keep playerToSession mapping for reconnection detection
    // It will be cleaned up when game ends or player wasn't in a game
}

public boolean isPlayerConnected(String playerId) {
    String sessionId = playerToSession.get(playerId);
    // Check BOTH maps: player has session ID AND that session is active
    return sessionId != null && sessionToPlayer.containsKey(sessionId);
}
```

**Key lessons:**
1. **Understand the full lifecycle** before modifying state
2. **Bidirectional relationships** may need asymmetric updates
3. **Query methods** must account for partial state (disconnected but not cleaned up)
4. **Document why** state is preserved in comments

## Making Code Testable

### The Problem

Code with hard-coded timeouts, external dependencies, or async operations can be difficult or impossible to test properly.

### ❌ WRONG Approach

```java
private static final int TIMEOUT_SECONDS = 60;

public void scheduleTimeout() {
    scheduler.schedule(() -> handleTimeout(), TIMEOUT_SECONDS, TimeUnit.SECONDS);
}

// Test with lazy comment
@Test
void testTimeout() {
    service.scheduleTimeout();
    // TODO: Can't test this without waiting 60 seconds
    // Just verify the schedule was called
}
```

**Why this is wrong:**
- Test doesn't verify actual behavior
- Timeout logic could be completely broken and test would pass
- Lazy comments like "TODO" or "we'll test this later" are unacceptable

### ✅ CORRECT Approach

```java
private static final int DEFAULT_TIMEOUT_SECONDS = 60;
private final int timeoutSeconds;

// Public constructor uses default
public SessionManagementService(SimpMessagingTemplate template, GameService gameService) {
    this(template, gameService, DEFAULT_TIMEOUT_SECONDS);
}

// Package-private constructor for testing
SessionManagementService(SimpMessagingTemplate template, GameService gameService, int timeoutSeconds) {
    this.timeoutSeconds = timeoutSeconds;
    // ...
}

// Test with actual verification
@Test
void testTimeout() throws InterruptedException {
    // Use 1 second timeout for testing
    SessionManagementService service = new SessionManagementService(template, gameService, 1);
    
    service.scheduleTimeout();
    
    // Actually wait for timeout
    Thread.sleep(1500);
    
    // Verify timeout behavior occurred
    verify(messagingTemplate).convertAndSendToUser(eq(winnerId), eq("/queue/game-end"), any());
}
```

**Best practices:**
1. **Make timeouts configurable** with package-private test constructors
2. **Actually test async behavior** by waiting and verifying results
3. **Use short timeouts in tests** (1-2 seconds) instead of production values (60 seconds)
4. **Verify complete behavior** including side effects and state changes
5. **Never leave TODO comments** about testing - make it testable now

## Complete Test Coverage

### The Problem

Tests that only verify partial behavior or just check that code runs without errors don't catch bugs.

### ❌ WRONG Test

```java
@Test
void testDisconnectTimeout() {
    service.handleDisconnect(sessionId);
    
    // Only verifies disconnect notification, not timeout behavior
    verify(messagingTemplate).convertAndSendToUser(
        eq(opponentId), 
        eq("/queue/opponent-disconnected"), 
        any()
    );
    
    // Missing: actual timeout verification, winner declaration, cleanup
}
```

### ✅ CORRECT Test

```java
@Test
void testDisconnectTimeout() throws InterruptedException {
    // Arrange
    service.registerSession(sessionId, playerId);
    service.associatePlayerWithGame(playerId, gameId);
    
    // Act
    service.handleDisconnect(sessionId);
    
    // Verify disconnect notification
    verify(messagingTemplate, times(1)).convertAndSendToUser(
        eq(opponentId), eq("/queue/opponent-disconnected"), any()
    );
    
    // Wait for timeout to fire
    Thread.sleep(1500);
    
    // Verify complete timeout behavior
    ArgumentCaptor<GameEndMessage> captor = ArgumentCaptor.forClass(GameEndMessage.class);
    verify(messagingTemplate, times(1)).convertAndSendToUser(
        eq(opponentId), eq("/queue/game-end"), captor.capture()
    );
    
    GameEndMessage message = captor.getValue();
    assertEquals(gameId, message.getGameId());
    assertEquals(PlayerColor.BLACK, message.getWinner());
    assertEquals("Opponent disconnected", message.getReason());
    
    // Verify cleanup
    verify(gameService, times(1)).forfeitGame(gameId, playerId);
}
```

**Test completeness checklist:**
- [ ] Setup: All required state is initialized
- [ ] Action: The operation being tested is performed
- [ ] Immediate effects: Direct results are verified
- [ ] Async effects: Wait for and verify delayed results
- [ ] Side effects: Verify all state changes and method calls
- [ ] Cleanup: Verify resources are properly released

## Bidirectional Relationship Management

### Pattern: Two-Way Mappings

When maintaining bidirectional relationships (A→B and B→A), updates may need to be asymmetric based on the operation.

**Example: Session ↔ Player mapping**

```java
// Maps sessionId -> playerId
ConcurrentHashMap<String, String> sessionToPlayer;

// Maps playerId -> sessionId  
ConcurrentHashMap<String, String> playerToSession;
```

**Operations:**

| Operation | sessionToPlayer | playerToSession | Reason |
|-----------|----------------|-----------------|---------|
| Register | Add | Add | Both directions needed |
| Disconnect (in game) | Remove | Keep | Session dead, but need to detect reconnection |
| Disconnect (not in game) | Remove | Remove | No reconnection needed |
| Reconnect | Add new | Update | New session, detect via old session ID |
| Game end | N/A | Remove | Cleanup, no more reconnection |

**Query method must check both:**

```java
public boolean isPlayerConnected(String playerId) {
    String sessionId = playerToSession.get(playerId);
    // Player is connected only if they have a session ID AND that session is active
    return sessionId != null && sessionToPlayer.containsKey(sessionId);
}
```

**Key principles:**
1. **Document the lifecycle** of each relationship
2. **Asymmetric updates** are often correct for state transitions
3. **Query methods** must handle partial states
4. **Cleanup** must remove from all related structures

## Warning Suppression Guidelines

### When to Suppress Warnings

✅ **Appropriate uses:**
- Unused parameters/fields needed for future tasks
- Null safety warnings when mocks are guaranteed non-null in test context
- Framework-called methods that appear unused (JUnit `@BeforeEach`)

❌ **Inappropriate uses:**
- Suppressing warnings instead of fixing actual problems
- Blanket suppressions without specific justification
- Suppressing errors (not warnings)

### Proper Suppression Format

```java
@SuppressWarnings("unused") // Used by JUnit framework
@BeforeEach
void setUp() { ... }

@SuppressWarnings("unused") // sessionId will be used in Task 31 for message routing
private final String sessionId;

@SuppressWarnings("null") // Mock objects are non-null in test context
@Test
void testSomething() { ... }
```

**Format:**
1. Use specific warning type, not `"all"`
2. Add comment explaining WHY suppression is needed
3. Reference future task if applicable
4. Keep suppression scope minimal (method > class > package)

## Summary: State Management Checklist

Before modifying state management code:

- [ ] Understand the complete lifecycle of all related state
- [ ] Identify all bidirectional relationships
- [ ] Determine which operations need symmetric vs asymmetric updates
- [ ] Update query methods to handle partial states
- [ ] Make async operations testable with configurable timeouts
- [ ] Write tests that verify complete behavior, not just compilation
- [ ] Preserve future-use code with suppressions and comments
- [ ] Document state transitions and cleanup requirements

**Remember:** State management bugs are often subtle and only appear in specific scenarios (like reconnection). Invest time in understanding the full picture before making changes.
