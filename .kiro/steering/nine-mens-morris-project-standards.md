---
title: Nine Men's Morris Project Standards
inclusion: always
---

# Nine Men's Morris Project Standards

## Project-Specific Development Standards

**Integration with Kiro Best Practices**: This document extends the comprehensive best practices installed from the Kiro Best Practices repository, providing project-specific guidance for the Nine Men's Morris game implementation.

## Core Principles

**Always prioritize proper, professional development practices over quick fixes or workarounds.**

## Environment Setup Standards

### Tool Installation and Configuration
- **Never use temporary session-only environment variables** for development tools
- **Always install tools properly** using official installers or package managers
- **Always configure PATH permanently** through system environment variables
- **Always verify installations** with proper version checks
- **Document installation steps** for team reproducibility

### Java Development Standards (Project-Specific)
- Use Java 25 LTS as specified in project requirements
- Configure JAVA_HOME permanently in system environment variables
- Use Maven 3.9.x for build management
- Configure Maven properly with M2_HOME and system PATH
- Never rely on temporary PATH modifications

**Maven Environment Setup (Permanent Configuration)**:
- Maven installation location: `C:\tools\apache-maven-3.9.9`
- User environment variable `M2_HOME`: `C:\tools\apache-maven-3.9.9`
- User PATH includes: `C:\tools\apache-maven-3.9.9\bin`
- JAVA_HOME: `C:\Program Files\Java\jdk-25.0.2`
- These settings persist across all sessions and don't need daily reconfiguration

### Spring Boot Standards
- Follow Spring Boot 3.4.x conventions and best practices
- Use proper dependency injection patterns
- Implement WebSocket with STOMP protocol for real-time features
- Use appropriate starter dependencies
- Configure for production deployment readiness

## Nine Men's Morris Specific Standards

### Game Engine Architecture
- Keep game logic pure Java, independent of UI framework
- Implement comprehensive property-based testing with jqwik
- Use immutable data structures where possible
- Follow the three-phase game structure (Placement, Movement, Flying)
- Implement proper move validation and state management

### Frontend Standards (TypeScript + Canvas)
- Use vanilla TypeScript with Canvas API for optimal game performance
- Avoid React/Angular for game rendering (use for UI components only)
- Implement 60 FPS rendering with requestAnimationFrame
- Use proper event handling for mouse and touch input
- Implement responsive design for mobile and desktop

### Testing Standards (Project-Specific)
- Write property-based tests for all game logic using jqwik
- Each property test should run minimum 100 iterations
- Use descriptive test names referencing design properties
- Implement unit tests for specific examples and edge cases
- Use Playwright for comprehensive E2E testing across browsers
- Test visual rendering with screenshot comparisons

### Task Management Standards
- Complete one task at a time from the implementation plan
- Mark tasks as in_progress before starting work
- Mark tasks as completed only when fully implemented and tested
- Commit and push changes after each completed task
- Reference requirements in commit messages

## Code Quality Standards (Project Extensions)

### Documentation Requirements
- All public classes and methods must have comprehensive JavaDoc
- Include parameter descriptions and return value documentation
- Document complex game logic and algorithms
- Maintain clear README with setup and gameplay instructions
- Document API endpoints for multiplayer functionality

### Architecture Patterns
- Follow SOLID principles throughout the codebase
- Maintain clear separation between game engine and presentation
- Use dependency injection appropriately in Spring components
- Design for testability and maintainability
- Implement proper error handling and logging

### Performance Standards
- Maintain 60 FPS during game animations
- Ensure AI move selection completes within 2 seconds
- Optimize WebSocket communication for sub-500ms latency
- Implement efficient board state representation
- Use appropriate data structures for game operations

## Professional Problem Resolution

### When Issues Arise
1. **Stop and analyze** - Don't rush to quick fixes
2. **Research proper solutions** - Check official documentation
3. **Implement correctly** - Follow established patterns
4. **Test thoroughly** - Verify the solution works properly
5. **Document the process** - Help future developers

### Technology-Specific Approaches
- **Java/Spring Boot**: Use official Spring documentation and best practices
- **TypeScript**: Follow strict TypeScript configuration and type safety
- **Canvas API**: Use official MDN documentation for rendering techniques
- **WebSocket/STOMP**: Follow Spring WebSocket best practices
- **Testing**: Use official jqwik and JUnit 5 documentation

## Continuous Improvement

### Learning and Adaptation
- Stay updated with latest Java and Spring Boot best practices
- Regularly review and improve development processes
- Seek feedback on implementation approaches
- Document lessons learned for future reference
- Maintain high code quality standards throughout development

---

**Remember: Taking time to do things properly the first time saves significant time and effort in the long run. Professional development practices lead to maintainable, reliable, and scalable software.**